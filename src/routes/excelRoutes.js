const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');

// Endpoint para generar un archivo Excel con los datos
router.get('/generar-excel', async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Ahorro Hídrico');

        // Definir valores fijos
        const lineaBaseM3 = 100;
        const consumoActualM3 = 80;
        const pcInicial = 50;
        const pcFinalCelda = 40; // Celda para PC final

        // Calcular % Reducción o Ahorro Hídrico y definir fórmula
        const reduccionHidricoFormula = `=(B2 - B3) / B2 * 100`; // Formula con referencias de celda

        // Calcular % Variación en Personal Capacitado y definir fórmula
        const variacionPCFormula = `=(B8 - B7) / B7 * 100`; // Formula con referencia de celda para PC final

        // Escribir datos en la hoja de cálculo
        sheet.addRow(['Ahorro Hídrico']);
        sheet.addRow(['Línea Base en m3', lineaBaseM3]);
        sheet.addRow(['Consumo de agua en m3 actual', consumoActualM3]);
        sheet.addRow(['%Reducción o Ahorro Hídrico', { formula: reduccionHidricoFormula, result: '' }]);
        sheet.addRow(['']);
        sheet.addRow(['Personal Capacitado (PC)']);
        sheet.addRow(['PC inicial', pcInicial]);
        sheet.addRow(['PC final', { formula: pcFinalCelda }]); // Mostrar la celda de PC final sin calcular la fórmula aquí
        sheet.addRow(['%Variación', { formula: variacionPCFormula, result: '' }]);

        // Generar el archivo Excel y enviarlo como respuesta
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="datos.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al generar el archivo Excel:', error);
        res.status(500).send('Error al generar el archivo Excel');
    }
});

module.exports = router;
