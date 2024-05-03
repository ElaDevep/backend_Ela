const mongoose = require('mongoose');

const archivoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  ruta: {
    type: String,
    required: true
  },
  resultados: {
    reduccionAhorroHidrico: {
      type: Number,
      required: true
    },
    variacion: {
      type: Number,
      required: true
    },
    VariacionConsumoRecursos: {
      type: Number,
      required: true
    },
    nPoliza: String,
    nombreCliente: String,
    tipoNegocio: String,
    lugar: String,
    mes: String
  },
  fechaSubida: {
    type: Date,
    default: Date.now
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa'
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserDetails'
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserDetails' // Cambiar 'Cliente' por el nombre del modelo que representa a los usuarios
  },
  empresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa' // Nombre del modelo que representa a las empresas
  }
});

// Sobreescribir el método toJSON para cambiar el formato de la fecha antes de enviarlo
archivoSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    ret.fechaSubida = doc.fechaSubida.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return ret;
  }
});

const Archivo = mongoose.model('Archivo', archivoSchema);

module.exports = Archivo;
