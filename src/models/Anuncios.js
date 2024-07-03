const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definición del esquema de Anuncio
const anuncioSchema = new mongoose.Schema({
 
  title: {
    type: String,
    required: true
  },
  contenido: {
    type: String,
    required: true
  },
  idAuthor: {
    type: Schema.Types.ObjectId,
    ref: 'UserDetails' // Nombre del modelo de usuario
},
fechaCreacion: {
  type: Date,
  default: Date.now
},
  idEnterprise: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    required: true
  },
  aprobado: {
    type: Boolean,
    default: false
  },
  revision: {
    type: String,
    required: true
  },
  calificacion: {
    type: Number,
    default: 0
  },
  nCalificacion: {
    type: Number,
    default: 0
  },
  imgFrontpage: {
    type: String,
    required: false
  },

  resumen:{
    type: String,
    required: true
  }
});

// Definición del modelo Anuncio basado en el esquema
const Anuncio = mongoose.model('Anuncio', anuncioSchema);

module.exports = Anuncio;
