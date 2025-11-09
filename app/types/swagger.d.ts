declare module 'swagger-ui-express' {
    import { RequestHandler } from 'express';

    export const serve: RequestHandler[];
    export function setup(
        document?: unknown,
        opts?: Record<string, unknown>,
        config?: Record<string, unknown>,
        customCss?: string,
        customfavIcon?: string,
        swaggerUrl?: string,
    ): RequestHandler;

    const swaggerUi: {
        serve: typeof serve;
        setup: typeof setup;
    };

    export default swaggerUi;
}

declare module 'swagger-jsdoc' {
    export type SwaggerJsDocOptions = {
        definition: Record<string, unknown>;
        apis: string[];
    };

    export default function swaggerJsdoc(options: SwaggerJsDocOptions): Record<string, unknown>;
}
