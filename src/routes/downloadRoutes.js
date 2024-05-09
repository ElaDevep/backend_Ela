const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');


// Ruta para descargar un archivo por su ID
router.get('/download/:filename', async (req, res) => {
    try {
      // Buscar el archivo en la base de datos por su ID
      const archivo = await Archivo.findById(req.params.id);
      if (!archivo) {
        return res.status(404).send('Archivo no encontrado');
      }
      
      // Configurar las cabeceras de la respuesta para indicar que se está enviando un archivo para descargar
      res.setHeader('Content-Disposition', 'attachment; filename=' + archivo.nombre);
      
      // Enviar el archivo al cliente
      res.download(archivo.ruta);
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      res.status(500).send('Error al descargar el archivo');
    }
  });


  
module.exports = router;


  