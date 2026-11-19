const supabase = require('../db');

// Strict SerbisYou Service Taxonomy matching Registration & Campus Service Hub
const ALLOWED_TAXONOMY = {
    'Creative': ['Graphic Designer', 'Art Painter'],
    'Creatives': ['Graphic Designer', 'Art Painter'],
    'Event Support': ['Make-up artist', 'Makeup Artist', 'Event Hosts', 'Event Host'],
    'Digital Service': ['Photographers', 'Photographer', 'Video Editors', 'Video Editor'],
    'Digital Services': ['Photographers', 'Photographer', 'Video Editors', 'Video Editor']
};

const isValidPictureProof = (pictureProof) => {
    if (!Array.isArray(pictureProof)) {
        return false;
    }

    return pictureProof.every((pictureUrl) => {
        if (typeof pictureUrl !== 'string') {
            return false;
        }

        const trimmed = pictureUrl.trim();
        if (trimmed.startsWith('data:image/')) {
            return true;
        }

        try {
            const url = new URL(trimmed);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    });
};

const getActiveServices = async (req, res) => {
    const { data, error } = await supabase
        .from('services')
        .select('*, users:user_id(user_id, first_name, last_name, username, city, province)')
        .eq('service_status', 'active')
        .eq('is_deleted', false);

    if (error) {
        console.error('Failed to fetch active services:', error);
        return res.status(500).json({ error: 'Failed to fetch services.' });
    }

    // Normalize rate_unit and attach provider info for each service
    const enriched = (data || []).map((service) => {
        let rateUnit = service.rate_unit;
        if (!rateUnit && service.service_description) {
            const match = service.service_description.match(/\[Rate:\s*(per_hour|per_day|per_service)\]/i);
            if (match) {
                rateUnit = match[1].toLowerCase();
            }
        }

        const u = service.users;
        const providerName = u
            ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || service.user_id
            : service.provider_name || service.user_id;
        const providerLocation = u
            ? [u.city, u.province].filter(Boolean).join(', ') || 'Campus Area'
            : service.provider_location || 'Campus Area';

        return {
            ...service,
            provider_name: providerName,
            provider_location: providerLocation,
            rate_unit: rateUnit || 'per_service',
            service_description: service.service_description ? service.service_description.replace(/\[Rate:\s*(per_hour|per_day|per_service)\]\s*/i, '').trim() : '',
        };
    });

    return res.status(200).json({ services: enriched });
};

const createService = async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ error: 'A service object is required.' });
    }

    // Role check: Only Providers can publish services to the marketplace
    const { data: userRecord } = await supabase
        .from('users')
        .select('user_type')
        .eq('user_id', req.user.user_id)
        .maybeSingle();

    if (userRecord?.user_type !== 'Provider' && req.user.user_type !== 'Provider') {
        return res.status(403).json({
            error: 'Only verified student Providers can publish services to the marketplace. Requestors can browse and book available services.'
        });
    }

    const {
        service_category: serviceCategory,
        subcategory,
        service_description: serviceDescription,
        amount_topay: amountToPay,
        rate_unit: rawRateUnit,
        picture_proof: pictureProof = []
    } = body;

    const rateUnit = ['per_hour', 'per_day', 'per_service'].includes(rawRateUnit) ? rawRateUnit : 'per_service';

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

    const trimmedCategory = serviceCategory.trim();
    if (!ALLOWED_TAXONOMY[trimmedCategory]) {
        return res.status(400).json({
            error: `Invalid service category "${trimmedCategory}". Must be one of: ${Object.keys(ALLOWED_TAXONOMY).join(', ')}.`
        });
    }

    const trimmedSubcategory = subcategory ? String(subcategory).trim() : '';
    if (!ALLOWED_TAXONOMY[trimmedCategory].includes(trimmedSubcategory)) {
        return res.status(400).json({
            error: `Invalid subcategory "${trimmedSubcategory}" for ${trimmedCategory}. Allowed subcategories: ${ALLOWED_TAXONOMY[trimmedCategory].join(', ')}.`
        });
    }

    // Try inserting with rate_unit column first
    const insertPayload = {
        user_id: req.user.user_id,
        service_category: trimmedCategory,
        subcategory: trimmedSubcategory,
        service_description: serviceDescription.trim(),
        amount_topay: numericAmount,
        rate_unit: rateUnit,
        service_status: 'active',
        picture_proof: pictureProof,
        is_deleted: false
    };

    let { data, error } = await supabase
        .from('services')
        .insert(insertPayload)
        .select('*')
        .single();

    if (error && (error.code === 'PGRST204' || error.message.includes('rate_unit'))) {
        // Fallback: embed [Rate: ...] tag into description if column does not exist
        delete insertPayload.rate_unit;
        insertPayload.service_description = `[Rate: ${rateUnit}] ${serviceDescription.trim()}`;
        const retryResult = await supabase
            .from('services')
            .insert(insertPayload)
            .select('*')
            .single();
        data = retryResult.data;
        error = retryResult.error;
    }

    if (error) {
        console.error('Failed to create service:', error);
        return res.status(500).json({ error: 'Failed to create service.' });
    }

    return res.status(201).json({
        service: {
            ...data,
            rate_unit: rateUnit,
        }
    });
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
        rate_unit,
        service_status,
        picture_proof
    } = req.body || {};

    const updates = {};
    if (rate_unit && ['per_hour', 'per_day', 'per_service'].includes(rate_unit)) {
        updates.rate_unit = rate_unit;
    }
    if (service_status && ['active', 'inactive'].includes(service_status)) {
        updates.service_status = service_status;
    }
    if (service_category && typeof service_category === 'string') {
        const cat = service_category.trim();
        if (!ALLOWED_TAXONOMY[cat]) {
            return res.status(400).json({ error: `Invalid category. Must be one of: ${Object.keys(ALLOWED_TAXONOMY).join(', ')}.` });
        }
        updates.service_category = cat;
    }
    if (subcategory !== undefined) {
        const sub = subcategory ? String(subcategory).trim() : null;
        if (sub && updates.service_category && !ALLOWED_TAXONOMY[updates.service_category].includes(sub)) {
            return res.status(400).json({ error: `Invalid subcategory for ${updates.service_category}. Allowed: ${ALLOWED_TAXONOMY[updates.service_category].join(', ')}.` });
        }
        updates.subcategory = sub;
    }
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

const getMyServices = async (req, res) => {
    const userId = req.user && req.user.user_id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false);

    if (error) {
        console.error('Failed to fetch user services:', error);
        return res.status(500).json({ error: 'Failed to fetch your services.' });
    }

    const enriched = (data || []).map((service) => {
        let rateUnit = service.rate_unit;
        if (!rateUnit && service.service_description) {
            const match = service.service_description.match(/\[Rate:\s*(per_hour|per_day|per_service)\]/i);
            if (match) {
                rateUnit = match[1].toLowerCase();
            }
        }
        return {
            ...service,
            rate_unit: rateUnit || 'per_service',
            service_description: service.service_description ? service.service_description.replace(/\[Rate:\s*(per_hour|per_day|per_service)\]\s*/i, '').trim() : '',
        };
    });

    return res.status(200).json({ services: enriched });
};

const toggleServiceStatus = async (req, res) => {
    const { serviceId } = req.params;
    if (!isValidServiceId(serviceId)) {
        return res.status(400).json({ error: 'A valid service ID is required.' });
    }

    const { status, service_status } = req.body || {};
    const targetStatus = service_status || status;
    if (!['active', 'inactive'].includes(targetStatus)) {
        return res.status(400).json({ error: "Invalid status. Must be 'active' or 'inactive'." });
    }

    const { data, error } = await supabase
        .from('services')
        .update({ service_status: targetStatus })
        .eq('service_id', serviceId)
        .eq('user_id', req.user.user_id)
        .eq('is_deleted', false)
        .select('*')
        .maybeSingle();

    if (error) {
        console.error('Failed to update service status:', error);
        return res.status(500).json({ error: 'Failed to update service status.' });
    }

    if (!data) {
        return res.status(404).json({ error: 'Service not found or unauthorized.' });
    }

    return res.status(200).json({
        message: targetStatus === 'active'
            ? 'Service is now Available in the public marketplace.'
            : 'Service is now marked as Taken / Done and hidden from public marketplace.',
        service: data
    });
};

module.exports = {
    getActiveServices,
    getMyServices,
    createService,
    updateService,
    toggleServiceStatus,
    softDeleteService
};
