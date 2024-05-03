const mongoose = require('mongoose');

// Definir los roles disponibles
const roles = ['Admin', 'Cliente', 'Visualizador', 'Carga Información', 'ELA Super Usuario'];

const UserDetailSchema = new mongoose.Schema({
    name: String,
    lastname: String,
    email: { type: String, unique: true },
    mobile: String,
    password: String,
    idEnterprice: String,
    role: { type: String, enum: roles, default: 'Admin' }, // Campo para el rol del usuario
    approved: { type: Boolean, default: false }, // Aprobación de notas en el bloc informativo
    imgProfile: { type: String, required: false }
}, {
    collection: "UserInfo"
});




module.exports = mongoose.model('UserDetails', UserDetailSchema);