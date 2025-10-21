/** Contrato base que comparten todas las respuestas */
export interface BaseResponse {
    success: boolean;
    message: string;
}

/** Paginación básica */
export interface PaginationSchema<T> extends BaseResponse {
    data: T[];
    page_size: number;
    total: number;
}

/** Paginación con datos adicionales (metadatos, agregados, filtros aplicados, etc.) */
export interface PaginationWithAdditionalDataSchema<T, A = Record<string, unknown>>
    extends BaseResponse {
    data: T[];
    page_size: number;
    total: number;
    additional_data: A;
}

/** Recuperación de un único elemento */
export interface RetrieveOneSchema<T> extends BaseResponse {
    data?: T | null;
}

/** Recuperación de múltiples elementos (sin paginar) */
export interface RetrieveManySchema<T> extends BaseResponse {
    data: T[];
}

/* ===== Helpers opcionales para no repetir ===== */

/** Crea un OperationResult<T> de éxito */
export function successResult<T>(data: T, message = 'Operación exitosa'): RetrieveOneSchema<T> {
    return { success: true, message, data };
}

/** Crea un OperationResult<T> de error */
export function errorResult<T = unknown>(
    message = 'Ocurrió un error',
    data: T | null = null,
): RetrieveOneSchema<T> {
    return { success: false, message, data };
}
