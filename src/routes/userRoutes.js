const express = require("express");
const router = express.Router();
const multer = require("multer"); // Importa multer
const checkUserRole = require("../middleware/checkUserRoleMiddleware"); // Ruta corregida

// Configuración de multer para la carga de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../uploads'); // Directorio donde se almacenarán las imágenes
    },
    filename: function (req, file, cb) {
        // Se establece el nombre del archivopara que sea único
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Ruta para cargar una imagen
router.post('/upload', upload.single('image'), (req, res) => {
    // La imagen subida estará disponible en req.file
    // Aquí puedes realizar cualquier acción adicional, como guardar la ruta de la imagen en la base de datos
    res.status(200).send('Imagen cargada con éxito');
});

// Ruta para ver el perfil del usuario
router.get('/profile', checkUserRole('Visualizador'), (req, res) => {
    // Aquí puedes obtener los detalles del usuario desde la base de datos y enviarlos en la respuesta
    res.send({ message: 'Perfil del usuario' });
});

// Ruta para editar la información del usuario
router.put('/profile/edit', checkUserRole('Visualizador'), (req, res) => {
    // Aquí puedes actualizar los detalles del usuario en la base de datos
    res.send({ message: 'Información del usuario actualizada' });
});

module.exports = router;