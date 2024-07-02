const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Importa multer
const ArchivoResiduos = require('../models/ArchivosResiduos');
const Empresa = require('../models/Empresa');
const axios = require('axios');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Configura multer
const upload = multer({ dest: '../uploads/ExcelResiduos' });

// Modulo Residuos
router.post('/uploadResiduos/:idEmpresa', upload.single('file'), async (req, res) => {
    try {
        console.log(req.file);
        const file = req.file;
        
        const fileData = fs.readFileSync(file.path);
        const uploadPath = path.join(__dirname, '../uploads/ExcelResiduos', file.originalname);
        fs.writeFileSync(uploadPath, fileData);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(uploadPath);
        const worksheet = workbook.getWorksheet(1);

        // Evaluar las fórmulas para el módulo de Residuos
        const c17 = parseFloat(worksheet.getCell('C17').value.toString().replace(',', '.'));
        const c18 = parseFloat(worksheet.getCell('C18').value.toString().replace(',', '.'));
        const variacionGeneracionResiduos = ((c17 - c18) / c17) * 100;

        const b24 = parseFloat(worksheet.getCell('B24').value.toString().replace(',', '.'));
        const b25 = parseFloat(worksheet.getCell('B25').value.toString().replace(',', '.'));
        const reduccionPGIRS = ((b24 - b25) / b24) * 100;

        const f24 = parseFloat(worksheet.getCell('F24').value.toString().replace(',', '.'));
        const f25 = parseFloat(worksheet.getCell('F25').value.toString().replace(',', '.'));
        const reduccionRespel = ((f24 - f25) / f24) * 100;

        const c44 = parseFloat(worksheet.getCell('C44').value.toString().replace(',', '.'));
        const c45 = parseFloat(worksheet.getCell('C45').value.toString().replace(',', '.'));
        const variacionResiduosPeligrosos = ((c44 - c45) / c44) * 100;

        const c62 = parseFloat(worksheet.getCell('C62').value.toString().replace(',', '.'));
        const c63 = parseFloat(worksheet.getCell('C63').value.toString().replace(',', '.'));
        const variacionReciclaje = ((c63 - c62) / c62) * 100;

        const c80 = parseFloat(worksheet.getCell('C80').value.toString().replace(',', '.'));
        const c81 = parseFloat(worksheet.getCell('C81').value.toString().replace(',', '.'));
        const variacionDesperdicios = ((c80 - c81) / c80) * 100;

        const c99 = parseFloat(worksheet.getCell('C99').value.toString().replace(',', '.'));
        const c100 = parseFloat(worksheet.getCell('C100').value.toString().replace(',', '.'));
        const variacionRAEESI = ((c99 - c100) / c99) * 100;

        const c116 = parseFloat(worksheet.getCell('C116').value.toString().replace(',', '.'));
        const c117 = parseFloat(worksheet.getCell('C117').value.toString().replace(',', '.'));
        const variacionPersonal = ((c117 - c116) / c116) * 100;

        const nNit = worksheet.getCell('C122').value;
        const nombreCliente = worksheet.getCell('C123').value;
        const tipoNegocio = worksheet.getCell('C124').value;
        const lugar = worksheet.getCell('C126').value;
        const mes = worksheet.getCell('C125').value;
        const sede =worksheet.getCell('C127').value;

        // Construir el objeto de resultados
        const resultados = {
            'nNit': nNit,
            'nombreCliente': nombreCliente,
            'tipoNegocio': tipoNegocio,
            'lugar': lugar,
            'mes': mes,
            'sede': sede,
            'variacionGeneracionResiduos': variacionGeneracionResiduos,
            'reduccionPGIRS': reduccionPGIRS,
            'reduccionRespel': reduccionRespel,
            'variacionResiduosPeligrosos': variacionResiduosPeligrosos,
            'variacionReciclaje': variacionReciclaje,
            'variacionDesperdicios': variacionDesperdicios,
            'variacionRAEESI': variacionRAEESI,
            'variacionPersonal': variacionPersonal
        
        };

        // Agregar una fila con los resultados
        const resultWorkbook = new ExcelJS.Workbook();
        const resultWorksheet = resultWorkbook.addWorksheet('Resultados');
        resultWorksheet.columns = [
            { header: 'N Nit', key: 'nNit' },
            { header: 'Nombre del cliente', key: 'nombreCliente' },
            { header: 'Tipo de negocio', key: 'tipoNegocio' },
            { header: 'Lugar', key: 'lugar' },
            { header: 'Mes', key: 'mes' },
            { header: 'Sede', key: 'sede' },
            { header: '% Variacion Generación de Residuos', key: 'variacionGeneracionResiduos', type: 'number' },
            { header: '% Variacion Reducción PGIRS', key: 'reduccionPGIRS', type: 'number' },
            { header: '% Variacion Reducción Respels', key: 'reduccionRespel', type: 'number' },
            { header: '% Variacion Residuos Peligrosos', key: 'variacionResiduosPeligrosos', type: 'number' },
            { header: '% Variacion Reciclaje', key: 'variacionReciclaje', type: 'number' },
            { header: '% Variacion Desperdicios', key: 'variacionDesperdicios', type: 'number' },
            { header: '% Variacion Generación RAESS', key: 'variacionRAEESI', type: 'number' },
            { header: '% Variacion Personal Capacitado', key: 'variacionPersonal', type: 'number' }
            // Agrega aquí más campos si es necesario
        ];
        resultWorksheet.addRow(resultados);

       // Encontrar la empresa correspondiente por su ID
    const empresa = await Empresa.findById(req.params.idEmpresa);

    
    if(empresa.sede!=resultados.sede){
      return res.status(402).send('La sede no coincide con la empresa seleccionada');
    }

    if(empresa.nNit!=resultados.nNit){
      return res.status(403).send('El nit no coincide con la empresa seleccionada');
    }
        // Guardar el archivo de resultados en una ruta específica
        const resultDirPath = path.join(__dirname, '../uploads/ExcelResiduos');
        const resultFilePath = path.join(resultDirPath, `resultados_${file.originalname}`);
        await resultWorkbook.xlsx.writeFile(resultFilePath);

        // Guardar los detalles de los archivos y resultados en la base de datos
        const archivo = new ArchivoResiduos({
            nombre: file.originalname,
            ruta: uploadPath,
            resultados: resultados,
            idEmpresa: req.params.idEmpresa,
        
        });
        await archivo.save();

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

// Endpoint para descargar el archivo Excel de resultados
router.get('/resultadosR/:idEmpresa/:mes', async (req, res) => {
    try {
        const idEmpresa = req.params.idEmpresa;
        const mes = req.params.mes;

        const archivo = await ArchivoResiduos.findOne({ idEmpresa: idEmpresa, 'resultados.mes': mes });

        if (!archivo) {
            return res.status(404).send('Archivo no encontrado');
        }

        const resultados = archivo.resultados;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Resultados');
        worksheet.columns = [
            { header: 'N Nit', key: 'nNit' },
            { header: 'Nombre del cliente', key: 'nombreCliente' },
            { header: 'Tipo de negocio', key: 'tipoNegocio' },
            { header: 'Lugar', key: 'lugar' },
            { header: 'Mes', key: 'mes' },
            { header: 'Sede', key: 'sede' },
            { header: '% Variacion Generación de Residuos', key: 'variacionGeneracionResiduos', type: 'number' },
            { header: '% Variacion Reducción PGIRS', key: 'reduccionPGIRS', type: 'number' },
            { header: '% Variacion Reducción Respels', key: 'reduccionRespel', type: 'number' },
            { header: '% Variacion Residuos Peligrosos', key: 'variacionResiduosPeligrosos', type: 'number' },
            { header: '% Variacion Reciclaje', key: 'variacionReciclaje', type: 'number' },
            { header: '% Variacion Desperdicios', key: 'variacionDesperdicios', type: 'number' },
            { header: '% Variacion Generación RAESS', key: 'variacionRAEESI', type: 'number' },
            { header: '% Variacion Personal Capacitado', key: 'variacionPersonal', type: 'number' }
            
        ];

        worksheet.addRow(resultados);

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

// Endpoint para descargar el archivo Excel histórico de residuos
router.get('/historicoR/:idEmpresa', async (req, res) => {
  try {
      const idEmpresa = req.params.idEmpresa;

      // Corregir la búsqueda para utilizar el campo resultados sede en lugar de cliente
      const archivos = await ArchivoResiduos.find({ idEmpresa: idEmpresa }).sort({ fechaSubida: 1 });

      const rowMap = new Map();

      archivos.forEach(archivo => {
          const { mes, nombreCliente } = archivo.resultados;
          const key = `${mes}-${nombreCliente}`;
          if (rowMap.has(key)) {
              const existingRow = rowMap.get(key);

              existingRow.variacionGeneracionResiduos = archivo.resultados.variacionGeneracionResiduos;
              existingRow.reduccionPGIRS = archivo.resultados.reduccionPGIRS;
              existingRow.reduccionRespel = archivo.resultados.reduccionRespel;
              existingRow.variacionResiduosPeligrosos = archivo.resultados.variacionResiduosPeligrosos;
              existingRow.variacionReciclaje = archivo.resultados.variacionReciclaje;
              existingRow.variacionDesperdicios = archivo.resultados.variacionDesperdicios;
              existingRow.variacionRAEESI = archivo.resultados.variacionRAEESI;
              existingRow.variacionPersonal = archivo.resultados.variacionPersonal;
          } else {
              rowMap.set(key, {
                  nNit: archivo.resultados.nNit,
                  nombreCliente: archivo.resultados.nombreCliente,
                  tipoNegocio: archivo.resultados.tipoNegocio,
                  lugar: archivo.resultados.lugar,
                  mes: mes,
                  sede: archivo.resultados.sede,
                  variacionGeneracionResiduos: archivo.resultados.variacionGeneracionResiduos.toFixed(1),
                  reduccionPGIRS: archivo.resultados.reduccionPGIRS.toFixed(1),
                  reduccionRespel: archivo.resultados.reduccionRespel.toFixed(1),
                  variacionResiduosPeligrosos: archivo.resultados.variacionResiduosPeligrosos.toFixed(1),
                  variacionReciclaje: archivo.resultados.variacionReciclaje.toFixed(1),
                  variacionDesperdicios: archivo.resultados.variacionDesperdicios.toFixed(1),
                  variacionRAEESI: archivo.resultados.variacionRAEESI.toFixed(1),
                  variacionPersonal: archivo.resultados.variacionPersonal.toFixed(1)
              });
          }
      });

      const historicoArray = Array.from(rowMap.values());

      // Definir el orden de los meses
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

      const historicoJSONString = JSON.stringify(historicoArray);

      res.setHeader('Content-Type', 'application/json');
      res.send(historicoJSONString);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error al descargar el histórico.');
  }
});


// Endpoint para visualizar los datos de residuos
router.get('/resulR/:idEmpresa/:mes', async (req, res) => {
    try {
        const idEmpresa = req.params.idEmpresa;
        const mes = req.params.mes;
  
      const archivo = await ArchivoResiduos.findOne({ idEmpresa: idEmpresa, 'resultados.mes': mes });
  
      if (!archivo) {
        return res.status(404).send('Archivo no encontrado');
      }
  
      const resultados = archivo.resultados;
  
      // Ordenar respuestas
      const respuestaOrdenada = {
        nNit: resultados.nNit,
        nombreCliente: resultados.nombreCliente,
        tipoNegocio: resultados.tipoNegocio,
        lugar: resultados.lugar,
        mes: resultados.mes,
        sede: resultados.sede,
        variaciones: {
          variacionGeneracionResiduos: resultados.variacionGeneracionResiduos,
          reduccionPGIRS: resultados.reduccionPGIRS,
          reduccionRespel: resultados.reduccionRespel,
          variacionResiduosPeligrosos: resultados.variacionResiduosPeligrosos,
          variacionReciclaje: resultados.variacionReciclaje,
          variacionDesperdicios: resultados.variacionDesperdicios,
          variacionRAEESI: resultados.variacionRAEESI,
          variacionPersonal: resultados.variacionPersonal
        }
      };
  
      res.status(200).json(respuestaOrdenada);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al obtener los resultados.');
    }
  });
  
// Ruta para obtener el PDF
router.get('/pdf-templateR/:empresaId', async (req, res) => {
  try {
    const { empresaId } = req.params;

    // Verificar si el empresaId existe en la colección empresa
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) {
      return res.status(404).send('La empresa no se encuentra');
    }

    // Cargar el PDF desde el sistema de archivos
    const pdfPath = path.join(__dirname, '../uploads/templates', 'myFile-1719878096501-963929410.pdf');
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
      y: 112,
      size: 21,
      font: helveticaFont,
      color: rgb(1, 1, 1),
    });

    // Texto en la esquina inferior derecha: Dirección
    firstPage.drawText(`${empresa.direccion}`, {
      x: 20,
      y: 80,
      size: 15,
      font: helveticaFont,
      color: rgb(200 / 255, 200 / 255, 200 / 255),
    });

    // Serializar el PDF modificado
    const modifiedPdfBytes = await pdfDoc.save();

    // Respuesta del encabezado
    res.setHeader('Content-Disposition', 'inline; filename=template.pdf');
    res.setHeader('Content-Type', 'application/pdf');

    // Enviar el contenido del PDF modificado como un Buffer
    res.send(Buffer.from(modifiedPdfBytes));
  } catch (error) {
    console.error('Error al obtener el PDF:', error);
    res.status(500).send('Error al obtener el PDF');
  }
});

module.exports = router;

  

