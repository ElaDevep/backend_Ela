const express = require('express');
const router = express.Router();
const uploadRoutes = require('../routes/uploadRoutes'); // Importar el middleware de carga de archivos
const checkUserRole = require('../middleware/checkUserRoleMiddleware');
const User = require('../models/UserDetails');




// Ruta para cargar un archivo
router.use('/upload', uploadRoutes);

// Otras rutas para el perfil y la edición del usuario
router.get('/profile', checkUserRole('Visualizador'), (req, res) => {
  res.send({ message: 'Perfil del usuario' });
});


// Ruta para editar la información del usuario
router.put('/profile/edit', checkUserRole('Visualizador'), (req, res) => {
  res.send({ message: 'Información del usuario actualizada' });
});


module.exports = router;
