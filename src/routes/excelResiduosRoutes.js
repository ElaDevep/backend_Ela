const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Importa multer
const ArchivoResiduos = require('../models/ArchivosResiduos');
const Empresa = require('../models/Empresa');

// Configura multer
const upload = multer({ dest: '../uploads/ExcelResiduos' });

// Modulo Residuos
router.post('/uploadResiduos', upload.single('file'), async (req, res) => {
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

        // Construir el objeto de resultados
        const resultados = {
            'nNit': nNit,
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
            { header: 'N Nit', key: 'nNit' },
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
        
        });
        await archivo.save();
         // Encontrar la empresa correspondiente por su NIT
        const empresa = await Empresa.findOne({ nNit: resultados.nNit });
        
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

// Endpoint para descargar el archivo Excel de resultados
router.get('/resultadosR/:nit/:id/:mes', async (req, res) => {
    try {
        const id = req.params.id;
        const mes = req.params.mes;
        const nit = req.params.nit;

        const archivo = await ArchivoResiduos.findOne({  _id: id, 'resultados.mes': mes, 'resultados.nNit': nit });

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
router.get('/historicoR/:nit', async (req, res) => {
    try {
        const nit = req.params.nit;

        // Corregir la búsqueda para utilizar el campo resultados.nNit en lugar de cliente
        const archivos = await ArchivoResiduos.find({ 'resultados.nNit': nit });

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
                    variacionGeneracionResiduos: archivo.resultados.variacionGeneracionResiduos,
                    reduccionPGIRS: archivo.resultados.reduccionPGIRS,
                    reduccionRespel: archivo.resultados.reduccionRespel,
                    variacionResiduosPeligrosos: archivo.resultados.variacionResiduosPeligrosos,
                    variacionReciclaje: archivo.resultados.variacionReciclaje,
                    variacionDesperdicios: archivo.resultados.variacionDesperdicios,
                    variacionRAEESI: archivo.resultados.variacionRAEESI,
                    variacionPersonal: archivo.resultados.variacionPersonal
                });
            }
        });

        const historicoArray = Array.from(rowMap.values());
        const historicoJSONString = JSON.stringify(historicoArray);

        res.setHeader('Content-Type', 'application/json');
        res.send(historicoJSONString);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al descargar el histórico.');
    }
});

// Endpoint para visualizar los datos de residuos
router.get('/resulR/:nit/:id/:mes', async (req, res) => {
    try {
      const id = req.params.id;
      const mes = req.params.mes;
      const nit = req.params.nit;
  
      const archivo = await ArchivoResiduos.findOne({ _id: id, 'resultados.mes': mes, 'resultados.nNit': nit });
  
      if (!archivo) {
        return res.status(404).send('Archivo no encontrado');
      }
  
      const resultados = archivo.resultados;
  
      // Construir un nuevo objeto para ordenar la respuesta
      const respuestaOrdenada = {
        nNit: resultados.nNit,
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