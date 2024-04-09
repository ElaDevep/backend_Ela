
// pruebas Unitarias (Modulo Agua)

const { calcularAhorroHidrico, calcularPorcentajeReduccion, calcularConsumoRecursos, calcularVariacion, calcularPorcentajePersonalCapacitado, calcularVariacionPersonalCapacitado } 
= require('../helpers/calculosAgua');

function runTests() {
    console.log('Prueba de calcularAhorroHidrico:');
    const ahorro = calcularAhorroHidrico(100, 80);
    console.log('Resultado:', ahorro);

    console.log('Prueba de calcularPorcentajeReduccion:');
    const reduccion = calcularPorcentajeReduccion(100, 80);
    console.log('Resultado:', reduccion);


}

runTests();
