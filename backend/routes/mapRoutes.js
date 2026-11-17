const express = require('express');
const router = express.Router();
const { getCampusLocations } = require('../controllers/mapController');

router.get('/locations', getCampusLocations);

module.exports = router;
