const supabase = require('../db');

const getDashboardStats = async (req, res) => {
    const [users, services, transactions] = await Promise.all([
        supabase.from('users').select('user_id', { count: 'exact', head: true }),
        supabase
            .from('services')
            .select('service_id', { count: 'exact', head: true })
            .eq('service_status', 'active')
            .eq('is_deleted', false),
        supabase.from('transactions').select('transaction_id', { count: 'exact', head: true })
    ]);

    const queryErrors = [users.error, services.error, transactions.error].filter(Boolean);
    if (queryErrors.length > 0) {
        for (const error of queryErrors) {
            console.error('Dashboard statistics query failed:', error.message);
        }
        return res.status(500).json({ error: 'Could not load dashboard statistics.' });
    }

    if ([users.count, services.count, transactions.count].some((count) => count === null)) {
        console.error('Dashboard statistics query returned a null count.');
        return res.status(500).json({ error: 'Could not load dashboard statistics.' });
    }

    return res.status(200).json({
        totalRegisteredUsers: users.count,
        totalActiveServices: services.count,
        totalTransactions: transactions.count
    });
};

module.exports = { getDashboardStats };
