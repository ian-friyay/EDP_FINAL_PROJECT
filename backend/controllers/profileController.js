const supabase = require('../db');

const editableFields = [
    'first_name',
    'last_name',
    'username',
    'contact_number',
    'region',
    'province',
    'city',
    'barangay'
];

const updateProfile = async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ error: 'Profile fields are required.' });
    }

    const updates = {};
    for (const field of editableFields) {
        if (!Object.hasOwn(body, field)) {
            continue;
        }

        const value = body[field];
        if (value !== null && typeof value !== 'string') {
            return res.status(400).json({ error: `${field} must be a string or null.` });
        }
        updates[field] = typeof value === 'string' ? value.trim() || null : null;
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No editable profile fields were provided.' });
    }

    const { data: user, error } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', req.user.user_id)
        .eq('is_active', true)
        .select('user_id, first_name, last_name, username, contact_number, email, region, province, city, barangay, user_type, is_active')
        .maybeSingle();

    if (error) {
        console.error('Profile update failed:', error.message);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'That username is already in use.' });
        }
        return res.status(500).json({ error: 'Could not update the profile.' });
    }
    if (!user) {
        return res.status(404).json({ error: 'Active user not found.' });
    }

    return res.status(200).json({ message: 'Profile updated successfully.', user });
};

const getProfile = async (req, res) => {
    try {
        const userId = req.user && req.user.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('user_id, first_name, last_name, username, contact_number, email, region, province, city, barangay, user_type, department, designation, is_active')
            .eq('user_id', userId)
            .maybeSingle();

        if (error || !user) {
            return res.status(404).json({ error: 'User profile not found.' });
        }

        return res.status(200).json({ user });
    } catch (err) {
        console.error('getProfile error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { getProfile, updateProfile };
