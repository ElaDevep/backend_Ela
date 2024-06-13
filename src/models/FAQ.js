const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  pregunta: {
    type: String,
    required: true,
  },
  respuesta: {
    type: String,
    required: true,
  },
});

const FAQ = mongoose.model('FAQ', faqSchema);

module.exports = FAQ;