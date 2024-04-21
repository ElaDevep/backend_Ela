const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({
  nit: {
    type: String,
    required: true
  },
  razonSocial: {
    type: String,
    required: true
  },
  direccion: {
    type: String,
    required: true
  },
  celular: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    enum: ['Grande'],
    required: true
  }
});

const Empresa = mongoose.model('Empresa', empresaSchema);

module.exports = Empresa;