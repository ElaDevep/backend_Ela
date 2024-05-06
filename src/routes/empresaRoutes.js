const express = require('express');
const router = express.Router();
const User = require('../models/UserDetails');
const Empresa = require('../models/Empresa');

// Ruta para crear una nueva empresa
router.post('/empresas', async (req, res) => {
    const { nit, razonSocial, direccion, celular, tipo } = req.body;
  
    try {
      // Verificar si la empresa ya existe
      const existingEmpresa = await Empresa.findOne({ nit });
      if (existingEmpresa) {
        return res.status(400).json({ message: 'La empresa ya existe' });
      }
  
      // Si la empresa no existe, crearla
      await Empresa.create({ nit, razonSocial, direccion, celular, tipo });
      res.status(201).json({ message: 'creada' });
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

// Ruta para obtener una empresa por su ID
router.get('/empresas/:empresaId', async (req, res) => {
  const { empresaId } = req.params;

  try {
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    res.json(empresa);
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
