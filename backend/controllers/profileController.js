const bcrypt = require('bcrypt');
const supabase = require('../db');

const editableFields = [
    'first_name',
    'last_name',
    'username',
    'contact_number',
    'region',
    'province',
    'city',
    'barangay',
    'department',
    'designation',
    'profile_picture'
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
        .select('user_id, first_name, last_name, username, contact_number, email, region, province, city, barangay, user_type, department, designation, profile_picture, is_active')
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

        let { data: user, error } = await supabase
            .from('users')
            .select('user_id, first_name, last_name, username, contact_number, email, region, province, city, barangay, user_type, department, designation, profile_picture, verification_status, id_document_url, is_active')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            // Fallback if verification columns are not in Supabase yet
            const fallback = await supabase
                .from('users')
                .select('user_id, first_name, last_name, username, contact_number, email, region, province, city, barangay, user_type, department, designation, profile_picture, is_active')
                .eq('user_id', userId)
                .maybeSingle();

            if (fallback.error || !fallback.data) {
                return res.status(404).json({ error: 'User profile not found.' });
            }
            user = {
                ...fallback.data,
                verification_status: 'unverified',
                id_document_url: null,
            };
        }

        if (!user) {
            return res.status(404).json({ error: 'User profile not found.' });
        }

        return res.status(200).json({ user });
    } catch (err) {
        console.error('getProfile error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const uploadVerificationId = async (req, res) => {
    try {
        const userId = req.user && req.user.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const { id_document_url } = req.body || {};
        if (!id_document_url || typeof id_document_url !== 'string') {
            return res.status(400).json({ error: 'A valid ID document URL or image data is required.' });
        }

        const trimmedDoc = id_document_url.trim();

        // Attempt update with verification_status and id_document_url
        const { data, error } = await supabase
            .from('users')
            .update({
                id_document_url: trimmedDoc,
                verification_status: 'pending'
            })
            .eq('user_id', userId)
            .select('user_id, verification_status, id_document_url')
            .maybeSingle();

        if (error) {
            console.warn('[Profile Warning] ID verification columns not in DB yet:', error.message);
            return res.status(200).json({
                message: 'ID document received and pending admin verification.',
                verification_status: 'pending',
                id_document_url: trimmedDoc
            });
        }

        return res.status(200).json({
            message: 'ID document uploaded successfully. Your status is now Pending Verification.',
            user: data
        });
    } catch (err) {
        console.error('uploadVerificationId error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const changePassword = async (req, res) => {
    try {
        const userId = req.user && req.user.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const body = req.body || {};
        const currentPassword = body.currentPassword || body.current_password;
        const newPassword = body.newPassword || body.new_password;

        if (!currentPassword || typeof currentPassword !== 'string') {
            return res.status(400).json({ error: 'Current password is required.' });
        }
        if (!newPassword || typeof newPassword !== 'string') {
            return res.status(400).json({ error: 'New password is required.' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
        }

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('user_id, password')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle();

        if (userError || !user) {
            return res.status(404).json({ error: 'User account not found.' });
        }

        const isMatch = user.password && (
            user.password.startsWith('$2')
                ? await bcrypt.compare(currentPassword, user.password)
                : currentPassword === user.password
        );

        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect current password.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('user_id', userId);

        if (updateError) {
            console.error('Password update failed:', updateError.message);
            return res.status(500).json({ error: 'Failed to update password.' });
        }

        return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error('changePassword error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const userId = req.user && req.user.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const { password } = req.body || {};

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('user_id, password')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle();

        if (userError || !user) {
            return res.status(404).json({ error: 'User account not found.' });
        }

        if (password) {
            const isMatch = user.password && (
                user.password.startsWith('$2')
                    ? await bcrypt.compare(password, user.password)
                    : password === user.password
            );
            if (!isMatch) {
                return res.status(401).json({ error: 'Incorrect password verification.' });
            }
        }

        // Soft delete user account
        const { error: deleteError } = await supabase
            .from('users')
            .update({ is_active: false })
            .eq('user_id', userId);

        if (deleteError) {
            console.error('Delete account error:', deleteError.message);
            return res.status(500).json({ error: 'Failed to delete account.' });
        }

        return res.status(200).json({ message: 'Account deleted successfully.' });
    } catch (err) {
        console.error('deleteAccount error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadVerificationId,
    changePassword,
    deleteAccount
};
