
// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
   empresa: {
        type: String,
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
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
