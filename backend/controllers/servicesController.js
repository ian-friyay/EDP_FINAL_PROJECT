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

const isValidServiceId = (serviceId) => {
    if (!serviceId) return false;
    const str = String(serviceId).trim();
    return /^\d+$/.test(str) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

const updateService = async (req, res) => {
    const { serviceId } = req.params;
    if (!isValidServiceId(serviceId)) {
        return res.status(400).json({ error: 'A valid service ID is required.' });
    }

    const {
        service_category,
        subcategory,
        service_description,
        amount_topay,
        picture_proof
    } = req.body || {};

    const updates = {};
    if (service_category && typeof service_category === 'string') updates.service_category = service_category.trim();
    if (subcategory !== undefined) updates.subcategory = subcategory ? String(subcategory).trim() : null;
    if (service_description && typeof service_description === 'string') updates.service_description = service_description.trim();
    if (amount_topay !== undefined && amount_topay !== null && amount_topay !== '') {
        const num = Number(amount_topay);
        if (!Number.isFinite(num) || num < 0) {
            return res.status(400).json({ error: 'Invalid service amount.' });
        }
        updates.amount_topay = num;
    }
    if (picture_proof !== undefined) {
        if (!isValidPictureProof(picture_proof)) {
            return res.status(400).json({ error: 'Invalid picture proof URLs.' });
        }
        updates.picture_proof = picture_proof;
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No service fields to update.' });
    }

    const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('service_id', serviceId)
        .eq('user_id', req.user.user_id)
        .eq('is_deleted', false)
        .select('*')
        .maybeSingle();

    if (error) {
        console.error('Failed to update service:', error);
        return res.status(500).json({ error: 'Failed to update service.' });
    }

    if (!data) {
        return res.status(404).json({ error: 'Active service not found or unauthorized.' });
    }

    return res.status(200).json({ message: 'Service updated successfully.', service: data });
};

const softDeleteService = async (req, res) => {
    const { serviceId } = req.params;
    if (!isValidServiceId(serviceId)) {
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
    updateService,
    softDeleteService
};
