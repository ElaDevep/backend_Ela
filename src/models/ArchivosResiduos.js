const mongoose = require('mongoose');

const archivoResiduoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  ruta: {
    type: String,
    required: true
  },

  resultados: {
    variacionGeneracionResiduos: {
      type: Number,
      required: true
    },
    reduccionPGIRS: {
      type: Number,
      required: true
    },
    reduccionRespel: {
      type: Number,
      required: true
    },
    variacionResiduosPeligrosos: {
      type: Number,
      required: true
    },
    variacionReciclaje: {
      type: Number,
      required: true
    },
    variacionDesperdicios: {
      type: Number,
      required: true
    },
    variacionRAEESI: {
      type: Number,
      required: true
    },
    variacionPersonal: {
      type: Number,
      required: true
    },
    nNit: String,
    nombreCliente: String,
    tipoNegocio: String,
    lugar: String,
    mes: String,
    sede:String
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

  idEmpresa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa' // Referencia al modelo de Empresa
  },
});

// Sobreescribir el método toJSON para cambiar el formato de la fecha antes de enviarlo
archivoResiduoSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    ret.fechaSubida = doc.fechaSubida.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return ret;
  }
});

const ArchivoResiduo = mongoose.model('ArchivoResiduo', archivoResiduoSchema);
module.exports = ArchivoResiduo;
