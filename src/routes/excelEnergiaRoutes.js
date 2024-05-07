const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Importa multer
const ArchivoEnergia = require('../models/ArchivoEnergia');


// Configura multer
const upload = multer({ dest: '../uploads' });


// Modulo Energia
// Ruta para subir el archivo de la usuaria y procesarlo

router.post('/uploadEnergia', upload.single('file'), async (req, res) => {
    try {
      console.log(req.file);
      const file = req.file;
      const clienteId = req.body.clienteId;
      const empresaId = req.body.empresaId;
      const Mes = req.body.mes;
    
      const fileData = fs.readFileSync(file.path);
    const uploadPath = path.join(__dirname, '../uploads/excelEnergia', file.originalname);
    fs.writeFileSync(uploadPath, fileData);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(uploadPath);
    const worksheet = workbook.getWorksheet(1);

    // Evaluar la fórmula del consumo de energia
    const c6 = parseFloat(worksheet.getCell('C6').value.toString().replace(',', '.'));
    const c7 = parseFloat(worksheet.getCell('C7').value.toString().replace(',', '.'));
    const variacionConsumoEnergia = ((c6 - c7) / c6) * 100;

   // Evaluar formula para el consumo de energia no asociado

   const c19 = parseFloat(worksheet.getCell('C19').value.toString().replace(',', '.'));
   const c20 = parseFloat(worksheet.getCell('C20').value.toString().replace(',', '.'));
   const variacionConsumoNoAsociado = ((c20 - c19) / c19) * 100;


   // Evaluar formula para costos de energia

   const c34 = parseFloat(worksheet.getCell('C34').value.toString().replace(',', '.'));
   const c35 = parseFloat(worksheet.getCell('C35').value.toString().replace(',', '.'));
   const variacionCostosEnergia = ((c34 - c35) / c34) * 100;


    // Evaluar formula para gases de efacto invernadero

   const c48 = parseFloat(worksheet.getCell('C48').value.toString().replace(',', '.'));
   const c49 = parseFloat(worksheet.getCell('C49').value.toString().replace(',', '.'));
   const variacionGasesInvernadero = ((c48 - c49) / c48) * 100;

    // Evaluar formula para la produccion energetica

   const c62 = parseFloat(worksheet.getCell('C62').value.toString().replace(',', '.'));
   const c63 = parseFloat(worksheet.getCell('C63').value.toString().replace(',', '.'));
   const variacionProduccionEnergetica = ((c63 - c62) / c62) * 100;

   // Evaluar formula para la Proporción consumo de energía (PCE)

   const c77 = parseFloat(worksheet.getCell('C77').value.toString().replace(',', '.'));
   const c78 = parseFloat(worksheet.getCell('C78').value.toString().replace(',', '.'));
   const variacionProporcionEnergia = ((c78 - c77) / c77) * 100;

   // Evaluar formula para el punto de medicion

   const c89 = parseFloat(worksheet.getCell('C89').value.toString().replace(',', '.'));
   const c90 = parseFloat(worksheet.getCell('C90').value.toString().replace(',', '.'));
   const variacionPuntoMedicion = ((c90 - c89) / c89) * 100;

   // Evaluar formula para el diagnostico energetico

   const c105 = parseFloat(worksheet.getCell('C105').value.toString().replace(',', '.'));
   const c106 = parseFloat(worksheet.getCell('C106').value.toString().replace(',', '.'));
   const variacionDiagnosticoEnergetico = ((c106 - c105) / c105) * 100;


   // Evaluar formula para el personal capacitado

   const c115 = parseFloat(worksheet.getCell('C115').value.toString().replace(',', '.'));
   const c116 = parseFloat(worksheet.getCell('C116').value.toString().replace(',', '.'));
   const variacionPersonalCapacitado= ((c116 - c115) / c115) * 100;


    // Obtener otros valores del Excel
    const nNic = worksheet.getCell('C126').value;
    const nombreCliente = worksheet.getCell('C127').value;
    const tipoNegocio = worksheet.getCell('C128').value;
    const lugar = worksheet.getCell('C130').value;
    const mes = worksheet.getCell('C129').value;

    const resultados = {
      nNic,
      nombreCliente,
      tipoNegocio,
      lugar,
      mes,
      variacionConsumoEnergia,
      variacionConsumoNoAsociado,
      variacionCostosEnergia,
      variacionGasesInvernadero,
      variacionProduccionEnergetica,
      variacionProporcionEnergia,
      variacionPuntoMedicion,
      variacionDiagnosticoEnergetico,
      variacionPersonalCapacitado
      
    };
    // Guardar los resultados en un nuevo libro de Excel
    const resultWorkbook = new ExcelJS.Workbook();
    const resultWorksheet = resultWorkbook.addWorksheet('Resultados');
    resultWorksheet.columns = [
      { header: 'N Nic', key: 'nNic' },
      { header: 'Nombre del cliente', key: 'nombreCliente' },
      { header: 'Tipo de negocio', key: 'tipoNegocio' },
      { header: 'Lugar', key: 'lugar' },
      { header: 'Mes', key: 'mes' },
      { header: '% Variacion Consumo de Energia', key: 'variacionConsumoEnergia', type: 'number' },
      { header: '% Variación Consumo no Asociado', key: 'variacionConsumoNoAsociado', type: 'number' },
      { header: '% Variación Costos de Energia', key: 'variacionCostosEnergia', type: 'number' },
      { header: '% Variación Gases de Efecto invernadero', key: 'variacionGasesInvernadero', type: 'number' },
      { header: '% Variación Producción Energetica', key: 'variacionProduccionEnergetica', type: 'number' },
      { header: '% Variación de Proporción Energetica', key: 'variacionProporcionEnergia', type: 'number' },
      { header: '% Variación de Punto de medición', key: 'variacionPuntoMedicion', type: 'number' },
      { header: '% Variación Diagnostico Energetico', key: 'variacionDiagnosticoEnergetico', type: 'number' },
      { header: '% Variación Personal Capacitado', key: 'variacionPersonalCapacitado', type: 'number' }

    ];
    resultWorksheet.addRow({
        nNic: resultados.nNic,
        nombreCliente: resultados.nombreCliente,
        tipoNegocio: resultados.tipoNegocio,
        lugar: resultados.lugar,
        mes: resultados.mes,
        variacionConsumoEnergia: resultados.variacionConsumoEnergia,
        variacionConsumoNoAsociado: resultados.variacionConsumoNoAsociado,
        variacionCostosEnergia: resultados.variacionCostosEnergia,
        variacionGasesInvernadero: resultados.variacionGasesInvernadero,
        variacionProduccionEnergetica: resultados.variacionProduccionEnergetica,
        variacionProporcionEnergia: resultados.variacionProporcionEnergia,
        variacionPuntoMedicion: resultados.variacionPuntoMedicion,
        variacionDiagnosticoEnergetico: resultados.variacionDiagnosticoEnergetico,
        variacionPersonalCapacitado: resultados.variacionPersonalCapacitado
        
      });
      const resultDirPath = path.join(__dirname, '../uploads/excelEnergia');
    const resultFilePath = path.join(resultDirPath, `resultados_${file.originalname}`);
    await resultWorkbook.xlsx.writeFile(resultFilePath);

    // Guardar ambos archivos en la base de datos
    const archivo = new ArchivoEnergia({
        nombre: file.originalname,
        ruta: uploadPath,
        resultados: resultados,
        cliente: clienteId,
        empresa: empresaId
      });
      await archivo.save();
      
      res.status(200).send('Archivos subidos y procesados correctamente.');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al procesar los archivos.');
    }
  });

  // Endpoint para descargar el archivo Excel de resultados
router.get('/resultadosE/:id/:mes', async (req, res) => {
  try {
    const id = req.params.id;
    const mes = req.params.mes;

    const archivo = await ArchivoEnergia.findOne({ _id: id, 'resultados.mes': mes });

    if (!archivo) {
      return res.status(404).send('Archivo no encontrado');
    }

    const resultados = archivo.resultados;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resultados');
    worksheet.columns = [

      { header: 'N Nic', key: 'nNic' },
      { header: 'Nombre del cliente', key: 'nombreCliente' },
      { header: 'Tipo de negocio', key: 'tipoNegocio' },
      { header: 'Lugar', key: 'lugar' },
      { header: 'Mes', key: 'mes' },
      { header: '% Variacion Consumo de Energia', key: 'variacionConsumoEnergia', type: 'number' },
      { header: '% Variación Consumo no Asociado', key: 'variacionConsumoNoAsociado', type: 'number' },
      { header: '% Variación Costos de Energia', key: 'variacionCostosEnergia', type: 'number' },
      { header: '% Variación Gases de Efecto invernadero', key: 'variacionGasesInvernadero', type: 'number' },
      { header: '% Variación Producción Energetica', key: 'variacionProduccionEnergetica', type: 'number' },
      { header: '% Variación de Proporción Energetica', key: 'variacionProporcionEnergia', type: 'number' },
      { header: '% Variación de Punto de medición', key: 'variacionPuntoMedicion', type: 'number' },
      { header: '% Variación Diagnostico Energetico', key: 'variacionDiagnosticoEnergetico', type: 'number' },
      { header: '% Variación Personal Capacitado', key: 'variacionPersonalCapacitado', type: 'number' }
     
    ];

    worksheet.addRow({
      nNic: resultados.nNic,
      nombreCliente: resultados.nombreCliente,
      tipoNegocio: resultados.tipoNegocio,
      lugar: resultados.lugar,
      mes: resultados.mes,
      variacionConsumoEnergia: resultados.variacionConsumoEnergia,
      variacionConsumoNoAsociado: resultados.variacionConsumoNoAsociado,
      variacionCostosEnergia: resultados.variacionCostosEnergia,
      variacionGasesInvernadero: resultados.variacionGasesInvernadero,
      variacionProduccionEnergetica: resultados.variacionProduccionEnergetica,
      variacionProporcionEnergia: resultados.variacionProporcionEnergia,
      variacionPuntoMedicion: resultados.variacionPuntoMedicion,
      variacionDiagnosticoEnergetico: resultados.variacionDiagnosticoEnergetico,
      variacionPersonalCapacitado: resultados.variacionPersonalCapacitado
     
    });

    const filename = `resultados_${archivo._id}_${mes}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al descargar los resultados.');
  }
});

// Endpoint para descargar el archivo Excel histórico
router.get('/historicoE', async (req, res) => {
  try {
    const archivos = await ArchivoEnergia.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historico');
    worksheet.columns = [
      { header: 'N Nic', key: 'nNic' },
      { header: 'Nombre del cliente', key: 'nombreCliente' },
      { header: 'Tipo de negocio', key: 'tipoNegocio' },
      { header: 'Lugar', key: 'lugar' },
      { header: 'Mes', key: 'mes' },
      { header: 'Fecha de subida', key: 'fechaSubida', type: 'date' },
      { header: 'Nombre del archivo', key: 'nombre' },
      { header: 'Ruta', key: 'ruta' },
      { header: '% Variacion Consumo de Energia', key: 'variacionConsumoEnergia', type: 'number' },
      { header: '% Variación Consumo no Asociado', key: 'variacionConsumoNoAsociado', type: 'number' },
      { header: '% Variación Costos de Energia', key: 'variacionCostosEnergia', type: 'number' },
      { header: '% Variación Gases de Efecto invernadero', key: 'variacionGasesInvernadero', type: 'number' },
      { header: '% Variación Producción Energetica', key: 'variacionProduccionEnergetica', type: 'number' },
      { header: '% Variación de Proporción Energetica', key: 'variacionProporcionEnergia', type: 'number' },
      { header: '% Variación de Punto de medición', key: 'variacionPuntoMedicion', type: 'number' },
      { header: '% Variación Diagnostico Energetico', key: 'variacionDiagnosticoEnergetico', type: 'number' },
      { header: '% Variación Personal Capacitado', key: 'variacionPersonalCapacitado', type: 'number' }
     
    ];

    archivos.forEach(archivo => {
      worksheet.addRow({
        nNic: archivo.resultados.nNic,
        nombreCliente: archivo.resultados.nombreCliente,
        tipoNegocio: archivo.resultados.tipoNegocio,
        lugar: archivo.resultados.lugar,
        mes: archivo.resultados.mes,
        fechaSubida: archivo.fechaSubida,
        nombre: archivo.nombre,
        ruta: archivo.ruta,
        variacionConsumoEnergia: archivo.resultados.variacionConsumoEnergia,
        variacionConsumoNoAsociado: archivo.resultados.variacionConsumoNoAsociado,
        variacionCostosEnergia: archivo.resultados.variacionCostosEnergia,
        variacionGasesInvernadero: archivo.resultados.variacionGasesInvernadero,
        variacionProduccionEnergetica: archivo.resultados.variacionProduccionEnergetica,
        variacionProporcionEnergia: archivo.resultados.variacionProporcionEnergia,
        variacionPuntoMedicion: archivo.resultados.variacionPuntoMedicion,
        variacionDiagnosticoEnergetico: archivo.resultados.variacionDiagnosticoEnergetico,
        variacionPersonalCapacitado: archivo.resultados.variacionPersonalCapacitado
        
      });
    });

    const filename = 'historico.xlsx';

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al descargar el histórico.');
  }
});

// endpoint para visualizar los datos 
router.get('/resulE/:id/:mes', async (req, res) => {
  try {
    const id = req.params.id;
    const mes = req.params.mes;

    const archivo = await ArchivoEnergia.findOne({ _id: id, 'resultados.mes': mes });

    if (!archivo) {
      return res.status(404).send('Archivo no encontrado');
    }

    const resultados = archivo.resultados;

    // Construir un nuevo objeto para ordenar la respuesta
    const respuestaOrdenada = {
      nNic: resultados.nNic,
      nombreCliente: resultados.nombreCliente,
      tipoNegocio: resultados.tipoNegocio,
      lugar: resultados.lugar,
      mes: resultados.mes,
      variaciones: {
        variacionConsumoEnergia: resultados.variacionConsumoEnergia,
        variacionConsumoNoAsociado: resultados.variacionConsumoNoAsociado,
        variacionCostosEnergia: resultados.variacionCostosEnergia,
        variacionGasesInvernadero: resultados.variacionGasesInvernadero,
        variacionProduccionEnergetica: resultados.variacionProduccionEnergetica,
        variacionProporcionEnergia: resultados.variacionProporcionEnergia,
        variacionPuntoMedicion: resultados.variacionPuntoMedicion,
        variacionDiagnosticoEnergetico: resultados.variacionDiagnosticoEnergetico,
        variacionPersonalCapacitado: resultados.variacionPersonalCapacitado
      }
    };

    res.status(200).json(respuestaOrdenada);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los resultados.');
  }
});


module.exports = router;
 