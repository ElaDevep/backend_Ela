const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Importa multer
const Archivo = require('../models/Archivos');
const Empresa = require('../models/Empresa');
const axios = require('axios');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');



// Configura multer
const upload = multer({ dest: '../uploads' });


// Modulo agua

router.post('/upload/:idEmpresa', upload.single('file'), async (req, res) => {
  try {
    console.log(req.file);
    const file = req.file;
    
    
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
    const sede =worksheet.getCell('B24').value;
    

    const resultados = {
      reduccionAhorroHidrico,
      variacion,
      VariacionConsumoRecursos,
      nPoliza,
      nombreCliente,
      tipoNegocio,
      lugar,
      mes,
      nNit,
      sede

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
      { header: 'Sede', key: 'sede' },

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
      nNit:resultados.nNit,
      sede:resultados.sede
      
    });
    


    const resultDirPath = path.join(__dirname, '../uploads/excelGenereado');
    const resultFilePath = path.join(resultDirPath, `resultados_${file.originalname}`);
    await resultWorkbook.xlsx.writeFile(resultFilePath);
    const empresa = await Empresa.findById(req.params.idEmpresa);

    if(empresa.sede!=resultados.sede){
      return res.status(402).send('La sede no coincide con la empresa seleccionada');
    }

    if(empresa.nNit!=resultados.nNit){
      return res.status(403).send('El nit no coincide con la empresa seleccionada');
    }
    // Guardar ambos archivos en la base de datos
    const archivo = new Archivo({
      nombre: file.originalname,
      ruta: uploadPath,
      resultados: resultados,
      idEmpresa: req.params.idEmpresa
    });
    await archivo.save();
    // Encontrar la empresa correspondiente por su ID
    if (empresa) {
      // Actualizar la referencia al último archivo y la fecha de subida
      empresa.ultimoDocumento = archivo._id;
      empresa.fechaSubida = new Date(); // O la fecha real de subida del archivo
      await empresa.save();
    } else {
      console.error('No se encontró una empresa con el ID proporcionado');
    }
 
    res.status(200).send('Archivos subidos y procesados correctamente.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al procesar los archivos.');
  }

});

// Endpoint para descargar solo los resultados
router.get('/resultados/:idEmpresa/:mes', async (req, res) => {
  try {
    const idEmpresa = req.params.idEmpresa;
    const mes = req.params.mes;
    
    // Buscar el archivo en la base de datos por su ID y mes
    const archivo = await Archivo.findOne({ idEmpresa: idEmpresa, 'resultados.mes': mes });


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
      { header: 'Sede', key: 'sede' },

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
      nNit: resultados.nNit,
      sede: resultados.sede,
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
router.get('/resul/:idEmpresa/:mes', async (req, res) => {
  try {
    const idEmpresa = req.params.idEmpresa;
    const mes = req.params.mes;
    
   // Buscar el archivo en la base de datos por su ID y mes
   const archivo = await Archivo.findOne({ idEmpresa: idEmpresa, 'resultados.mes': mes });

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
router.get('/historico/:idEmpresa', async (req, res) => {
  try {
    const idEmpresa = req.params.idEmpresa;
    const archivos = await Archivo.find({ idEmpresa: idEmpresa }).sort({ fechaSubida: 1 });

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
        existingRow.variacionConsumoRecursos = archivo.resultados.variacionConsumoRecursos;
        existingRow.nPoliza = archivo.resultados.nPoliza;
        existingRow.nombreCliente = archivo.resultados.nombreCliente;
        existingRow.tipoNegocio = archivo.resultados.tipoNegocio;
        existingRow.lugar = archivo.resultados.lugar;
        existingRow.mes = archivo.resultados.mes;
        existingRow.nNit = archivo.resultados.nNit;
        existingRow.sede = archivo.resultados.sede;
      } else {
        // Si no existe una fila para este mes y cliente, agregar una nueva fila
        rowMap.set(key, {
          reduccionAhorroHidrico: archivo.resultados.reduccionAhorroHidrico,
          variacion: archivo.resultados.variacion,
          variacionConsumoRecursos: archivo.resultados.variacionConsumoRecursos,
          nPoliza: archivo.resultados.nPoliza,
          nombreCliente: archivo.resultados.nombreCliente,
          tipoNegocio: archivo.resultados.tipoNegocio,
          lugar: archivo.resultados.lugar,
          mes: archivo.resultados.mes,
          nNit: archivo.resultados.nNit,
          sede: archivo.resultados.sede,
        });
      }
    });

    // Eliminar registros antiguos si hay más de 12
    while (rowMap.size > 12) {
      const oldestKey = Array.from(rowMap.keys())[0]; // Obtener la clave del primer elemento
      rowMap.delete(oldestKey);
    }

    // Arreglo
    const historicoArray = Array.from(rowMap.values());

    // Orden de los meses 
    const ordenMeses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Ordenar el arreglo por el campo 'mes'
    historicoArray.sort((a, b) => {
      const indiceMesA = ordenMeses.indexOf(a.mes);
      const indiceMesB = ordenMeses.indexOf(b.mes);
      return indiceMesA - indiceMesB;
    });

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

// Ruta para obtener el PDF basado en la plantilla y el ID de la empresa
router.get('/pdf-template/:empresaId', async (req, res) => {
  try {
    const { empresaId } = req.params;

    // Verificar si el empresaId existe en la colección empresa
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) {
      return res.status(404).send('La empresa no se encuentra');
    }

    // Cargar el PDF de la plantilla desde el sistema de archivos
    const pdfPath = path.join(__dirname, '../uploads/templates', 'myFile-1719608799587-486266606.pdf');
    const existingPdfBytes = fs.readFileSync(pdfPath);

    // Cargar el PDF con la librería pdf-lib
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Fuentes
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Modificar el PDF
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Texto en la esquina inferior izquierda: Nombre de la empresa
    firstPage.drawText(`${empresa.razonSocial}`, {
      x: 20,
      y: 86,
      size: 21,
      font: helveticaFont,
      color: rgb(1, 1, 1),
    });

    // Texto en la esquina inferior derecha: Dirección
    firstPage.drawText(`${empresa.direccion}`, {
      x: 20,
      y: 50,
      size: 15,
      font: helveticaFont,
      color: rgb(200 / 255, 200 / 255, 200 / 255),

    });

    // Serializar el PDF 
    const pdfBytes = await pdfDoc.save();

    // Responder con el archivo PDF modificado
    res.setHeader('Content-Disposition', 'inline; filename=template.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error al obtener el PDF:', error);
    res.status(500).send('Error al obtener el PDF');
  }
});

module.exports = router;