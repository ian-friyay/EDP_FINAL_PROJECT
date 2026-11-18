const bcrypt = require('bcrypt');
const crypto = require('crypto');
const supabase = require('../db');
const { unlockRequestsStore, userCooldowns, passwordOtpStore } = require('../utils/cooldownStore');
const { sendOtpEmail } = require('../utils/emailService');

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

/**
 * Calculate 30-day cooldown status for a user
 */
const getCooldownInfo = (userId) => {
    const record = userCooldowns.get(userId);
    if (!record || record.unlockedByAdmin || !record.updatedAt) {
        return { cooldownDays: 0, canUpdate: true, lastUpdated: record ? record.updatedAt : null };
    }

    const lastUpdateTime = new Date(record.updatedAt).getTime();
    const daysPassed = (Date.now() - lastUpdateTime) / (1000 * 60 * 60 * 24);
    const cooldownDays = Math.max(0, Math.ceil(30 - daysPassed));

    return {
        cooldownDays,
        canUpdate: cooldownDays === 0,
        lastUpdated: record.updatedAt
    };
};

/**
 * GET /api/profile or /api/profile/me
 */
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

        const { cooldownDays, canUpdate, lastUpdated } = getCooldownInfo(userId);

        const safeUser = {
            ...user,
            student_id: user.user_id,
            profile_image: user.profile_picture || null,
            profile_updated_at: lastUpdated,
            profile_cooldown_days: cooldownDays,
            can_update_profile: canUpdate
        };

        return res.status(200).json({ user: safeUser, data: safeUser });
    } catch (err) {
        console.error('getProfile error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

/**
 * PUT /api/profile or PATCH /api/profile/me
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user && req.user.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const body = req.body;
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return res.status(400).json({ error: 'Profile fields are required.' });
        }

        const { cooldownDays, canUpdate } = getCooldownInfo(userId);
        if (!canUpdate && cooldownDays > 0) {
            return res.status(403).json({
                error: `Profile updates are locked for ${cooldownDays} more day(s) due to the 30-day waiting period.`
            });
        }

        const updates = {};
        for (const field of editableFields) {
            if (Object.hasOwn(body, field)) {
                const value = body[field];
                updates[field] = typeof value === 'string' ? value.trim() || null : null;
            }
        }

        // Support profile photo upload (DataURL or URL)
        if (body.profile_image !== undefined) {
            updates.profile_picture = body.profile_image || null;
        } else if (body.profile_picture !== undefined) {
            updates.profile_picture = body.profile_picture || null;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No editable profile fields were provided.' });
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updates)
            .eq('user_id', userId)
            .select('user_id, first_name, last_name, username, contact_number, email, region, province, city, barangay, user_type, department, designation, profile_picture, is_active')
            .maybeSingle();

        if (error) {
            console.error('Profile update failed:', error.message);
            if (error.code === '23505') {
                return res.status(409).json({ error: 'That username is already in use.' });
            }
            return res.status(500).json({ error: 'Could not update the profile.' });
        }

        // Mark 30-day cooldown
        const now = new Date().toISOString();
        userCooldowns.set(userId, { updatedAt: now, unlockedByAdmin: false });

        const safeUser = {
            ...updatedUser,
            student_id: updatedUser.user_id,
            profile_image: updatedUser.profile_picture || null,
            profile_updated_at: now,
            profile_cooldown_days: 30,
            can_update_profile: false
        };

        return res.status(200).json({
            message: 'Profile updated successfully! Next profile change will be available in 30 days.',
            user: safeUser,
            data: safeUser
        });
    } catch (err) {
        console.error('updateProfile error:', err);
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

/**
 * POST /api/profile/unlock-request
 */
const submitUnlockRequest = async (req, res) => {
    try {
        const userId = req.user && req.user.user_id;
        const userEmail = req.user && req.user.email;
        const { request_type = 'profile_unlock', notes = '', location = '' } = req.body || {};

        if (!notes || notes.trim().length < 10) {
            return res.status(400).json({ error: 'Please provide at least 10 characters explaining your concern.' });
        }

        // Fetch user full name for clarity
        const { data: userRecord } = await supabase
            .from('users')
            .select('first_name, last_name, username')
            .eq('user_id', userId)
            .maybeSingle();

        const studentName = userRecord
            ? `${userRecord.first_name || ''} ${userRecord.last_name || ''}`.trim() || userRecord.username
            : userId;

        const newRequest = {
            id: Date.now(),
            user_id: userId,
            student_id: userId,
            student_name: studentName,
            student_email: userEmail,
            location: location || 'Mindoro State University',
            request_type,
            notes: notes.trim(),
            status: 'pending',
            admin_notes: null,
            created_at: new Date().toISOString()
        };

        unlockRequestsStore.unshift(newRequest);

        return res.status(200).json({
            message: 'Your unlock request and note have been submitted to the administrator!',
            data: newRequest
        });
    } catch (err) {
        console.error('submitUnlockRequest error:', err);
        return res.status(500).json({ error: 'Failed to submit unlock request.' });
    }
};

/**
 * GET /api/profile/unlock-requests
 */
const getUserUnlockRequests = async (req, res) => {
    try {
        const userId = req.user && req.user.user_id;
        const userRequests = unlockRequestsStore.filter((r) => r.user_id === userId);
        return res.status(200).json({ data: userRequests });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch unlock requests.' });
    }
};

/**
 * POST /api/profile/password/otp
 */
const requestPasswordOtp = async (req, res) => {
    try {
        const userId = req.user && req.user.user_id;
        const email = req.user && req.user.email;
        if (!userId || !email) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        passwordOtpStore.set(userId, { otp, expiresAt });

        try {
            await sendOtpEmail(
                email,
                otp,
                'SerbisYou Password Change Verification Code',
                'You requested to change your password for your SerbisYou account'
            );
        } catch (mailErr) {
            console.warn('Mail dispatch warning:', mailErr.message);
        }

        return res.status(200).json({
            message: 'A 6-digit verification code has been dispatched to your registered email.'
        });
    } catch (err) {
        console.error('requestPasswordOtp error:', err);
        return res.status(500).json({ error: 'Failed to dispatch verification code.' });
    }
};

/**
 * POST /api/profile/password/change
 */
const changePasswordWithOtp = async (req, res) => {
    try {
        const userId = req.user && req.user.user_id;
        const { otp_code, password, password_confirmation } = req.body || {};

        if (!otp_code || String(otp_code).trim().length !== 6) {
            return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        }

        if (password_confirmation && password !== password_confirmation) {
            return res.status(400).json({ error: 'New password and confirmation password do not match.' });
        }

        const storedOtp = passwordOtpStore.get(userId);
        if (!storedOtp || storedOtp.otp !== String(otp_code).trim()) {
            return res.status(400).json({ error: 'Invalid or incorrect verification code.' });
        }

        if (Date.now() > storedOtp.expiresAt) {
            passwordOtpStore.delete(userId);
            return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('user_id', userId);

        if (updateError) {
            console.error('Password update failed:', updateError.message);
            return res.status(500).json({ error: 'Failed to update password.' });
        }

        passwordOtpStore.delete(userId);

        return res.status(200).json({ message: 'Password changed successfully!' });
    } catch (err) {
        console.error('changePasswordWithOtp error:', err);
        return res.status(500).json({ error: 'Failed to change password.' });
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
    submitUnlockRequest,
    getUserUnlockRequests,
    requestPasswordOtp,
    changePasswordWithOtp,
    deleteAccount
};
