
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// crear la carpeta "uploads" en el directorio raíz de tu aplicación
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// configuración de almacenamiento de multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
         cb(null, '../uploads');
    },
    filename: function (req, file, cb){
        console.log(file);
        cb(null, file.fieldname + '-' + Date.now())
    }
});

// middleware de carga de archivos de multer
const upload = multer({storage: storage, fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    if(mimetype){
        cb(null, true);
    } else {
        cb("Error: Archivo no permitido");
    }
}});

// exportar solo el middleware de carga de archivos
module.exports = upload.single('myFile');