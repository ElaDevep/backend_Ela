// En tu archivo de rutas (p. ej., routes/empresa.js)
const express = require('express');
const router = express.Router();
const User = require('../models/UserDetails');
const Empresa = require('../models/empresa');




// Ruta para crear una nueva empresa
router.post('/empresas', async (req, res) => {
  const { nit, razonSocial, direccion, celular, tipo } = req.body;

  try {
    const newEmpresa = await Empresa.create({ nit, razonSocial, direccion, celular, tipo });
    res.status(201).json(newEmpresa);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para obtener todas las empresas
router.get('/empresas', async (req, res) => {
  try {
    const empresas = await Empresa.find();
    res.json(empresas);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para actualizar una empresa por su ID
router.put('/empresas/:empresaId', async (req, res) => {
  const { empresaId } = req.params;
  const { nit, razonSocial, direccion, celular, tipo } = req.body;

  try {
    const updatedEmpresa = await Empresa.findByIdAndUpdate(
      empresaId,
      { nit, razonSocial, direccion, celular, tipo },
      { new: true }
    );

    res.json(updatedEmpresa);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para eliminar una empresa por su ID
router.delete('/empresas/:empresaId', async (req, res) => {
  const { empresaId } = req.params;

  try {
    await Empresa.findByIdAndDelete(empresaId);
    res.json({ message: 'eliminada' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
