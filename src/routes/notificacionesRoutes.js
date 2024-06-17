const express = require('express');
const router = express.Router();
const Notification = require('../models/notificaciones');
const Empresa = require('../models/Empresa');


// Ruta para enviar una nueva notificación (POST)
router.post('/', async (req, res) => {
    try {
        // Extraer los campos del cuerpo de la solicitud
        const { empresaId, titulo, mensaje, estado } = req.body;

        // Verificar que la empresa existe
        console.log('Empresa ID recibido:', empresaId); // Añade un log para el ID de la empresa
        const empresa = await Empresa.findById(empresaId);
        if (!empresa) {
            console.error('Empresa no encontrada para el ID:', empresaId);
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        // Crear una nueva instancia de los campos
        const newNotification = new Notification({ empresa: empresaId, titulo, mensaje, estado });

        // Guardar la nueva notificación
        await newNotification.save();

        // Responder
        res.status(201).json(newNotification);
    } catch (error) {
        // Manejar errores y enviar una respuesta de error al cliente
        console.error('Error al crear la notificación:', error);
        res.status(500).json({ error: 'Error al crear la notificación' });
    }
});

// Ruta para obtener todas las notificaciones (GET)
router.get('/', async (req, res) => {
    try {
        // Buscar todas las notificaciones en la base de datos y ordenarlas cronológicamente por la fecha
        const notifications = await Notification.find().sort({ fecha: -1 }); 

        // Responder con la lista de notificaciones encontradas
        res.json(notifications);
    } catch (error) {
        // Manejar errores y enviar una respuesta de error al cliente
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las notificaciones' });
    }
});

  //rta  notificaciones por el ID de la empresa (GET)
router.get('/noti/:empresaId', async (req, res) => {
    const { empresaId } = req.params;

    try {
        // Buscar notificaciones por el ID de la empresa en la base de datos
        const notifications = await Notification.find({ empresa: empresaId }).sort({ fecha: -1 });
        if (!notifications.length) {
            return res.status(404).json({ error: 'No se encontraron notificaciones para esta empresa' });
        }

        // Responder con las notificaciones encontradas
        res.json(notifications);
    } catch (error) {
        // Manejar errores y enviar una respuesta de error al cliente
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las notificaciones' });
    }
});


// Ruta para obtener una notificación por su ID (GET)
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Buscar la notificación por su ID en la base de datos
        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        // Responder con la notificación encontrada
        res.json(notification);
    } catch (error) {
        // Manejar errores y enviar una respuesta de error al cliente
        console.error(error);
        res.status(500).json({ error: 'Error al obtener la notificación' });
    }
});

// Ruta para actualizar una notificación por su ID (PUT)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { empresa, titulo, mensaje, estado } = req.body;

    try {
        // Actualizar la notificación por su ID en la base de datos
        const notification = await Notification.findByIdAndUpdate(id, { empresa, titulo, mensaje, estado }, { new: true });
        if (!notification) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        // Responder con la notificación actualizada
        res.json(notification);
    } catch (error) {
        // Manejar errores y enviar una respuesta de error al cliente
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar la notificación' });
    }
});

// Ruta para eliminar una notificación por su ID (DELETE)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Eliminar la notificación por su ID de la base de datos
        const notification = await Notification.findByIdAndDelete(id);
        if (!notification) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        // Responder con un código 204 (No Content) indicando que la notificación fue eliminada
        res.status(204).end();
    } catch (error) {
        // Manejar errores y enviar una respuesta de error al cliente
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar la notificación' });
    }
});

module.exports = router;

