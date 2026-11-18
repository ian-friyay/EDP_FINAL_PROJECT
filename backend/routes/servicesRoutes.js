const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
    getActiveServices,
    getMyServices,
    createService,
    updateService,
    toggleServiceStatus,
    softDeleteService
} = require('../controllers/servicesController');

const router = express.Router();

router.get('/', getActiveServices);
router.get('/mine', requireAuth, getMyServices);
router.get('/my-services', requireAuth, getMyServices);
router.post('/', requireAuth, createService);
router.put('/:serviceId', requireAuth, updateService);
router.patch('/:serviceId/status', requireAuth, toggleServiceStatus);
router.put('/:serviceId/status', requireAuth, toggleServiceStatus);
router.patch('/:serviceId/soft-delete', requireAuth, softDeleteService);

module.exports = router;
