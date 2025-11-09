
/** Contrato base que comparten todas las respuestas */
export class BaseResponse {
    constructor(
        public success: boolean = true,
        public message: string = 'Operación exitosa',
    ) {}
}

/** Paginación básica */
export class PaginationSchema<T> extends BaseResponse {
    constructor(
        public data: T[],
        public page_size: number,
        public total: number,
        message: string = 'Consulta paginada exitosa',
        success: boolean = true,
    ) {
        super(success, message);
    }
}

/** Paginación con datos adicionales (metadatos, agregados, filtros aplicados, etc.) */
export class PaginationWithAdditionalDataSchema<
    T,
    A = Record<string, unknown>,
> extends BaseResponse {
    constructor(
        public data: T[],
        public page_size: number,
        public total: number,
        public additional_data: A,
        message: string = 'Consulta paginada (con metadatos) exitosa',
        success: boolean = true,
    ) {
        super(success, message);
    }
}

/** Recuperación de un único elemento */
export class RetrieveOneSchema<T> extends BaseResponse {
    constructor(
        public data: T | null = null,
        message: string = 'Consulta de elemento exitosa',
        success: boolean = true,
    ) {
        super(success, message);
    }
}

/** Recuperación de múltiples elementos (sin paginar) */
export class RetrieveManySchema<T> extends BaseResponse {
    constructor(
        public data: T[],
        message: string = 'Consulta de múltiples elementos exitosa',
        success: boolean = true,
    ) {
        super(success, message);
    }
}
