const express = require('express');
const router = express.Router();

// Datos

// Ruta para manejar la información de la póliza y consumo de agua
router.post('/poliza', (req, res) => {
  const { numeroPoliza, nombreCliente, tipoNegocio, consumoAntes, consumoDespues } = req.body;

  // Aquí puedes procesar los datos recibidos como desees (guardar en base de datos, etc.)
  console.log('Información recibida:', req.body);

  // Respuesta de éxito
  res.status(200).json({ message: 'Información recibida correctamente' });
});

// Ruta para actualizar 
router.patch('/poliza/:numeroPoliza', (req, res) => {
  const numeroPoliza = req.params.numeroPoliza; 
  const updatedFields = req.body;

  // Aquí podrías implementar la lógica para actualizar la información en la base de datos
  // Por ejemplo, buscar la póliza por su número y actualizar los campos especificados
  console.log(`Actualizando información parcial de la póliza ${numeroPoliza}:`, updatedFields);

  // Respuesta de éxito
  res.status(200).json({ message: `Información parcial de la póliza ${numeroPoliza} actualizada correctamente` });
});

// REDUCCIÓN O AHORRO HIDRICO

// Objeto para almacenar los resultados
let resultadosCalculos = {
  ahorroHidrico: null,
  porcentajeReduccion: null
};

// Función para calcular el ahorro hídrico y porcentaje de reducción
function calcularAhorroHidrico(lineaBaseM3, consumoActualM3) {
  const ahorroHidrico = lineaBaseM3 - consumoActualM3;
  const porcentajeReduccion = ((lineaBaseM3 - consumoActualM3) / lineaBaseM3) * 100;
  return { ahorroHidrico, porcentajeReduccion };
}

// Ruta POST para calcular el ahorro hídrico
router.post('/calcular-hidrico', (req, res) => {
  const { lineaBaseM3, consumoActualM3 } = req.body;

  // Calcular ahorro hídrico y porcentaje de reducción
  resultadosCalculos = calcularAhorroHidrico(lineaBaseM3, consumoActualM3);

  res.json({
    
    ahorroHidrico: resultadosCalculos.ahorroHidrico,
    porcentajeReduccion: resultadosCalculos.porcentajeReduccion
  });
});

// Ruta GET para obtener los resultados almacenados
router.get('/resultados-calculos', (req, res) => {
  // Obtener resultados almacenados
  const { ahorroHidrico, porcentajeReduccion } = resultadosCalculos;

  if (ahorroHidrico === null || porcentajeReduccion === null) {
    return res.status(400).json({ error: 'Resultados no definidos' });
  }

  // Responder con los resultados almacenados
  res.json({
    ahorroHidrico,
    porcentajeReduccion
  });
});

// Ruta PUT para actualizar los resultados
router.put('/modificar-resultados', (req, res) => {
  const { nuevoAhorroHidrico, nuevoConsumoActualM3 } = req.body;

  // Calcular nuevos resultados
  const { ahorroHidrico, porcentajeReduccion } = calcularAhorroHidrico(nuevoAhorroHidrico, nuevoConsumoActualM3);

  // Actualizar los resultados almacenados
  resultadosCalculos = {
    ahorroHidrico,
    porcentajeReduccion
  };

  res.json({
    ahorroHidrico,
    porcentajeReduccion
  });
});


// CONSUMO DE RECURSOS O MATERIAS PRIMAS (CM)

let resultadosCM = {
  consumoMaterialInicial: null,
  produccion: null,
  consumoMaterialFinal: null,
  variacionPorcentaje: null
};

// Función para calculos
function calcularConsumoMateriasPrimas(consumoInicial, produccion, consumoFinal) {
  const CM_inicial = consumoInicial / produccion;
  const CM_final = consumoFinal / produccion;
  const variacionPorcentaje = ((CM_inicial - CM_final) / CM_inicial) * 100;
  return { CM_inicial, CM_final, variacionPorcentaje };
}

// Ruta POST cm
router.post('/calcular-cm', (req, res) => {
  const { consumoInicial, produccion, consumoFinal } = req.body;

  // Calcular CM y variación porcentual
  const { CM_inicial, CM_final, variacionPorcentaje } = calcularConsumoMateriasPrimas(consumoInicial, produccion, consumoFinal);

  // Actualizar los resultados en resultadosCM
  resultadosCM.consumoMaterialInicial = CM_inicial;
  resultadosCM.produccion = produccion;
  resultadosCM.consumoMaterialFinal = CM_final;
  resultadosCM.variacionPorcentaje = variacionPorcentaje;

  res.json({
    consumoMaterialInicial: CM_inicial,
    consumoMaterialFinal: CM_final,
    variacionPorcentaje: variacionPorcentaje
  });
});


// Ruta GET  cm
router.get('/resultados-cm', (req, res) => {

  // Obtener resultados 
  const { consumoMaterialInicial, produccion, consumoMaterialFinal, variacionPorcentaje } = resultadosCM;

  if (consumoMaterialInicial === null || produccion === null || consumoMaterialFinal === null || variacionPorcentaje === null) {
    return res.status(400).json({ error: 'Resultados no definidos' });
  }

  // Responder con los resultados
  res.json({
    consumoMaterialInicial,
    produccion,
    consumoMaterialFinal,
    variacionPorcentaje
  });
});

// Ruta PUT para actualizar los resultados de CM
router.put('/modificar-resultados-cm', (req, res) => {
  const { nuevoConsumoInicial, nuevaProduccion, nuevoConsumoFinal } = req.body;

  // Calcular nuevos resultados de CM
  const { CM_inicial, CM_final, variacionPorcentaje } = calcularConsumoMateriasPrimas(nuevoConsumoInicial, nuevaProduccion, nuevoConsumoFinal);

  // Actualizar los resultados almacenados de CM
  resultadosCM = {
    consumoMaterialInicial: CM_inicial,
    produccion: nuevaProduccion,
    consumoMaterialFinal: CM_final,
    variacionPorcentaje
  };

  res.json({
    consumoMaterialInicial: CM_inicial,
    produccion: nuevaProduccion,
    consumoMaterialFinal: CM_final,
    variacionPorcentaje
  });
});


// PERSONAL CAPACITADO (PC) 

let resultadosPCEficienciaEnergetica = {
  PCi: null,
  PCf: null,
  variacionPorcentaje: null
};

// Función para calcular pc
function calcularPersonalCapacitadoEficienciaEnergetica(PCi, PCf) {
  const variacionPorcentaje = ((PCf - PCi) / PCi) * 100;
  return variacionPorcentaje;
}

// Ruta POST pc
router.post('/calcular-pc-eficiencia-energetica', (req, res) => {
  const { PCi, PCf } = req.body;

  // Calcular variación de PC 
  const variacionPorcentaje = calcularPersonalCapacitadoEficienciaEnergetica(PCi, PCf);

 
  resultadosPCEficienciaEnergetica.PCi = PCi;
  resultadosPCEficienciaEnergetica.PCf = PCf;
  resultadosPCEficienciaEnergetica.variacionPorcentaje = variacionPorcentaje;

  res.json({
    variacionPorcentaje
  });
});

// Ruta GET 
router.get('/resultados-pc-eficiencia-energetica', (req, res) => {

 
  const { PCi, PCf, variacionPorcentaje } = resultadosPCEficienciaEnergetica;

  if (PCi === null || PCf === null || variacionPorcentaje === null) {
    return res.status(400).json({ error: 'Resultados no definidos' });
  }

  
  res.json({
    PCi,
    PCf,
    variacionPorcentaje
  });
});
// Ruta PUT 
router.put('/modificar-resultados-pc-eficiencia-energetica', (req, res) => {
  const { nuevoPCi, nuevoPCf } = req.body;

 
  const nuevaVariacionPorcentaje = calcularPersonalCapacitadoEficienciaEnergetica(nuevoPCi, nuevoPCf);

  
  resultadosPCEficienciaEnergetica.PCi = nuevoPCi;
  resultadosPCEficienciaEnergetica.PCf = nuevoPCf;
  resultadosPCEficienciaEnergetica.variacionPorcentaje = nuevaVariacionPorcentaje;

  res.json({
    PCi: nuevoPCi,
    PCf: nuevoPCf,
    variacionPorcentaje: nuevaVariacionPorcentaje
  });
});


module.exports = router;
