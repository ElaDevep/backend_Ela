const mongoose = require('mongoose');

const archivoEducacionSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  ruta: {
    type: String,
    required: true
  },

  // Resultados específicos de educación
  resultados: {
    variacionPersonal: {
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
    ref: 'Empresa' // Nombre del modelo que representa a las empresas
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserDetails'
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserDetails' // Cambiar 'Cliente' por el nombre del modelo que representa a los usuarios
  },
  nitEmpresa: {
    type: String, // Cambia el tipo según corresponda
    required: true // Opcional, dependiendo de tus necesidades
  }
});

// Sobreescribir el método toJSON para cambiar el formato de la fecha antes de enviarlo
archivoEducacionSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    ret.fechaSubida = doc.fechaSubida.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return ret;
  }
});

const ArchivoEducacion = mongoose.model('ArchivoEducacion', archivoEducacionSchema);
module.exports = ArchivoEducacion;
