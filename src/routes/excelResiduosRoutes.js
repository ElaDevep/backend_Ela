const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Importa multer
const ArchivoResiduos = require('../models/ArchivosResiduos');

// Configura multer
const upload = multer({ dest: '../uploads/ExcelResiduos' });

// Modulo Residuos
router.post('/uploadResiduos', upload.single('file'), async (req, res) => {
    try {
        console.log(req.file);
        const file = req.file;
        const clienteId = req.body.clienteId;
        const empresaId = req.body.empresaId;
        const Mes = req.body.mes;

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

        const nNic = worksheet.getCell('C122').value;
        const nombreCliente = worksheet.getCell('C123').value;
        const tipoNegocio = worksheet.getCell('C124').value;
        const lugar = worksheet.getCell('C126').value;
        const mes = worksheet.getCell('C125').value;

        // Construir el objeto de resultados
        const resultados = {
            'nNic': nNic,
            'nombreCliente': nombreCliente,
            'tipoNegocio': tipoNegocio,
            'lugar': lugar,
            'mes': mes,
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
            { header: 'N Nic', key: 'nNic' },
            { header: 'Nombre del cliente', key: 'nombreCliente' },
            { header: 'Tipo de negocio', key: 'tipoNegocio' },
            { header: 'Lugar', key: 'lugar' },
            { header: 'Mes', key: 'mes' },
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

        // Guardar el archivo de resultados en una ruta específica
        const resultDirPath = path.join(__dirname, '../uploads/ExcelResiduos');
        const resultFilePath = path.join(resultDirPath, `resultados_${file.originalname}`);
        await resultWorkbook.xlsx.writeFile(resultFilePath);

        // Guardar los detalles de los archivos y resultados en la base de datos
        const archivo = new ArchivoResiduos({
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
router.get('/resultadosR/:id/:mes', async (req, res) => {
    try {
        const id = req.params.id;
        const mes = req.params.mes;

        const archivo = await ArchivoResiduos.findOne({ _id: id, 'resultados.mes': mes });

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

// Endpoint para descargar el archivo Excel histórico
router.get('/historicoR', async (req, res) => {
    try {
        const archivos = await ArchivoResiduos.find();

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
            { header: '% Variacion Generación de Residuos', key: 'variacionGeneracionResiduos', type: 'number' },
            { header: '% Variacion Reducción PGIRS', key: 'reduccionPGIRS', type: 'number' },
            { header: '% Variacion Reducción Respels', key: 'reduccionRespel', type: 'number' },
            { header: '% Variacion Residuos Peligrosos', key: 'variacionResiduosPeligrosos', type: 'number' },
            { header: '% Variacion Reciclaje', key: 'variacionReciclaje', type: 'number' },
            { header: '% Variacion Desperdicios', key: 'variacionDesperdicios', type: 'number' },
            { header: '% Variacion Generación RAESS', key: 'variacionRAEESI', type: 'number' },
            { header: '% Variacion Personal Capacitado', key: 'variacionPersonal', type: 'number' }
           
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
                variacionGeneracionResiduos: archivo.resultados.variacionGeneracionResiduos,
                reduccionPGIRS: archivo.resultados.reduccionPGIRS,
                reduccionRespel: archivo.resultados.reduccionRespel,
                variacionResiduosPeligrosos: archivo.resultados.variacionResiduosPeligrosos,
                variacionReciclaje: archivo.resultados.variacionReciclaje,
                variacionDesperdicios: archivo.resultados.variacionDesperdicios,
                variacionRAEESI: archivo.resultados.variacionRAEESI,
                variacionPersonal: archivo.resultados.variacionPersonal
                
            });
        });

        const filename = 'historico_residuos.xlsx';

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al descargar el histórico de archivos.');
    }
});

// Endpoint para visualizar los datos de residuos
router.get('/resulR/:id/:mes', async (req, res) => {
    try {
      const id = req.params.id;
      const mes = req.params.mes;
  
      const archivo = await ArchivoResiduos.findOne({ _id: id, 'resultados.mes': mes });
  
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
  

module.exports = router;
