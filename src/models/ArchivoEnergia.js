const mongoose = require('mongoose');

const archivoEnergiaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  ruta: {
    type: String,
    required: true
  },
  resultados: {
    variacionConsumoEnergia: {
      type: Number,
      required: true
    },
    variacionConsumoNoAsociado: {
      type: Number,
      required: true
    },
    variacionCostosEnergia: {
      type: Number,
      required: true
    },
    variacionGasesInvernadero: {
      type: Number,
      required: true
    },
    variacionProduccionEnergetica: {
      type: Number,
      required: true
    },
    variacionProporcionEnergia: {
      type: Number,
      required: true
    },
    variacionPuntoMedicion: {
      type: Number,
      required: true
    },
    variacionDiagnosticoEnergetico: {
      type: Number,
      required: true
    },
    variacionPersonalCapacitado: {
      type: Number,
      required: true
    },
    nNit: String,
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
  
});

// Sobreescribir el método toJSON para cambiar el formato de la fecha antes de enviarlo
archivoEnergiaSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    ret.fechaSubida = doc.fechaSubida.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return ret;
  }
});

const ArchivoEnergia = mongoose.model('ArchivoEnergia', archivoEnergiaSchema);
module.exports = ArchivoEnergia;
