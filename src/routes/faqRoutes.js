

const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

// Rutas para preguntas frecuentes
router.get('/', faqController.getAllFAQs);
router.post('/', faqController.createFAQ);

module.exports = router;
