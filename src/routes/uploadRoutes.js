// Subir imagenes y documentos excel, word, etc.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear la carpeta "uploads" en el directorio raíz de tu aplicación si no existe
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Directorio de subida de archivos:', uploadsDir); // Agrega esta línea
}

// Configuración de almacenamiento de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Usar la carpeta "uploads" creada anteriormente
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Middleware de carga de archivos de multer
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Permitir múltiples tipos de archivos: jpeg, jpg, png, gif, xlsx, xls, docx, doc, pdf
    const allowedFileTypes = /jpeg|jpg|png|gif|xlsx|xls|docx|doc|pdf/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error("Error: Archivo no permitido. Sube archivos de tipo jpeg, jpg, png, gif, xlsx, xls, docx, doc o pdf."));
    }
  }
});

// Ruta para cargar un archivo
router.post('/upload', upload.single('myFile'), (req, res) => {
  // El archivo subido estará disponible en req.file
  // Aquí puedes realizar cualquier acción adicional, como guardar la ruta del archivo en la base de datos
  res.status(200).send('Archivo cargado con éxito');
});

module.exports = router;