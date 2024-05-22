const express = require('express');
const axios = require('axios');
const router = express.Router();


// Ruta para enviar datos (POST)
router.post('/datos', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:4000/notificaciones/datos', req.body);
        res.json(response.data);
    } catch (error) {
        console.error('Error al enviar datos:', error);
        res.status(500).json({ error: 'Error al enviar datos' });
    }
});

// Ruta para obtener datos (GET)
router.get('/datos', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:4000/notificaciones/datos');
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener datos:', error);
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

// Ruta para eliminar datos (DELETE)
router.delete('/datos/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const response = await axios.delete(`http://localhost:4000/notificaciones/datos/${id}`);
        res.json(response.data);
    } catch (error) {
        console.error('Error al eliminar datos:', error);
        res.status(500).json({ error: 'Error al eliminar datos' });
    }
});

module.exports = router;
