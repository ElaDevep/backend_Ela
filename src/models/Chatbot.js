// En tu archivo de modelo (por ejemplo, chatbotModel.js)

const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema({
  usuario: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  pregunta: { type: String, required: true },
  respuesta: { type: String } 
});

const Chatbot = mongoose.model('Chatbot', chatbotSchema);

module.exports = Chatbot;

