const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
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

    try {
        const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
        if (
            typeof payload !== 'object' ||
            typeof payload.user_id !== 'string' ||
            !/^MMC-\d{4}$/.test(payload.user_id)
        ) {
            return res.status(401).json({ error: 'Invalid authentication token.' });
        }

        req.user = payload;
        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Invalid or expired authentication token.' });
        }

        return next(error);
    }
};

module.exports = requireAuth;
