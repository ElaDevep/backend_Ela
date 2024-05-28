const mongoose = require('mongoose');

const empresaSchema = new mongoose.Schema({
  nNit: {
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
    required: true
  },
  ultimoDocumento: {
    type: mongoose.Schema.Types.ObjectId,  // Tipo para almacenar el ID del último documento subido
    ref: 'Archivo'  // Referencia al modelo de Archivo
  },
  fechaSubida: {
    type: Date,  // Tipo para almacenar la fecha de subida
    default: Date.now  // Valor predeterminado: la fecha y hora actuales
  }
});

const Empresa = mongoose.model('Empresa', empresaSchema);

module.exports = Empresa;