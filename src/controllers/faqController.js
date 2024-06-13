const FAQ = require('../models/FAQ');

// Obtener todas las preguntas frecuentes
exports.getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.status(200).json({ status: 'success', data: faqs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al obtener preguntas frecuentes' });
  }
};

// Crear una nueva pregunta frecuente
exports.createFAQ = async (req, res) => {
  const { pregunta, respuesta } = req.body;
  try {
    const newFAQ = new FAQ({ pregunta, respuesta });
    await newFAQ.save();
    res.status(201).json({ status: 'success', data: newFAQ });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al crear pregunta frecuente' });
  }
};
