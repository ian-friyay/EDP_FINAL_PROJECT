const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const {
    getActiveServices,
    createService,
    softDeleteService
} = require('../controllers/servicesController');

const router = express.Router();

router.get('/', getActiveServices);
router.post('/', requireAuth, createService);
router.patch('/:serviceId/soft-delete', requireAuth, softDeleteService);

module.exports = router;
