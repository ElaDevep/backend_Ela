const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Importa multer
const Archivo = require('../models/Archivos');

// Configura multer
const upload = multer({ dest: '../uploads' });


// Modulo agua
// Ruta para subir el archivo de la usuaria y procesarlo
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log(req.file);
    const file = req.file;
    const clienteId = req.body.clienteId;
    const empresaId = req.body.empresaId;
    const Mes = req.body.mes;

    const fileData = fs.readFileSync(file.path);
    const uploadPath = path.join(__dirname, '../uploads/excelGenereado', file.originalname);
    fs.writeFileSync(uploadPath, fileData);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(uploadPath);
    const worksheet = workbook.getWorksheet(1);

    // Evaluar la fórmula de reducción y ahorro hidrico
    const b2 = parseFloat(worksheet.getCell('B2').value.toString().replace(',', '.'));
    const b3 = parseFloat(worksheet.getCell('B3').value.toString().replace(',', '.'));
    const reduccionAhorroHidrico = ((b2 - b3) / b2) * 100;

    // Evaluar la fórmula de variación
    console.log('Valor de B7:', worksheet.getCell('B7').value);
    console.log('Valor de B8:', worksheet.getCell('B8').value);
    const b8 = parseFloat(worksheet.getCell('B8').value.toString().replace(',', '.'));
    const b7 = parseFloat(worksheet.getCell('B7').value.toString().replace(',', '.'));
    
    let variacion;
    if (b7!== 0) {
      variacion = ((b8 - b7) / b7) * 100;
    } else {
      variacion = 0; // O cualquier otro valor predeterminado
    }

    // Evaluar formula para el cosumo de materias primas

    const b13 = parseFloat(worksheet.getCell('B13').value.toString().replace(',', '.'));
    const b14 = parseFloat(worksheet.getCell('B14').value.toString().replace(',', '.'));
    const VariacionConsumoRecursos = ((b13 - b14) / b13) * 100;

    // Obtener otros valores del Excel
    const nPoliza = worksheet.getCell('B19').value;
    const nombreCliente = worksheet.getCell('B20').value;
    const tipoNegocio = worksheet.getCell('B21').value;
    const lugar = worksheet.getCell('B18').value;
    const mes = worksheet.getCell('B22').value;

    const resultados = {
      reduccionAhorroHidrico,
      variacion,
      VariacionConsumoRecursos,
      nPoliza,
      nombreCliente,
      tipoNegocio,
      lugar,
      mes
    };

    // Guardar los resultados en un nuevo libro de Excel
    const resultWorkbook = new ExcelJS.Workbook();
    const resultWorksheet = resultWorkbook.addWorksheet('Resultados');
    resultWorksheet.columns = [
      { header: '% Reducción o Ahorro Hídrico', key: 'reduccionAhorroHidrico', type: 'number' },
      { header: '% Variación', key: 'variacion', type: 'number' },
      { header: '% Variación Consumo de Recursos y/o Materias Primas', key: 'variacionConsumoRecursos', type: 'number' },
      { header: 'N Poliza', key: 'nPoliza' },
      { header: 'Nombre del cliente', key: 'nombreCliente' },
      { header: 'Tipo de negocio', key: 'tipoNegocio' },
      { header: 'Lugar', key: 'lugar' },
      { header: 'Mes', key: 'mes' },
    ];
    resultWorksheet.addRow({
      reduccionAhorroHidrico: resultados.reduccionAhorroHidrico,
      variacion: resultados.variacion,
      variacionConsumoRecursos: resultados.VariacionConsumoRecursos,
      nPoliza: resultados.nPoliza,
      nombreCliente: resultados.nombreCliente,
      tipoNegocio: resultados.tipoNegocio,
      lugar: resultados.lugar,
      mes: resultados.mes
    });
    const resultDirPath = path.join(__dirname, '../uploads/excelGenereado');
    const resultFilePath = path.join(resultDirPath, `resultados_${file.originalname}`);
    await resultWorkbook.xlsx.writeFile(resultFilePath);

    // Guardar ambos archivos en la base de datos
    const archivo = new Archivo({
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

// Endpoint para descargar solo los resultados
router.get('/resultados/:id/:mes', async (req, res) => {
  try {
    const id = req.params.id;
    const mes = req.params.mes;

    // Buscar el archivo en la base de datos por su ID y mes
    const archivo = await Archivo.findOne({ _id: id, 'resultados.mes': mes });

    if (!archivo) {
      return res.status(404).send('Archivo no encontrado');
    }

    // Extraer los resultados del archivo
    const resultados = archivo.resultados;

    // Crear un nuevo libro de Excel para los resultados
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resultados');
    worksheet.columns = [
      { header: '% Reducción o Ahorro Hídrico', key: 'reduccionAhorroHidrico', type: 'number' },
      { header: '% Variación', key: 'variacion', type: 'number' },
      { header: '% Variación Consumo de Recursos y/o Materias Primas', key: 'variacionConsumoRecursos', type: 'number' },
      { header: 'N Poliza', key: 'nPoliza' },
      { header: 'Nombre del cliente', key: 'nombreCliente' },
      { header: 'Tipo de negocio', key: 'tipoNegocio' },
      { header: 'Lugar', key: 'lugar' },
      { header: 'Mes', key: 'mes' },
    ];

    worksheet.addRow({
      reduccionAhorroHidrico: resultados.reduccionAhorroHidrico,
      variacion: resultados.variacion,
      variacionConsumoRecursos: resultados.VariacionConsumoRecursos,
      nPoliza: resultados.nPoliza,
      nombreCliente: resultados.nombreCliente,
      tipoNegocio: resultados.tipoNegocio,
      lugar: resultados.lugar,
      mes: resultados.mes
    });
    // Generar el nombre del archivo para descargar
    const filename = `resultados_${archivo._id}_${mes}.xlsx`;

    // Generar el archivo Excel en memoria
    const buffer = await workbook.xlsx.writeBuffer();

    // Enviar el archivo al cliente como descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=resultados_${archivo.nombre}.xlsx`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al descargar los resultados.');
  }
});
// Endpoint para visualizar solo los resultados
router.get('/resul/:id/:mes', async (req, res) => {
  try {
    const id = req.params.id;
    const mes = req.params.mes;

    // Buscar el archivo en la base de datos por su ID y mes
    const archivo = await Archivo.findOne({ _id: id, 'resultados.mes': mes });

    if (!archivo) {
      return res.status(404).send('Archivo no encontrado');
    }

    // Extraer los resultados del archivo
    const resultados = archivo.resultados;

    res.status(200).json(resultados);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los resultados.');
  }
});


// Endpoint para descargar el archivo Excel histórico
router.get('/historico', async (req, res) => {
  try {
    // Obtener todos los archivos de la base de datos
    const archivos = await Archivo.find();

    // Crear un nuevo libro de Excel para el histórico
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historico');
    worksheet.columns = [
      { header: 'Nombre del archivo', key: 'nombre' },
      { header: 'Ruta', key: 'ruta' },
      { header: '% Reducción o Ahorro Hídrico', key: 'reduccionAhorroHidrico', type: 'number' },
      { header: '% Variación', key: 'variacion', type: 'number' },
      { header: '% Variación Consumo de Recursos y/o Materias Primas', key: 'variacionConsumoRecursos', type: 'number' },
      { header: 'N Poliza', key: 'nPoliza' },
      { header: 'Nombre del cliente', key: 'nombreCliente' },
      { header: 'Tipo de negocio', key: 'tipoNegocio' },
      { header: 'Lugar', key: 'lugar' },
      { header: 'Mes', key: 'mes' },
      { header: 'Fecha de subida', key: 'fechaSubida', type: 'date' }
    ];

    // Agregar cada archivo y sus resultados al Excel histórico
    archivos.forEach(archivo => {
      worksheet.addRow({
        nombre: archivo.nombre,
        ruta: archivo.ruta,
        reduccionAhorroHidrico: archivo.resultados.reduccionAhorroHidrico,
        variacion: archivo.resultados.variacion,
        variacionConsumoRecursos: archivo.resultados.VariacionConsumoRecursos,
        nPoliza: archivo.resultados.nPoliza,
        nombreCliente: archivo.resultados.nombreCliente,
        tipoNegocio: archivo.resultados.tipoNegocio,
        lugar: archivo.resultados.lugar,
        mes: archivo.resultados.mes,
        fechaSubida: archivo.fechaSubida
      });
    });

    // Generar el nombre del archivo para descargar
    const filename = 'historico.xlsx';

    // Generar el archivo Excel en memoria
    const buffer = await workbook.xlsx.writeBuffer();

    // Enviar el archivo al cliente como descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al descargar el histórico.');
  }
});

module.exports = router;

