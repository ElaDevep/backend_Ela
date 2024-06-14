const express = require('express');
const router = express.Router();
const pqrsfController = require('../controllers/pqrsfController');

router.post('/', pqrsfController.createPQRSF);
router.get('/', pqrsfController.getPQRSF);

module.exports = router;