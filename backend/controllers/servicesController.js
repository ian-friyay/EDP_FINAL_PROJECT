const supabase = require('../db');

const isValidPictureProof = (pictureProof) => {
    if (!Array.isArray(pictureProof)) {
        return false;
    }

    return pictureProof.every((pictureUrl) => {
        if (typeof pictureUrl !== 'string') {
            return false;
        }

        try {
            const url = new URL(pictureUrl);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    });
};

const getActiveServices = async (req, res) => {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('service_status', 'active')
        .eq('is_deleted', false);

    if (error) {
        console.error('Failed to fetch active services:', error);
        return res.status(500).json({ error: 'Failed to fetch services.' });
    }

    return res.status(200).json({ services: data });
};

const createService = async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ error: 'A service object is required.' });
    }

    const {
        service_category: serviceCategory,
        subcategory,
        service_description: serviceDescription,
        amount_topay: amountToPay,
        picture_proof: pictureProof = []
    } = body;

    const numericAmount = Number(amountToPay);
    if (
        typeof serviceCategory !== 'string' ||
        !serviceCategory.trim() ||
        typeof serviceDescription !== 'string' ||
        !serviceDescription.trim() ||
        amountToPay === '' ||
        amountToPay === null ||
        !Number.isFinite(numericAmount) ||
        numericAmount < 0 ||
        !isValidPictureProof(pictureProof)
    ) {
        return res.status(400).json({ error: 'Invalid service details.' });
    }

    if (subcategory !== undefined && subcategory !== null && typeof subcategory !== 'string') {
        return res.status(400).json({ error: 'Subcategory must be a string.' });
    }

    const { data, error } = await supabase
        .from('services')
        .insert({
            user_id: req.user.user_id,
            service_category: serviceCategory.trim(),
            subcategory: subcategory?.trim() || null,
            service_description: serviceDescription.trim(),
            amount_topay: numericAmount,
            service_status: 'active',
            picture_proof: pictureProof,
            is_deleted: false
        })
        .select('*')
        .single();

    if (error) {
        console.error('Failed to create service:', error);
        return res.status(500).json({ error: 'Failed to create service.' });
    }

    return res.status(201).json({ service: data });
};

const softDeleteService = async (req, res) => {
    const { serviceId } = req.params;
    if (
        typeof serviceId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(serviceId)
    ) {
        return res.status(400).json({ error: 'A valid service ID is required.' });
    }

    const { data, error } = await supabase
        .from('services')
        .update({ is_deleted: true })
        .eq('service_id', serviceId)
        .eq('user_id', req.user.user_id)
        .eq('is_deleted', false)
        .select('service_id, is_deleted')
        .maybeSingle();

    if (error) {
        console.error('Failed to soft-delete service:', error);
        return res.status(500).json({ error: 'Failed to delete service.' });
    }

    if (!data) {
        return res.status(404).json({ error: 'Active service not found.' });
    }

    return res.status(200).json({ message: 'Service deleted successfully.', service: data });
};

module.exports = {
    getActiveServices,
    createService,
    softDeleteService
};
