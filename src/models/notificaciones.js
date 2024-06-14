
// notificaciones
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    empresa: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empresa', 
        required: true
    },
    titulo: {
        type: String,
        required: true
    },
    mensaje: {
        type: String,
        required: true
    },
    estado: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
