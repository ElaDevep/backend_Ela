const mongoose = require('mongoose');

// Definir los roles disponibles
const roles = ['Admin', 'Visualizador', 'Carga Información', 'ELA Super Usuario'];

const UserDetailSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    mobile: String,
    password: String,
    role: { type: String, enum: roles, default: 'Visualizador' }, // Campo para el rol del usuario
    approved: { type: Boolean, default: false } // Aprobación de notas en el bloc informativo
}, {
    collection: "UserInfo"
});



module.exports = mongoose.model('UserDetails', UserDetailSchema);
