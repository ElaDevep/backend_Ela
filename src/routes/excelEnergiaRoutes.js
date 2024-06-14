const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Importa multer
const ArchivoEnergia = require('../models/ArchivoEnergia');
const Empresa = require('../models/Empresa');

// Configura multer
const upload = multer({ dest: '../uploads' });

 
 // Modulo Energia
 
 router.post('/uploadEnergia/:idEmpresa', upload.single('file'), async (req, res) => {
     try {
       console.log(req.file);
       const file = req.file;
       
  
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
     const nNit = worksheet.getCell('C126').value;
     const nombreCliente = worksheet.getCell('C127').value;
     const tipoNegocio = worksheet.getCell('C128').value;
     const lugar = worksheet.getCell('C130').value;
     const mes = worksheet.getCell('C129').value;
     const sede =worksheet.getCell('C131').value;
 
     const resultados = {
       nNit,
       nombreCliente,
       tipoNegocio,
       lugar,
       mes,
       sede,
       variacionConsumoEnergia,
       variacionConsumoNoAsociado,
       variacionCostosEnergia,
       variacionGasesInvernadero,
       variacionProduccionEnergetica,
       variacionProporcionEnergia,
       variacionPuntoMedicion,
       variacionDiagnosticoEnergetico,
       variacionPersonalCapacitado,
       
       
     };
     // Guardar los resultados en un nuevo libro de Excel
     const resultWorkbook = new ExcelJS.Workbook();
     const resultWorksheet = resultWorkbook.addWorksheet('Resultados');
     resultWorksheet.columns = [
       { header: 'N Nit', key: 'nNit' },
       { header: 'Nombre del cliente', key: 'nombreCliente' },
       { header: 'Tipo de negocio', key: 'tipoNegocio' },
       { header: 'Lugar', key: 'lugar' },
       { header: 'Mes', key: 'mes' },
       { header: 'Sede', key: 'sede' },
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
         nNit: resultados.nNit,
         nombreCliente: resultados.nombreCliente,
         tipoNegocio: resultados.tipoNegocio,
         lugar: resultados.lugar,
         mes: resultados.mes,
         sede:resultados.sede,
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
    const empresa = await Empresa.findById(req.params.idEmpresa);
    
    if(empresa.sede!=resultados.sede){
      return res.status(402).send('La sede no coincide con la empresa seleccionada');
    }

    if(empresa.nNit!=resultados.nNit){
      return res.status(403).send('El nit no coincide con la empresa seleccionada');
    }
     const archivo = new ArchivoEnergia({
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
 
  // Endpoint para descargar el archivo Excel de resultados
router.get('/resultadosE/:idEmpresa/:mes', async (req, res) => {
  try {
    const idEmpresa = req.params.idEmpresa;
    const mes = req.params.mes;

    // Cambiar la búsqueda para utilizar el campo nNit en lugar de cliente
    const archivo = await ArchivoEnergia.findOne({ idEmpresa: idEmpresa, 'resultados.mes': mes  });

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
      nNit: resultados.nNit,
      nombreCliente: resultados.nombreCliente,
      tipoNegocio: resultados.tipoNegocio,
      lugar: resultados.lugar,
      mes: resultados.mes,
      sede: resultados.sede,
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

// Endpoint para historico
router.get('/historicoE/:idEmpresa', async (req, res) => {
  try {
    const idEmpresa = req.params.idEmpresa;
    const archivos = await ArchivoEnergia.find({ idEmpresa: idEmpresa }).sort({ fechaSubida: 1 });

    // Crear un mapa para rastrear las filas existentes
    const rowMap = new Map();

    archivos.forEach(archivo => {
      const { mes, nombreCliente } = archivo.resultados;
      const key = `${mes}-${nombreCliente}`;
      if (rowMap.has(key)) {
        // Si existe una fila con el mismo mes y cliente, actualizarla
        const existingRow = rowMap.get(key);
      
        existingRow.variacionConsumoEnergia = archivo.resultados.variacionConsumoEnergia;
        existingRow.variacionConsumoNoAsociado = archivo.resultados.variacionConsumoNoAsociado;
        existingRow.variacionCostosEnergia = archivo.resultados.variacionCostosEnergia;
        existingRow.variacionGasesInvernadero = archivo.resultados.variacionGasesInvernadero;
        existingRow.variacionProduccionEnergetica = archivo.resultados.variacionProduccionEnergetica;
        existingRow.variacionProporcionEnergia = archivo.resultados.variacionProporcionEnergia;
        existingRow.variacionPuntoMedicion = archivo.resultados.variacionPuntoMedicion;
        existingRow.variacionDiagnosticoEnergetico = archivo.resultados.variacionDiagnosticoEnergetico;
        existingRow.variacionPersonalCapacitado = archivo.resultados.variacionPersonalCapacitado;
      } else {
        // Si no existe una fila para este mes y cliente, agregar una nueva fila
        rowMap.set(key, {
          nNit: archivo.resultados.nNit,
          nombreCliente: archivo.resultados.nombreCliente,
          tipoNegocio: archivo.resultados.tipoNegocio,
          lugar: archivo.resultados.lugar,
          mes: mes,
          sede: archivo.resultados.sede,
          variacionConsumoEnergia: archivo.resultados.variacionConsumoEnergia.toFixed(1),
          variacionConsumoNoAsociado: archivo.resultados.variacionConsumoNoAsociado.toFixed(1),
          variacionCostosEnergia: archivo.resultados.variacionCostosEnergia.toFixed(1),
          variacionGasesInvernadero: archivo.resultados.variacionGasesInvernadero.toFixed(1),
          variacionProduccionEnergetica: archivo.resultados.variacionProduccionEnergetica.toFixed(1),
          variacionProporcionEnergia: archivo.resultados.variacionProporcionEnergia.toFixed(1),
          variacionPuntoMedicion: archivo.resultados.variacionPuntoMedicion.toFixed(1),
          variacionDiagnosticoEnergetico: archivo.resultados.variacionDiagnosticoEnergetico.toFixed(1),
          variacionPersonalCapacitado: archivo.resultados.variacionPersonalCapacitado.toFixed(1)
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




// endpoint para visualizar los datos 
router.get('/resulE/:idEmpresa/:mes', async (req, res) => {
  try {
    const idEmpresa = req.params.idEmpresa;
    const mes = req.params.mes;

     // Buscar el archivo en la base de datos
     const archivo = await ArchivoEnergia.findOne({idEmpresa: idEmpresa, 'resultados.mes': mes });

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
      sede: archivo.resultados.sede,
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