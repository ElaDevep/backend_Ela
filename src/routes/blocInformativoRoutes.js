


const express = require("express");
const router = express.Router();
const checkUserRole = require("../middleware/checkUserRoleMiddleware");

// Ruta para el bloc informativo (solo para ELA Super Usuario)
router.get('/', checkUserRole('ELA Super Usuario'), (req, res) => {
    // Renderizar la página del bloc informativo
});

// Ruta POST para la aprobación de notas en el bloc informativo
router.post('/approve/:noteId', checkUserRole('ELA Super Usuario'), async (req, res) => {
   
});

// Ruta para la carga de notas en el bloc informativo (solo para usuarios con rol de "Carga Información" o superior)
router.post('/upload', checkUserRole(['Carga Información', 'Admin']), async (req, res) => {
  
});

module.exports = router;
