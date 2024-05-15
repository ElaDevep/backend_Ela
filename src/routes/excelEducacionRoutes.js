const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Importa multer
const ArchivoEducacion = require('../models/ArchivosEducacion'); // Cambio de nombre del modelo
// Cambio de nombre del modelo

// Configura multer
const upload = multer({ dest: '../uploads' });

// Endpoint para subir archivos de educación
router.post('/uploadEducacion', upload.single('file'), async (req, res) => {
    try {
        console.log(req.file);
        const file = req.file;
        const clienteId = req.body.clienteId;
        const empresaId = req.body.empresaId;
        const nitEmpresa = req.body.nitEmpresa;
        const Mes = req.body.mes;

        const fileData = fs.readFileSync(file.path);
        const uploadPath = path.join(__dirname, '../uploads/excelEducacion', file.originalname);
        fs.writeFileSync(uploadPath, fileData);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(uploadPath);
        const worksheet = workbook.getWorksheet(1);

        // Evaluar la fórmula del personal capacitado
        const c4 = parseFloat(worksheet.getCell('C4').value.toString().replace(',', '.'));
        const c5 = parseFloat(worksheet.getCell('C5').value.toString().replace(',', '.'));
        const variacionPersonal = ((c5 - c4) / c4) * 100;

        // Obtener otros valores del Excel
        const nPoliza = worksheet.getCell('C15').value;
        const nombreCliente = worksheet.getCell('C16').value;
        const tipoNegocio = worksheet.getCell('C17').value;
        const lugar = worksheet.getCell('C19').value;
        const mes = worksheet.getCell('C18').value;

        // Guardar resultados en un nuevo libro de Excel
        const resultWorkbook = new ExcelJS.Workbook();
        const resultWorksheet = resultWorkbook.addWorksheet('Resultados');
        resultWorksheet.columns = [
            { header: '% VariaciónPersonal', key: 'variacionPersonal', type: 'number' },
            { header: 'N Poliza', key: 'nPoliza' },
            { header: 'Nombre del cliente', key: 'nombreCliente' },
            { header: 'Tipo de negocio', key: 'tipoNegocio' },
            { header: 'Lugar', key: 'lugar' },
            { header: 'Mes', key: 'mes' },
        ];
        resultWorksheet.addRow({
            variacionPersonal: variacionPersonal,
            nPoliza: nPoliza,
            nombreCliente: nombreCliente,
            tipoNegocio: tipoNegocio,
            lugar: lugar,
            mes: mes
        });

        const resultDirPath = path.join(__dirname, '../uploads/excelEducacion');
        const resultFilePath = path.join(resultDirPath, `resultados_${file.originalname}`);
        await resultWorkbook.xlsx.writeFile(resultFilePath);

        // Guardar archivos en la base de datos
        const archivo = new ArchivoEducacion({
            nombre: file.originalname,
            ruta: uploadPath,
            resultados: {
                variacionPersonal: variacionPersonal,
                nPoliza: nPoliza,
                nombreCliente: nombreCliente,
                tipoNegocio: tipoNegocio,
                lugar: lugar,
                mes: mes
            },
            nitEmpresa: nitEmpresa,
            cliente: clienteId,
            empresa: empresaId,
            
        });
        await archivo.save();

        res.status(200).send('Archivos subidos y procesados correctamente.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al procesar los archivos.');
    }   
});

// Endpoint para visualizar solo los resultados
router.get('/resulEd/:id/:mes', async (req, res) => {
    try {
        const id = req.params.id;
        const mes = req.params.mes;
        const nitEmpresa = req.user.nitEmpresa; 
       
       // Buscar el archivo en la base de datos por su ID, mes y NIT de la empresa
       const archivo = await ArchivoEducacion.findOne({ _id: id, nitEmpresa: nitEmpresa, 'resultados.mes': mes });

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

// Endpoint para descargar el archivo Excel de resultados
router.get('/resultadosEd/:id/:mes', async (req, res) => {
    try {
        const id = req.params.id;
        const mes = req.params.mes;
        const nitEmpresa = req.user.nitEmpresa;

        const archivo = await ArchivoEducacion.findOne({ _id: id, nitEmpresa: nitEmpresa, 'resultados.mes': mes });

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
            { header: '% Variacion Personal Capacitado', key: 'variacionPersonal', type: 'number' },
        ];

        worksheet.addRow({
            nNic: resultados.nNic,
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
        res.status(500).send('Error al descargar los resultados.');
    }
});

// Endpoint para descargar el archivo Excel histórico
router.get('/historicoEd', async (req, res) => {
    try {
        const nitEmpresa = req.user.nitEmpresa; // Suponiendo que tienes el NIT de la empresa en el objeto de usuario
        const archivos = await ArchivoEducacion.find({ nitEmpresa: nitEmpresa });
       
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
            { header: '% Variacion Personal Capacitado', key: 'variacionPersonal', type: 'number' },
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
