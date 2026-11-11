const jwt = require('jsonwebtoken');
const supabase = require('../db');

const requireAuth = async (req, res, next) => {
    const authorization = req.get('authorization');
    const [scheme, token] = authorization ? authorization.split(' ') : [];
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'A bearer token is required.' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT authentication is not configured: JWT_SECRET is missing.');
        return res.status(500).json({ error: 'Authentication is not configured.' });
    }

    let payload;
    try {
        payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Invalid or expired authentication token.' });
        }
        return next(error);
    }

    if (
        typeof payload !== 'object' ||
        typeof payload.user_id !== 'string' ||
        !/^MMC-\d{4}$/.test(payload.user_id)
    ) {
        return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    const { data: user, error } = await supabase
        .from('users')
        .select('is_active')
        .eq('user_id', payload.user_id)
        .maybeSingle();

    if (error) {
        console.error('Service authorization lookup failed:', error.message);
        return res.status(500).json({ error: 'Could not verify the account.' });
    }
    if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Active user account required.' });
    }

    req.user = payload;
    return next();
};

module.exports = requireAuth;
