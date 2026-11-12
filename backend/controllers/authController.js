const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const supabase = require('../db');

const userFields = 'user_id, first_name, last_name, username, contact_number, email, region, province, city, barangay, user_type, department, designation, password, is_active';

const sendOtpEmail = async (email, otp) => {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASS;
    if (!emailUser || !emailPassword) {
        throw new Error('EMAIL_USER and EMAIL_PASS must be configured.');
    }

    const port = Number(process.env.EMAIL_PORT || 465);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('EMAIL_PORT must be a valid port number.');
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port,
        secure: process.env.EMAIL_SECURE
            ? process.env.EMAIL_SECURE === 'true'
            : port === 465,
        auth: {
            user: emailUser,
            pass: emailPassword
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || emailUser,
        to: email,
        subject: 'Your SerbisYou Verification Code',
        text: `Your 6-digit verification code is: ${otp}. It will expire in 10 minutes.`,
        html: `<p>Your SerbisYou verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`
    });
};

const register = async (req, res) => {
    try {
        const body = req.body;
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return res.status(400).json({ error: 'Registration details are required.' });
        }

        const {
            email,
            password,
            first_name: firstName = null,
            last_name: lastName = null,
            username = null,
            contact_number: contactNumber = null,
            region = null,
            province = null,
            city = null,
            barangay = null,
            user_type: userType = 'Requestor'
        } = body;

        if (
            typeof email !== 'string' ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            typeof password !== 'string' ||
            password.length === 0
        ) {
            return res.status(400).json({ error: 'A valid email and password are required.' });
        }

        const optionalFields = [firstName, lastName, username, contactNumber, region, province, city, barangay];
        if (optionalFields.some((value) => value !== null && typeof value !== 'string')) {
            return res.status(400).json({ error: 'Optional profile fields must be strings.' });
        }
        if (userType !== 'Provider' && userType !== 'Requestor') {
            return res.status(400).json({ error: 'user_type must be Provider or Requestor.' });
        }

        // Student ID Validation (Required)
        const rawStudentId = typeof body.student_id === 'string'
            ? body.student_id.trim()
            : typeof body.user_id === 'string'
                ? body.user_id.trim()
                : '';

        if (!rawStudentId) {
            return res.status(400).json({ error: 'Student ID is required.' });
        }

        let normalizedStudentId = rawStudentId.toUpperCase();
        if (/^\d{1,4}$/.test(normalizedStudentId)) {
            normalizedStudentId = `MMC-${normalizedStudentId.padStart(4, '0')}`;
        }
        if (!/^MMC-\d{4}$/.test(normalizedStudentId)) {
            return res.status(400).json({ error: 'Student ID must follow the format MMC-XXXX (e.g. MMC-1234).' });
        }

        // Provider Requirements (Personal Info & Address)
        if (userType === 'Provider') {
            if (!contactNumber || !contactNumber.trim()) {
                return res.status(400).json({ error: 'Contact number is required for Provider accounts.' });
            }
            if (!region || !region.trim()) {
                return res.status(400).json({ error: 'Region is required for Provider accounts.' });
            }
            if (!province || !province.trim()) {
                return res.status(400).json({ error: 'Province is required for Provider accounts.' });
            }
            if (!city || !city.trim()) {
                return res.status(400).json({ error: 'City is required for Provider accounts.' });
            }
            if (!barangay || !barangay.trim()) {
                return res.status(400).json({ error: 'Barangay is required for Provider accounts.' });
            }
        }

        const normalizedEmail = email.trim().toLowerCase();
        const { data: existingUser, error: lookupError } = await supabase
            .from('users')
            .select('user_id, is_active')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (lookupError) {
            console.error('Registration user lookup failed:', lookupError.message);
            return res.status(500).json({ error: 'Could not check the account.' });
        }
        if (existingUser && !existingUser.is_active) {
            return res.status(409).json({ error: 'This account is inactive.' });
        }

        // Check if Student ID is already taken by another account
        const { data: userWithId } = await supabase
            .from('users')
            .select('user_id, email')
            .eq('user_id', normalizedStudentId)
            .maybeSingle();

        if (userWithId && userWithId.email !== normalizedEmail) {
            return res.status(409).json({ error: `Student ID ${normalizedStudentId} is already registered.` });
        }

        if (existingUser) {
            const { data: verification, error: verificationLookupError } = await supabase
                .from('email_verifications')
                .select('verified_at, failed_attempts, expires_at')
                .eq('user_id', existingUser.user_id)
                .maybeSingle();

            if (verificationLookupError) {
                console.error('Registration verification lookup failed:', verificationLookupError.message);
                return res.status(500).json({ error: 'Could not check the account.' });
            }
            if (verification?.verified_at) {
                return res.status(409).json({ error: 'An account with this email already exists.' });
            }
            if (
                verification?.failed_attempts >= 5 &&
                verification.expires_at &&
                Date.now() <= Date.parse(verification.expires_at)
            ) {
                return res.status(429).json({ error: 'Too many invalid verification codes. Wait for the code to expire before requesting another.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const assignedUserId = existingUser ? existingUser.user_id : normalizedStudentId;

        const userRecord = {
            user_id: assignedUserId,
            first_name: firstName || '',
            last_name: lastName || '',
            username: username || '',
            contact_number: contactNumber || '',
            email: normalizedEmail,
            region: region || '',
            province: province || '',
            city: city || '',
            barangay: barangay || '',
            user_type: userType,
            password: hashedPassword,
            is_active: true
        };

        const userQuery = existingUser
            ? supabase
                .from('users')
                .update(userRecord)
                .eq('user_id', existingUser.user_id)
                .select(userFields)
                .single()
            : supabase
                .from('users')
                .insert(userRecord)
                .select(userFields)
                .single();

        const { data: user, error: saveError } = await userQuery;
        if (saveError) {
            console.error('Registration user save failed:', saveError.message);
            if (saveError.code === '23505') {
                return res.status(409).json({ error: 'An account with this email or username already exists.' });
            }
            return res.status(500).json({ error: 'Could not save the account.' });
        }

        const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const { error: saveVerificationError } = await supabase
            .from('email_verifications')
            .upsert({
                user_id: user.user_id,
                otp_hash: otpHash,
                expires_at: expiresAt,
                verified_at: null,
                failed_attempts: 0
            }, { onConflict: 'user_id' });

        if (saveVerificationError) {
            console.error('Registration OTP save failed:', saveVerificationError.message);
            return res.status(500).json({ error: 'Could not save the verification code.' });
        }

        console.log(`[AUTH OTP DEV LOG] Generated OTP for ${normalizedEmail}: ${otp}`);

        try {
            await sendOtpEmail(normalizedEmail, otp);
        } catch (error) {
            console.error('Registration email delivery failed:', error.message);
            return res.status(502).json({ error: 'The account was saved, but the verification email could not be sent. Please retry registration.' });
        }

        const { password: _password, ...safeUser } = user;
        return res.status(201).json({
            message: 'Registration successful. Verify your email using the code we sent.',
            user: safeUser
        });
    } catch (error) {
        console.error('Registration failed:', error.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body || {};
        if (
            typeof email !== 'string' ||
            typeof otp !== 'string' ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({ error: 'A valid email and 6-digit OTP are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('user_id')
            .eq('email', normalizedEmail)
            .eq('is_active', true)
            .maybeSingle();

        if (userError) {
            console.error('OTP user lookup failed:', userError.message);
            return res.status(500).json({ error: 'Could not verify the account.' });
        }
        if (!user) {
            return res.status(404).json({ error: 'Account not found.' });
        }

        const { data: verification, error: verificationError } = await supabase
            .from('email_verifications')
            .select('otp_hash, expires_at, verified_at, failed_attempts')
            .eq('user_id', user.user_id)
            .maybeSingle();

        if (verificationError) {
            console.error('OTP lookup failed:', verificationError.message);
            return res.status(500).json({ error: 'Could not verify the account.' });
        }
        if (!verification) {
            return res.status(400).json({ error: 'No verification record exists for this account.' });
        }
        if (verification.verified_at) {
            return res.status(200).json({ message: 'Email is already verified. You can now log in.' });
        }
        if (verification.failed_attempts >= 5) {
            return res.status(429).json({ error: 'Too many invalid verification codes. Register again to request a new code.' });
        }
        if (!verification.expires_at || Date.now() > Date.parse(verification.expires_at)) {
            return res.status(400).json({ error: 'The verification code has expired. Register again to request a new code.' });
        }
        if (!verification.otp_hash || !(await bcrypt.compare(otp, verification.otp_hash))) {
            const nextFailedAttempts = verification.failed_attempts + 1;
            const { data: attempt, error: attemptError } = await supabase
                .from('email_verifications')
                .update({ failed_attempts: nextFailedAttempts })
                .eq('user_id', user.user_id)
                .eq('failed_attempts', verification.failed_attempts)
                .is('verified_at', null)
                .select('failed_attempts')
                .maybeSingle();

            if (attemptError) {
                console.error('OTP attempt update failed:', attemptError.message);
                return res.status(500).json({ error: 'Could not verify the account.' });
            }
            if (!attempt) {
                return res.status(429).json({ error: 'Too many verification attempts. Request a new code.' });
            }
            if (attempt.failed_attempts >= 5) {
                return res.status(429).json({ error: 'Too many invalid verification codes. Register again to request a new code.' });
            }
            return res.status(400).json({
                error: 'Invalid verification code.',
                attemptsRemaining: 5 - attempt.failed_attempts
            });
        }

        const { data: updatedVerification, error: updateError } = await supabase
            .from('email_verifications')
            .update({
                otp_hash: null,
                expires_at: null,
                verified_at: new Date().toISOString()
            })
            .eq('user_id', user.user_id)
            .eq('otp_hash', verification.otp_hash)
            .eq('failed_attempts', verification.failed_attempts)
            .is('verified_at', null)
            .select('user_id')
            .maybeSingle();

        if (updateError) {
            console.error('OTP verification update failed:', updateError.message);
            return res.status(500).json({ error: 'Could not verify the account.' });
        }
        if (!updatedVerification) {
            return res.status(400).json({ error: 'The verification code has already been used.' });
        }

        return res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error('OTP verification failed:', error.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (typeof email !== 'string' || typeof password !== 'string' || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const { data: user, error: userError } = await supabase
            .from('users')
            .select(userFields)
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (userError) {
            console.error('Login user lookup failed:', userError.message);
            return res.status(500).json({ error: 'Could not log in.' });
        }
        const isPasswordMatch = user && user.password && (
            user.password.startsWith('$2')
                ? await bcrypt.compare(password, user.password)
                : password === user.password
        );

        if (!user || !user.is_active || !isPasswordMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const { data: verification, error: verificationError } = await supabase
            .from('email_verifications')
            .select('verified_at')
            .eq('user_id', user.user_id)
            .maybeSingle();

        if (verificationError) {
            console.error('Login verification lookup failed:', verificationError.message);
            return res.status(500).json({ error: 'Could not log in.' });
        }
        if (verification && !verification.verified_at) {
            return res.status(403).json({ error: 'Verify your email before logging in.' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('Login failed: JWT_SECRET is not configured.');
            return res.status(500).json({ error: 'Authentication is not configured.' });
        }

        const token = jwt.sign(
            { user_id: user.user_id, email: user.email },
            jwtSecret,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        const { password: _password, ...safeUser } = user;

        return res.status(200).json({ message: 'Login successful.', token, user: safeUser });
    } catch (error) {
        console.error('Login failed:', error.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = {
    register,
    verifyOtp,
    login
};
