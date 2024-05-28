const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Importa multer
const Archivo = require('../models/Archivos');
const Empresa = require('../models/Empresa');


// Configura multer
const upload = multer({ dest: '../uploads' });


// Modulo agua

router.post('/upload/:nit', upload.single('file'), async (req, res) => {
  try {
    console.log(req.file);
    const file = req.file;
    const requestNit =  req.params.nit;
    
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
    const nNit = worksheet.getCell('B23').value;

    const resultados = {
      reduccionAhorroHidrico,
      variacion,
      VariacionConsumoRecursos,
      nPoliza,
      nombreCliente,
      tipoNegocio,
      lugar,
      mes,
      nNit
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
      { header: 'Nit', key: 'nNit' },

    ];
    resultWorksheet.addRow({
      reduccionAhorroHidrico: resultados.reduccionAhorroHidrico,
      variacion: resultados.variacion,
      variacionConsumoRecursos: resultados.VariacionConsumoRecursos,
      nPoliza: resultados.nPoliza,
      nombreCliente: resultados.nombreCliente,
      tipoNegocio: resultados.tipoNegocio,
      lugar: resultados.lugar,
      mes: resultados.mes,
      nNit:resultados.nNit
    });
    
    if(resultados.nNit != requestNit){
      res.status(400).send('Nit del documento no coincide con el solicitado');
      return
    }


    const resultDirPath = path.join(__dirname, '../uploads/excelGenereado');
    const resultFilePath = path.join(resultDirPath, `resultados_${file.originalname}`);
    await resultWorkbook.xlsx.writeFile(resultFilePath);

    // Guardar ambos archivos en la base de datos
    const archivo = new Archivo({
      nombre: file.originalname,
      ruta: uploadPath,
      resultados: resultados,
      
    });
    await archivo.save();
    // Encontrar la empresa correspondiente por su NIT
  const empresa = await Empresa.findOne({ nit: req.body.nNit}); // Corregir para que coincida con el campo nNit
 if (empresa) {
  // Actualizar la referencia al último archivo y la fecha de subida
  empresa.ultimoDocumento = archivo._id;
  empresa.fechaSubida = new Date(); // O la fecha real de subida del archivo
  await empresa.save();
  } else {
  console.error('No se encontró una empresa con el NIT proporcionado');
}
 
    res.status(200).send('Archivos subidos y procesados correctamente.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al procesar los archivos.');
  }

});

// Endpoint para descargar solo los resultados
router.get('/resultados/:nit/:id/:mes', async (req, res) => {
  try {
    const id = req.params.id;
    const mes = req.params.mes;
    const nit = req.params.nit;

    // Buscar el archivo en la base de datos por su ID y mes
    const archivo = await Archivo.findOne({  _id: id, 'resultados.mes': mes, 'resultados.nNit': nit });

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
      { header: 'Nit', key: 'nNit' },

    ];

    worksheet.addRow({
      reduccionAhorroHidrico: resultados.reduccionAhorroHidrico,
      variacion: resultados.variacion,
      variacionConsumoRecursos: resultados.VariacionConsumoRecursos,
      nPoliza: resultados.nPoliza,
      nombreCliente: resultados.nombreCliente,
      tipoNegocio: resultados.tipoNegocio,
      lugar: resultados.lugar,
      mes: resultados.mes,
      nNit: resultados.nNit
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
router.get('/resul/:nit/:id/:mes', async (req, res) => {
  try {
    const id = req.params.id;
    const mes = req.params.mes;
    const nit = req.params.nit;

    // Buscar el archivo en la base de datos por su ID y mes
    const archivo = await Archivo.findOne({ _id: id, 'resultados.mes': mes, 'resultados.nNit': nit });

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
router.get('/historico/:nit', async (req, res) => {
  try {
    const nit = req.params.nit; // Obtener el NIT desde la URL
    const archivos = await Archivo.find({ 'resultados.nNit': nit }).sort({ fechaSubida: 1 });

    // Crear un mapa para rastrear las filas existentes
    const rowMap = new Map();

    archivos.forEach(archivo => {
      const { mes, nombreCliente } = archivo.resultados;
      const key = `${mes}-${nombreCliente}`;
      if (rowMap.has(key)) {
        // Si existe una fila con el mismo mes y cliente, actualizarla
        const existingRow = rowMap.get(key);
        existingRow.reduccionAhorroHidrico = archivo.resultados.reduccionAhorroHidrico;
        existingRow.variacion = archivo.resultados.variacion;
        existingRow.variacionConsumoRecursos = archivo.resultados.VariacionConsumoRecursos;
        existingRow.nPoliza = archivo.resultados.nPoliza;
        existingRow.nombreCliente = archivo.resultados.nombreCliente;
        existingRow.tipoNegocio = archivo.resultados.tipoNegocio;
        existingRow.lugar = archivo.resultados.lugar;
        existingRow.mes = archivo.resultados.mes;
        existingRow.nNit = archivo.resultados.nNit;
      } else {
        // Si no existe una fila para este mes y cliente, agregar una nueva fila
        rowMap.set(key, {
          reduccionAhorroHidrico: archivo.resultados.reduccionAhorroHidrico,
          variacion: archivo.resultados.variacion,
          variacionConsumoRecursos: archivo.resultados.VariacionConsumoRecursos,
          nPoliza: archivo.resultados.nPoliza,
          nombreCliente: archivo.resultados.nombreCliente,
          tipoNegocio: archivo.resultados.tipoNegocio,
          lugar: archivo.resultados.lugar,
          mes: archivo.resultados.mes,
          nNit: archivo.resultados.nNit,
        });
      }
    });

    // Eliminar registros antiguos si hay más de 12
    while (rowMap.size > 12) {
      const oldestKey = Array.from(rowMap.keys())[0]; // Obtener la clave del primer elemento
      rowMap.delete(oldestKey);
    }

    // Convertir el mapa a un arreglo de objetos
    const historicoArray = Array.from(rowMap.values());

    // Convertir historicoArray a JSON
    const historicoJSONString = JSON.stringify(historicoArray);

    // Envía el objeto JSON como respuesta
    res.setHeader('Content-Type', 'application/json');
    res.send(historicoJSONString);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al descargar el histórico.');
  }
});


module.exports = router;