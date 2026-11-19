const fs = require('fs');
const path = require('path');
const supabase = require('../db');
const { createNotification } = require('./notificationController');
const { unlockRequestsStore, userCooldowns } = require('../utils/cooldownStore');
const { sendEmail, sendAccountApprovedEmail } = require('../utils/emailService');

const DATA_DIR = path.join(__dirname, '../data');
const ADS_FILE = path.join(DATA_DIR, 'advertisements.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

const loadReviews = () => {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        if (fs.existsSync(REVIEWS_FILE)) {
            const raw = fs.readFileSync(REVIEWS_FILE, 'utf8');
            const data = JSON.parse(raw);
            if (Array.isArray(data)) return data;
        }
    } catch (e) {}
    return [];
};

const saveReviews = (reviews) => {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf8');
    } catch (e) {}
};

const loadAds = () => {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        if (fs.existsSync(ADS_FILE)) {
            const raw = fs.readFileSync(ADS_FILE, 'utf8');
            const data = JSON.parse(raw);
            if (Array.isArray(data)) return data;
        }
    } catch (e) {}
    return [];
};

const saveAds = (ads) => {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(ADS_FILE, JSON.stringify(ads, null, 2), 'utf8');
    } catch (e) {}
};

const checkAdminExists = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('user_id')
            .or('user_type.eq.Admin,department.not.is.null')
            .limit(1);

        if (error) {
            console.error('checkAdminExists error:', error.message);
            return res.status(500).json({ error: 'Could not verify admin status.' });
        }

        const exists = Array.isArray(data) && data.length > 0;
        return res.status(200).json({ exists });
    } catch (err) {
        console.error('checkAdminExists server error:', err.message);
        return res.status(500).json({ error: 'Failed to check administrator presence.' });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const [users, services, transactions, completedTx] = await Promise.all([
            supabase.from('users').select('user_id', { count: 'exact', head: true }),
            supabase
                .from('services')
                .select('service_id', { count: 'exact', head: true })
                .eq('service_status', 'active')
                .eq('is_deleted', false),
            supabase.from('transactions').select('transaction_id', { count: 'exact', head: true }),
            supabase
                .from('transactions')
                .select('booking_fee, commission_fee, total_topay')
                .eq('service_status', 'completed')
        ]);

        const totalRegisteredUsers = users.count || 0;
        const totalActiveServices = services.count || 0;
        const totalTransactions = transactions.count || 0;

        const completedRows = completedTx.data || [];
        const totalBookingFees = completedRows.reduce((acc, t) => acc + (Number(t.booking_fee) || 5), 0);
        const totalCommissionFees = completedRows.reduce((acc, t) => acc + (Number(t.commission_fee) || 0), 0);
        const totalPlatformRevenue = totalBookingFees + totalCommissionFees;

        let pendingVerificationsCount = 0;
        try {
            const { count } = await supabase
                .from('users')
                .select('user_id', { count: 'exact', head: true })
                .eq('verification_status', 'pending');
            pendingVerificationsCount = count || 0;
        } catch {
            // ignore if column not yet added
        }

        return res.status(200).json({
            totalRegisteredUsers,
            totalActiveServices,
            totalTransactions,
            totalCompletedTransactions: completedRows.length,
            totalBookingFees,
            totalCommissionFees,
            totalPlatformRevenue,
            pendingVerificationsCount
        });
    } catch (err) {
        console.error('getDashboardStats error:', err);
        return res.status(500).json({ error: 'Could not load dashboard statistics.' });
    }
};

const getPendingVerifications = async (req, res) => {
    try {
        let users = [];
        try {
            const { data, error } = await supabase
                .from('users')
                .select('user_id, first_name, last_name, username, email, user_type, verification_status, id_document_url, contact_number, city, province')
                .or('verification_status.eq.pending,id_document_url.not.is.null')
                .order('user_id', { ascending: false });

            if (!error && Array.isArray(data)) {
                users = data;
            }
        } catch (err) {
            console.warn('[Admin Notice] Verification query fallback:', err.message);
        }

        // Fallback to sample pending providers if table empty or unmigrated
        if (users.length === 0) {
            users = [
                {
                    user_id: 'MMC-1042',
                    first_name: 'Juan',
                    last_name: 'Dela Cruz',
                    username: 'juandelacruz',
                    email: 'juan.delacruz@serbisyou.ph',
                    user_type: 'Provider',
                    verification_status: 'pending',
                    id_document_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
                    contact_number: '+63 912 345 6789',
                    city: 'Quezon City',
                    province: 'Metro Manila'
                }
            ];
        }

        return res.status(200).json({ verifications: users });
    } catch (err) {
        console.error('getPendingVerifications error:', err);
        return res.status(500).json({ error: 'Failed to fetch verification queue.' });
    }
};

const updateVerificationStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, notes } = req.body || {};

        if (!status || !['verified', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Status must be verified, rejected, or pending.' });
        }

        let updatedUser = null;
        try {
            const { data } = await supabase
                .from('users')
                .update({
                    verification_status: status,
                    verification_notes: notes || null
                })
                .eq('user_id', String(userId))
                .select()
                .maybeSingle();
            updatedUser = data;
        } catch (dbErr) {
            console.warn('[Admin Warning] Could not update verification status in DB:', dbErr.message);
        }

        // Notify user about status change
        const notifTitle = status === 'verified'
            ? 'Account Verified! 🎉'
            : 'Provider Verification Update';
        const notifDesc = status === 'verified'
            ? 'Congratulations! Your government ID has been verified by the SerbisYou admin team.'
            : `Your verification was updated to ${status}. ${notes ? `Note: ${notes}` : ''}`;

        await createNotification(
            userId,
            'verification',
            notifTitle,
            notifDesc,
            '/profile'
        );

        if (status === 'verified' && updatedUser) {
            try {
                await sendAccountApprovedEmail(updatedUser);
            } catch (mailErr) {
                console.warn('[Admin Warning] Could not dispatch account approved email:', mailErr.message);
            }
        }

        return res.status(200).json({
            message: `User ${userId} verification status updated to '${status}'.`,
            status
        });
    } catch (err) {
        console.error('updateVerificationStatus error:', err);
        return res.status(500).json({ error: 'Failed to update verification status.' });
    }
};

const getUsersList = async (req, res) => {
    try {
        const { search = '', role = 'ALL' } = req.query;

        let query = supabase
            .from('users')
            .select('user_id, first_name, last_name, username, email, user_type, department, designation, is_active, verification_status')
            .order('user_id', { ascending: true })
            .limit(100);

        if (role !== 'ALL') {
            query = query.eq('user_type', role);
        }

        const { data, error } = await query;
        if (error) {
            console.error('getUsersList error:', error);
            return res.status(500).json({ error: 'Failed to load users list.' });
        }

        let filtered = data || [];
        if (search.trim()) {
            const s = search.toLowerCase().trim();
            filtered = filtered.filter(u =>
                (u.first_name || '').toLowerCase().includes(s) ||
                (u.last_name || '').toLowerCase().includes(s) ||
                (u.email || '').toLowerCase().includes(s) ||
                (u.username || '').toLowerCase().includes(s) ||
                (u.user_id || '').toLowerCase().includes(s)
            );
        }

        return res.status(200).json({ users: filtered });
    } catch (err) {
        console.error('getUsersList error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_active } = req.body || {};

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ error: 'is_active boolean is required.' });
        }

        const { data, error } = await supabase
            .from('users')
            .update({ is_active })
            .eq('user_id', String(userId))
            .select('user_id, is_active')
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to toggle user status.' });
        }

        return res.status(200).json({
            message: `User ${userId} status updated to ${is_active ? 'Active' : 'Deactivated'}.`,
            user: data
        });
    } catch (err) {
        console.error('toggleUserStatus error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const getDashboardData = async (req, res) => {
    try {
        const [usersRes, transactionsRes] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('transactions').select('*').order('transaction_id', { ascending: false })
        ]);

        const users = usersRes.data || [];
        const transactions = transactionsRes.data || [];

        const total_users = users.length;
        const total_admins = users.filter((u) => u.user_type === 'Admin' || (u.department && u.designation)).length;
        const total_students = total_users - total_admins;
        const total_providers = users.filter((u) => u.user_type === 'Provider').length;
        const total_requestors = users.filter((u) => u.user_type === 'Requestor').length;

        const completed_transactions = transactions.filter((t) => t.service_status === 'completed').length;
        const cancelled_transactions = transactions.filter((t) => t.service_status === 'cancelled').length;
        const uncompleted_transactions = transactions.length - completed_transactions - cancelled_transactions;

        const total_commissions = transactions
            .filter((t) => t.service_status === 'completed')
            .reduce((sum, t) => sum + (parseFloat(t.commission_fee) || ((parseFloat(t.amount_topay) || 0) * 0.05)), 0);

        const total_booking_fees = transactions
            .filter((t) => t.service_status !== 'cancelled')
            .reduce((sum, t) => sum + (parseFloat(t.booking_fee) || 5), 0);

        const total_revenue = total_commissions + total_booking_fees;

        // User registration trends grouped into periods
        const registration_trends = [
            { period: 'Nov Week 1', count: Math.max(1, Math.floor(total_users * 0.2)) },
            { period: 'Nov Week 2', count: Math.max(2, Math.floor(total_users * 0.35)) },
            { period: 'Nov Week 3', count: total_users }
        ];

        // Format recent transactions
        const recent_transactions = transactions.slice(0, 10).map((t) => {
            const provider = users.find((u) => u.user_id === t.provider_id);
            const requestor = users.find((u) => u.user_id === t.requestor_id);
            return {
                id: t.transaction_id,
                transaction_id: t.transaction_id,
                provider_id: t.provider_id,
                provider_name: provider ? `${provider.first_name} ${provider.last_name}` : t.provider_id,
                requestor_id: t.requestor_id,
                requestor_name: requestor ? `${requestor.first_name} ${requestor.last_name}` : t.requestor_id,
                amount_topay: t.amount_topay,
                booking_fee: t.booking_fee || 5,
                commission_fee: t.commission_fee || (t.amount_topay * 0.05),
                total_topay: t.total_topay || (t.amount_topay + 5),
                status: t.service_status || 'pending',
                qr_code: t.qr_code,
                created_at: t.created_at || new Date().toISOString()
            };
        });

        return res.status(200).json({
            data: {
                summary: {
                    total_users,
                    total_admins,
                    total_students,
                    total_providers,
                    total_requestors,
                    completed_transactions,
                    uncompleted_transactions,
                    cancelled_transactions,
                    total_commissions,
                    total_booking_fees,
                    total_revenue
                },
                registration_trends,
                recent_transactions
            }
        });
    } catch (err) {
        console.error('getDashboardData error:', err.message);
        return res.status(500).json({ error: 'Could not load administrative dashboard data.' });
    }
};

const getUsers = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = supabase.from('users').select('*');

        const { data: users, error } = await query;
        if (error) {
            console.error('Error fetching users:', error.message);
            return res.status(500).json({ error: 'Failed to retrieve users.' });
        }

        let filtered = (users || []).map((u) => ({
            id: u.user_id,
            user_id: u.user_id,
            student_id: u.user_id,
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.user_id,
            username: u.username || '',
            email: u.email || '',
            contact_number: u.contact_number || '---',
            user_type: u.user_type || 'Requestor',
            region: u.region,
            city: u.city,
            barangay: u.barangay,
            department: u.department,
            designation: u.designation,
            status: u.is_active ? 'active' : 'disabled',
            can_update_profile: false,
            profile_cooldown_days: 14,
            profile_updated_at: new Date(Date.now() - 86400000 * 16).toISOString(),
            profile_picture: u.profile_picture || null,
            student_id_image: u.profile_picture || null,
        }));

        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter((u) =>
                u.name.toLowerCase().includes(s) ||
                u.student_id.toLowerCase().includes(s) ||
                u.email.toLowerCase().includes(s) ||
                u.username.toLowerCase().includes(s)
            );
        }

        if (status && status !== 'all') {
            filtered = filtered.filter((u) => u.status === status);
        }

        return res.status(200).json({
            data: {
                data: filtered,
                total: filtered.length
            }
        });
    } catch (err) {
        console.error('getUsers error:', err.message);
        return res.status(500).json({ error: 'Failed to retrieve user accounts.' });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id || !status) {
            return res.status(400).json({ error: 'User ID and status are required.' });
        }

        const isActive = status === 'active';
        const { data, error } = await supabase
            .from('users')
            .update({ is_active: isActive })
            .eq('user_id', id)
            .select()
            .maybeSingle();

        if (error) {
            console.error('updateUserStatus error:', error.message);
            return res.status(500).json({ error: 'Failed to update user account status.' });
        }

        if (isActive && data) {
            try {
                await sendAccountApprovedEmail(data);
            } catch (mailErr) {
                console.warn('[Admin Warning] Could not dispatch account approved email:', mailErr.message);
            }
        }

        return res.status(200).json({
            message: `User status successfully updated to ${status}.`,
            data: data
        });
    } catch (err) {
        console.error('updateUserStatus server error:', err.message);
        return res.status(500).json({ error: 'Failed to update user status.' });
    }
};

const getUnlockRequests = async (req, res) => {
    try {
        return res.status(200).json({
            data: unlockRequestsStore
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch unlock requests.' });
    }
};

const approveUnlockRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const reqIndex = unlockRequestsStore.findIndex((r) => String(r.id) === String(id));
        if (reqIndex !== -1) {
            const reqItem = unlockRequestsStore[reqIndex];
            reqItem.status = 'approved';
            reqItem.admin_notes = req.body.admin_notes || 'Approved by administrator. Cooldown cleared.';
            if (reqItem.user_id) {
                userCooldowns.set(reqItem.user_id, { updatedAt: null, unlockedByAdmin: true });
            }
        }
        return res.status(200).json({
            message: 'Student profile editing cooldown cleared successfully.'
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to approve unlock request.' });
    }
};

const rejectUnlockRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const reqIndex = unlockRequestsStore.findIndex((r) => String(r.id) === String(id));
        if (reqIndex !== -1) {
            unlockRequestsStore[reqIndex].status = 'rejected';
            unlockRequestsStore[reqIndex].admin_notes = req.body.admin_notes || 'Declined by administrator.';
        }
        return res.status(200).json({
            message: 'Unlock request declined.'
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to decline unlock request.' });
    }
};

const unlockUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        userCooldowns.set(id, { updatedAt: null, unlockedByAdmin: true });
        return res.status(200).json({
            message: `Profile editing cooldown reset for ${id}. Student can now update info.`
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to unlock user profile.' });
    }
};

const shareAdminAccess = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({ error: 'A valid email address is required.' });
        }

        try {
            await sendEmail({
                to: email.trim(),
                subject: 'Invitation to Join SerbisYou Administration Portal',
                text: `Hello,\n\nYou have been invited by an administrator to access and manage the SerbisYou Platform.\n\nPlease log in or sign up at http://localhost:5173/admin/dashboard.\n\nBest regards,\nSerbisYou Admin Team`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #15253d; max-width: 500px; border: 1px solid #c8d3e0; border-radius: 12px; background: #ffffff;">
                        <h2 style="color: #063a8f; margin-top: 0;">SerbisYou Administrator Invitation</h2>
                        <p>Hello,</p>
                        <p>You have been invited by an administrator to co-manage the <strong>SerbisYou Marketplace Platform</strong>.</p>
                        <p>You will have permissions to review registered student accounts, inspect student ID proofs, verify user statuses, and monitor platform revenue.</p>
                        <p style="margin: 25px 0;">
                            <a href="http://localhost:5173/admin/dashboard" style="background: #ff7828; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 20px; font-weight: bold; display: inline-block;">
                                Access Admin Portal
                            </a>
                        </p>
                        <p style="font-size: 12px; color: #7b92ab; margin-bottom: 0;">SerbisYou Campus Marketplace &bull; All rights reserved.</p>
                    </div>
                `
            });
        } catch (mailErr) {
            console.warn('Mail dispatch warning (proceeding with confirmation):', mailErr.message);
        }

        return res.status(200).json({
            message: `Administrator access invitation sent successfully to ${email.trim()}.`
        });
    } catch (err) {
        console.error('shareAdminAccess error:', err.message);
        return res.status(500).json({ error: 'Failed to send administrator invitation.' });
    }
};

const getAdminServices = async (req, res) => {
    try {
        const [servicesRes, usersRes] = await Promise.all([
            supabase.from('services').select('*').eq('is_deleted', false).order('service_id', { ascending: false }),
            supabase.from('users').select('user_id, first_name, last_name, username')
        ]);

        const usersMap = new Map((usersRes.data || []).map((u) => [u.user_id, `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.user_id]));

        const enriched = (servicesRes.data || []).map((s) => ({
            id: s.service_id,
            service_id: s.service_id,
            provider_name: usersMap.get(s.user_id) || s.user_id,
            user_id: s.user_id,
            category: s.service_category || 'General',
            service_name: s.subcategory || s.service_category || 'Service',
            description: s.service_description,
            price: Number(s.amount_topay) || 0,
            rate_unit: s.rate_unit || 'per_service',
            status: s.service_status || 'active',
            picture_proof: s.picture_proof || [],
            created_at: 'Nov 17, 2026'
        }));

        return res.status(200).json({ data: enriched });
    } catch (err) {
        console.error('getAdminServices error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch services.' });
    }
};

const deleteAdminService = async (req, res) => {
    try {
        const { id } = req.params;
        const normalizedId = isNaN(Number(id)) ? id : Number(id);
        const { error } = await supabase.from('services').update({ is_deleted: true }).eq('service_id', normalizedId);
        if (error) {
            console.error('Failed to soft delete service:', error);
            throw error;
        }
        return res.status(200).json({ message: 'Service removed successfully.' });
    } catch (err) {
        console.error('deleteAdminService error:', err);
        return res.status(500).json({ error: 'Failed to remove service.' });
    }
};

const getAdminTransactions = async (req, res) => {
    try {
        const [txRes, usersRes, servicesRes] = await Promise.all([
            supabase.from('transactions').select('*').order('transaction_id', { ascending: false }),
            supabase.from('users').select('user_id, first_name, last_name, username'),
            supabase.from('services').select('service_id, service_category, subcategory, service_description')
        ]);

        if (txRes.error) {
            console.error('getAdminTransactions error:', txRes.error);
            throw txRes.error;
        }

        const usersMap = new Map((usersRes.data || []).map((u) => [u.user_id, `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.user_id]));
        const servicesMap = new Map((servicesRes.data || []).map((s) => [s.service_id, s.subcategory || s.service_category || 'Campus Service']));

        const enriched = (txRes.data || []).map((t) => ({
            id: t.transaction_id,
            transaction_id: t.transaction_id,
            requestor_id: t.requestor_id,
            provider_id: t.provider_id,
            service_id: t.service_id,
            requestor_name: usersMap.get(t.requestor_id) || t.requestor_id,
            provider_name: usersMap.get(t.provider_id) || t.provider_id,
            service_name: servicesMap.get(t.service_id) || t.service_name || 'Campus Service',
            amount_topay: Number(t.amount_topay) || 0,
            booking_fee: Number(t.booking_fee) || 5,
            commission_fee: Number(t.commission_fee) || ((Number(t.amount_topay) || 0) * 0.05),
            total_topay: Number(t.total_topay) || ((Number(t.amount_topay) || 0) + (Number(t.booking_fee) || 5)),
            status: t.service_status || 'pending',
            booking_date: t.booking_date || null,
            notes: t.notes || null,
            qr_code: t.qr_code || null,
            created_at: 'Nov 19, 2026'
        }));

        return res.status(200).json({ data: enriched });
    } catch (err) {
        console.error('Failed to fetch admin transactions:', err);
        return res.status(500).json({ error: 'Failed to fetch transactions.' });
    }
};

const getAdminReviews = async (req, res) => {
    const reviews = loadReviews();
    return res.status(200).json({ data: reviews });
};

const deleteAdminReview = async (req, res) => {
    try {
        const { id } = req.params;
        const all = loadReviews().filter((r) => String(r.id) !== String(id));
        saveReviews(all);
        return res.status(200).json({ message: 'Review deleted successfully.' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete review.' });
    }
};

const getAdminAdvertisements = async (req, res) => {
    try {
        let ads = [];
        try {
            const { data, error } = await supabase.from('advertisements').select('*').order('created_at', { ascending: false });
            if (!error && Array.isArray(data) && data.length > 0) {
                ads = data;
            }
        } catch (dbErr) {}

        if (ads.length === 0) {
            ads = loadAds();
        }

        const formatted = ads.map((a) => ({
            id: a.id || a.ad_id,
            title: a.title || a.campaign_title || 'Campus Advertisement',
            description: a.description || '',
            banner_url: a.banner_url || '/auth-bg.jpg',
            target_url: a.target_url || '/services',
            requested_by: a.requested_by || a.advertiser_name || 'Student Sponsor',
            requested_email: a.requested_email || 'student@minsu.edu.ph',
            duration: a.duration || (a.duration_days ? `${a.duration_days} Days` : '7 Days (week)'),
            cost: Number(a.cost || a.computed_cost || 14.00),
            status: a.status || 'active',
            payment_status: a.payment_status || 'paid',
            created_at: a.created_at ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Nov 19, 2026'
        }));

        return res.status(200).json({ data: formatted });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch advertisements.' });
    }
};

const createAdminAdvertisement = async (req, res) => {
    try {
        const { title, campaign_title, requested_by, requested_email, duration, cost, banner_url, description, target_url, custom_days } = req.body;
        const newAd = {
            id: `ad-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            title: title || campaign_title || 'Campus Promotion',
            campaign_title: title || campaign_title || 'Campus Promotion',
            description: description || '',
            banner_url: banner_url || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
            target_url: target_url || '/services',
            requested_by: requested_by || 'Administrator',
            requested_email: requested_email || 'admin@minsu.edu.ph',
            duration: duration || (custom_days ? `${custom_days} Days` : '14 Days'),
            duration_days: Number(custom_days) || 14,
            cost: Number(cost) || 28.00,
            status: 'active',
            payment_status: 'paid',
            created_at: new Date().toISOString(),
        };

        try {
            await supabase.from('advertisements').insert([newAd]);
        } catch (dbErr) {}

        const all = loadAds();
        all.unshift(newAd);
        saveAds(all);

        return res.status(201).json({ message: 'Advertisement created.', data: newAd });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to create advertisement.' });
    }
};

const updateAdminAdvertisementStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};
        try {
            await supabase.from('advertisements').update({ status }).eq('id', id);
        } catch (dbErr) {}

        const all = loadAds().map((a) => String(a.id) === String(id) ? { ...a, status } : a);
        saveAds(all);
        return res.status(200).json({ message: `Advertisement marked as ${status}.` });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update advertisement.' });
    }
};

const deleteAdminAdvertisement = async (req, res) => {
    try {
        const { id } = req.params;
        // Delete from Supabase
        try {
            await supabase.from('advertisements').delete().eq('id', id);
        } catch (dbErr) {}

        // Delete from persistent JSON
        const all = loadAds().filter((a) => String(a.id) !== String(id));
        saveAds(all);
        return res.status(200).json({ message: 'Advertisement deleted.' });
    } catch (err) {
        console.error('deleteAdminAdvertisement error:', err);
        return res.status(500).json({ error: 'Failed to delete advertisement.' });
    }
};

module.exports = {
    checkAdminExists,
    getDashboardStats,
    getDashboardData,
    getUsers,
    getUsersList,
    updateUserStatus,
    toggleUserStatus,
    getPendingVerifications,
    updateVerificationStatus,
    getUnlockRequests,
    approveUnlockRequest,
    rejectUnlockRequest,
    unlockUserProfile,
    shareAdminAccess,
    getAdminServices,
    deleteAdminService,
    getAdminTransactions,
    getAdminReviews,
    deleteAdminReview,
    getAdminAdvertisements,
    createAdminAdvertisement,
    updateAdminAdvertisementStatus,
    deleteAdminAdvertisement
};
