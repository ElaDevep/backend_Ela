const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definición del esquema de Comentario
const comentarioSchema = new mongoose.Schema({
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId, // Cambiar el tipo a ObjectId
    ref: 'UserDetails', // Referencia al modelo UserDetails
    required: true
  },
  texto: {
    type: String,
    required: true
  },
  calificacion: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  idPost: {
    type: String,
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

// Definición del modelo Comentario basado en el esquema
const Comentario = mongoose.model('Comentario', comentarioSchema);

module.exports = Comentario;
