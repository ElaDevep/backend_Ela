const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Importa multer
const Archivo = require('../models/Archivos');

// Configura multer
const upload = multer({ dest: '../uploads' });


// Modulo Energia
// Ruta para subir el archivo de la usuaria y procesarlo

