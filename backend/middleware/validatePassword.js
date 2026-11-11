const validatePassword = (req, res, next) => {
    const { password } = req.body || {};
    if (typeof password !== 'string') {
        return res.status(400).json({ error: 'Password must be a string.' });
    }

    const specialCharacterCount = (password.match(/[^A-Za-z0-9]/g) || []).length;
    const isValid =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /\d/.test(password) &&
        !/\s/.test(password) &&
        specialCharacterCount >= 1 &&
        specialCharacterCount <= 2;

    if (!isValid) {
        return res.status(400).json({
            error: 'Password must be at least 8 characters, include a capital letter, a number, 1-2 special characters, and no spaces.'
        });
    }

    return next();
};

module.exports = validatePassword;
