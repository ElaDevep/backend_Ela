const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ArchivoEducacion = require('../models/ArchivosEducacion');

// Configurar multer
const upload = multer({ dest: '../uploads' });

// Endpoint para subir archivos de educación
router.post('/uploadEducacion', upload.single('file'), async (req, res) => {
    try {
        console.log(req.file);
        const file = req.file;

        const fileData = fs.readFileSync(file.path);
        const uploadPath = path.join(__dirname, '../uploads/excelEducacion', file.originalname);
        fs.writeFileSync(uploadPath, fileData);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(uploadPath);
        const worksheet = workbook.getWorksheet(1);

        const c4 = parseFloat(worksheet.getCell('C4').value.toString().replace(',', '.'));
        const c5 = parseFloat(worksheet.getCell('C5').value.toString().replace(',', '.'));
        const variacionPersonal = ((c5 - c4) / c4) * 100;

        const nNit = worksheet.getCell('C15').value;
        const nombreCliente = worksheet.getCell('C16').value;
        const tipoNegocio = worksheet.getCell('C17').value;
        const lugar = worksheet.getCell('C19').value;
        const mes = worksheet.getCell('C18').value;

       // Guardar resultados en un nuevo libro de Excel
       const resultWorkbook = new ExcelJS.Workbook();
       const resultWorksheet = resultWorkbook.addWorksheet('Resultados');
       resultWorksheet.columns = [
           { header: '% VariaciónPersonal', key: 'variacionPersonal', type: 'number' },
           { header: 'N Nit', key: 'Nnit' },
           { header: 'Nombre del cliente', key: 'nombreCliente' },
           { header: 'Tipo de negocio', key: 'tipoNegocio' },
           { header: 'Lugar', key: 'lugar' },
           { header: 'Mes', key: 'mes' },
       ];
       resultWorksheet.addRow({
           variacionPersonal: variacionPersonal,
           nNit: nNit,
           nombreCliente: nombreCliente,
           tipoNegocio: tipoNegocio,
           lugar: lugar,
           mes: mes
       });

       const resultDirPath = path.join(__dirname, '../uploads/excelEducacion');
       const resultFilePath = path.join(resultDirPath, `resultados_${file.originalname}`);
       await resultWorkbook.xlsx.writeFile(resultFilePath);


        // Crear objeto ArchivoEducacion y asignar el valor del NIT al campo nNit
        const archivo = new ArchivoEducacion({
            nombre: file.originalname,
            ruta: uploadPath,
            resultados: {
                variacionPersonal: variacionPersonal,
                nNit: nNit,
                nombreCliente: nombreCliente,
                tipoNegocio: tipoNegocio,
                lugar: lugar,
                mes: mes
            }
        });

        // Guardar el objeto ArchivoEducacion en la base de datos
        await archivo.save();

        res.status(200).send('Archivos subidos y procesados correctamente.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al procesar los archivos.');
    }
});

// Endpoint para visualizar solo los resultados
router.get('/resulEd/:nit/:id/:mes', async (req, res) => {
    try {
        const nit = req.params.nit;
        const id = req.params.id;
        const mes = req.params.mes;

        // Corregir la búsqueda para utilizar el campo resultados.nNit en lugar de cliente
        const archivo = await ArchivoEducacion.findOne({ _id: id, 'resultados.mes': mes, 'resultados.nNit': nit });

        if (!archivo) {
            return res.status(404).send('Archivo no encontrado');
        }

        const resultados = archivo.resultados;

        res.status(200).json(resultados);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los resultados.');
    }
});

// Endpoint para descargar el archivo Excel de resultados
router.get('/resultadosEd/:nit/:id/:mes', async (req, res) => {
    try {
        const nit = req.params.nit;
        const id = req.params.id;
        const mes = req.params.mes;

        // Cambiar la búsqueda para utilizar el campo nNit en lugar de cliente
        const archivo = await ArchivoEducacion.findOne({ _id: id, 'resultados.mes': mes, 'resultados.nNit': nit });

        if (!archivo) {
            return res.status(404).json({ message: 'Archivo no encontrado' }); // Devolver respuesta JSON
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
            { header: '% Variacion Personal Capacitado', key: 'variacionPersonal', type: 'number' },
        ];

        worksheet.addRow({
            nNit: resultados.nNit,
            nombreCliente: resultados.nombreCliente,
            tipoNegocio: resultados.tipoNegocio,
            lugar: resultados.lugar,
            mes: resultados.mes,
            variacionPersonal: resultados.variacionPersonal
        });

        const filename = `resultados_${archivo._id}_${mes}.xlsx`;

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al descargar los resultados.' }); // Devolver respuesta JSON
    }
});

// Endpoint para descargar el archivo Excel histórico
router.get('/historicoEd/:nit', async (req, res) => {
    try {
        const nit = req.params.nit;

        // Corregir la búsqueda para utilizar el campo resultados.nNit en lugar de cliente
        const archivos = await ArchivoEducacion.find({ 'resultados.nNit': nit });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Historico');
        worksheet.columns = [
            { header: 'N Nit', key: 'nNit' },
            { header: 'Nombre del cliente', key: 'nombreCliente' },
            { header: 'Tipo de negocio', key: 'tipoNegocio' },
            { header: 'Lugar', key: 'lugar' },
            { header: 'Mes', key: 'mes' },
            { header: 'Fecha de subida', key: 'fechaSubida', type: 'date' },
            { header: 'Nombre del archivo', key: 'nombre' },
            { header: 'Ruta', key: 'ruta' },
            { header: '% Variacion Personal Capacitado', key: 'variacionPersonal', type: 'number' },
        ];

        archivos.forEach(archivo => {
            worksheet.addRow({
                nNit: archivo.resultados.nNit,
                nombreCliente: archivo.resultados.nombreCliente,
                tipoNegocio: archivo.resultados.tipoNegocio,
                lugar: archivo.resultados.lugar,
                mes: archivo.resultados.mes,
                fechaSubida: archivo.fechaSubida,
                nombre: archivo.nombre,
                ruta: archivo.ruta,
                variacionPersonal: archivo.resultados.variacionPersonal
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

module.exports = router;
