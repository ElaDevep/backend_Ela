// En tu archivo de rutas para el chatbot (chatbotRoutes.js)

const express = require('express');
const router = express.Router();
const Chatbot = require('../models/Chatbot');

// Ruta para enviar una pregunta al chatbot y guardarla en MongoDB
router.post('/enviar-pregunta', async (req, res) => {
  const { usuario, pregunta } = req.body;

  // Validación de datos (usuario y pregunta son obligatorios)
  if (!usuario || !pregunta) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Guardar la pregunta en MongoDB
    const nuevaEntrada = new Chatbot({
      usuario,
      pregunta
    });

    await nuevaEntrada.save();

    // Aquí puedes enviar la pregunta a Dialogflow y obtener la respuesta si lo deseas

    res.status(200).json({ message: 'Pregunta enviada y guardada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar la pregunta' });
  }
});

// Otras rutas relacionadas con el chatbot (por ejemplo, obtener todos los registros, etc.)

module.exports = router;

