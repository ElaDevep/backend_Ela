const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ArchivoEducacion = require('../models/ArchivosEducacion');
const Empresa = require('../models/Empresa');

// Configurar multer
const upload = multer({ dest: '../uploads' });

// Endpoint para subir archivos de educación
router.post('/uploadEducacion/:idEmpresa', upload.single('file'), async (req, res) => {
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
        const sede =worksheet.getCell('C20').value;

       // Guardar resultados en un nuevo libro de Excel
       const resultWorkbook = new ExcelJS.Workbook();
       const resultWorksheet = resultWorkbook.addWorksheet('Resultados');
       resultWorksheet.columns = [
           { header: '% VariaciónPersonal', key: 'variacionPersonal', type: 'number' },
           { header: 'N Nit', key: 'nNit' },
           { header: 'Nombre del cliente', key: 'nombreCliente' },
           { header: 'Tipo de negocio', key: 'tipoNegocio' },
           { header: 'Lugar', key: 'lugar' },
           { header: 'Mes', key: 'mes' },
           { header: 'Sede', key: 'sede' },
       ];
       resultWorksheet.addRow({
           variacionPersonal: variacionPersonal,
           nNit: nNit,
           nombreCliente: nombreCliente,
           tipoNegocio: tipoNegocio,
           lugar: lugar,
           mes: mes,
           sede
       });

       const resultDirPath = path.join(__dirname, '../uploads/excelEducacion');
       const resultFilePath = path.join(resultDirPath, `resultados_${file.originalname}`);
       await resultWorkbook.xlsx.writeFile(resultFilePath);

       const empresa = await Empresa.findById(req.params.idEmpresa);
    
       if(empresa.sede!=sede){
         return res.status(402).send('La sede no coincide con la empresa seleccionada');
       }
   
       if(empresa.nNit!=nNit){
         return res.status(403).send('El nit no coincide con la empresa seleccionada');
       }
        // Crear objeto ArchivoEducacion y asignar el valor del NIT al campo nNit
        const archivo = new ArchivoEducacion({
            nombre: file.originalname,
            ruta: uploadPath,
            idEmpresa: req.params.idEmpresa,
            resultados: {
                variacionPersonal: variacionPersonal,
                nNit: nNit,
                nombreCliente: nombreCliente,
                tipoNegocio: tipoNegocio,
                lugar: lugar,
                mes: mes,
                sede:sede,
                

            }
        });
        // Guardar el objeto ArchivoEducacion en la base de datos
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

// Endpoint para visualizar solo los resultados
router.get('/resulEd/:idEmpresa/:mes', async (req, res) => {
    try {
        const idEmpresa = req.params.idEmpresa;
        const mes = req.params.mes;

        // Corregir la búsqueda para utilizar el campo resultados.nNit en lugar de cliente
        const archivo = await ArchivoEducacion.findOne({ idEmpresa: idEmpresa, 'resultados.mes': mes});

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
router.get('/resultadosEd/:idEmpresa/:mes', async (req, res) => {
    try {
        const idEmpresa = req.params.idEmpresa;
        const mes = req.params.mes;

        // Cambiar la búsqueda para utilizar el campo nNit en lugar de cliente
        const archivo = await ArchivoEducacion.findOne({ idEmpresa: idEmpresa, 'resultados.mes': mes });

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
            { header: 'Sede', key: 'sede' },
        ];

        worksheet.addRow({
            nNit: resultados.nNit,
            nombreCliente: resultados.nombreCliente,
            tipoNegocio: resultados.tipoNegocio,
            lugar: resultados.lugar,
            mes: resultados.mes,
            sede: resultados.sede,
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

// Endpoint para descargar el archivo Excel histórico de educación
router.get('/historicoEd/:idEmpresa', async (req, res) => {
    try {
      const idEmpresa = req.params.idEmpresa;
  
      // Corregir la búsqueda para utilizar el campo resultados.nNit en lugar de cliente
      const archivos = await ArchivoEducacion.find({ idEmpresa: idEmpresa }).sort({ fechaSubida: 1 });
  
      const rowMap = new Map();
  
      archivos.forEach(archivo => {
        const { mes, nombreCliente } = archivo.resultados;
        const key = `${mes}-${nombreCliente}`;
        if (rowMap.has(key)) {
          const existingRow = rowMap.get(key);
          existingRow.variacionPersonal = archivo.resultados.variacionPersonal;
        } else {
          rowMap.set(key, {
            nNit: archivo.resultados.nNit,
            nombreCliente: archivo.resultados.nombreCliente,
            tipoNegocio: archivo.resultados.tipoNegocio,
            lugar: archivo.resultados.lugar,
            mes: mes,
            sede: archivo.resultados.sede,
            variacionPersonal: archivo.resultados.variacionPersonal
          });
        }
      });
  
      // Convertir el mapa a un arreglo de objetos
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

