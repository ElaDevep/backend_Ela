// Modulo de agua 


// Función para calcular el ahorro hídrico
function calcularAhorroHidrico(lineaBase, consumoActual) {
    return lineaBase - consumoActual;
}

// Función para calcular el porcentaje de reducción o ahorro hídrico
function calcularPorcentajeReduccion(lineaBase, consumoActual) {
    return ((lineaBase - consumoActual) / lineaBase) * 100;
}

// Función para calcular el consumo de recursos y/o materias primas (CM)
function calcularConsumoRecursos(cantidadMaterial, produccion) {
    return cantidadMaterial / produccion;
}

// Función para calcular la variación
function calcularVariacion(valorInicial, valorFinal) {
    return ((valorInicial - valorFinal) / valorInicial) * 100;
}

// Función para calcular el porcentaje de personal capacitado
function calcularPorcentajePersonalCapacitado(personasCapacitadas, totalPersonal) {
    return (personasCapacitadas / totalPersonal) * 100;
}

// Función para calcular la variación del porcentaje de personal capacitado
function calcularVariacionPersonalCapacitado(pcFinal, pcInicial) {
    return ((pcFinal - pcInicial) / pcInicial) * 100;
}
