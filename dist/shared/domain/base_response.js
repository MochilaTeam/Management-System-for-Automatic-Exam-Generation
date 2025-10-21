"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResult = exports.successResult = void 0;
/* ===== Helpers opcionales para no repetir ===== */
/** Crea un OperationResult<T> de éxito */
function successResult(data, message = 'Operación exitosa') {
    return { success: true, message, data };
}
exports.successResult = successResult;
/** Crea un OperationResult<T> de error */
function errorResult(message = 'Ocurrió un error', data = null) {
    return { success: false, message, data };
}
exports.errorResult = errorResult;
