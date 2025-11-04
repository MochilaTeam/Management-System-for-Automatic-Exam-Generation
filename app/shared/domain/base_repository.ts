import { FindOptions, Model, ModelStatic, WhereOptions } from 'sequelize';

import {
    BaseDatabaseError,
    MultipleResultsFoundError,
    NotFoundError,
    TransactionError,
    UnexpectedError,
} from '../exceptions/domainErrors';

export class BaseRepository<TModel extends Model, TRead> {
    protected readonly model: ModelStatic<TModel>;
    protected readonly toReadFn: (row: TModel) => TRead;

    constructor(model: ModelStatic<TModel>, toRead: (row: TModel) => TRead) {
        this.model = model;
        this.toReadFn = toRead;
    }

    /**
     * Busca una entidad por filtros.
     * - Si hay > 1 resultado ⇒ MultipleResultsFoundError
     * - Si no hay ⇒ null
     */
    async get_one(filters: WhereOptions): Promise<TRead | null> {
        try {
            const rows = await this.model.findAll({ where: filters, limit: 2 } as FindOptions);
            if (rows.length > 1) {
                throw new MultipleResultsFoundError({ message: 'More than one entity found' });
            }
            const row = rows[0] ?? null;
            return row ? this.toReadFn(row) : null;
        } catch (e) {
            this.raiseError(e, this.model.name);
        }
    }

    /**
     * Crea un registro.
     */
    async create(data: TModel['_creationAttributes']): Promise<TRead> {
        try {
            const created = await this.model.create(data);
            return this.toReadFn(created);
        } catch (e) {
            this.raiseError(e, this.model.name);
        }
    }

    /**
     * Obtiene por id (UUID string).
     * - Si no existe ⇒ null
     */
    async get_by_id(id: string): Promise<TRead | null> {
        try {
            const row = await this.model.findByPk(id);
            return row ? this.toReadFn(row) : null;
        } catch (e) {
            this.raiseError(e, this.model.name);
        }
    }

    /**
     * Lista múltiple con paginación y filtros.
     */
    async get_multi(opts?: {
        offset?: number;
        limit?: number;
        filters?: WhereOptions;
    }): Promise<TRead[]> {
        try {
            const { offset = 0, limit = 100, filters = {} as WhereOptions } = opts ?? {};
            const options: FindOptions = { where: filters, offset, limit };
            const rows = await this.model.findAll(options);
            return rows.map((r) => this.toReadFn(r));
        } catch (e) {
            this.raiseError(e, this.model.name);
        }
    }

    /**
     * Actualiza por id parcialmente.
     * - Si no existe ⇒ null
     * - Devuelve DTO actualizado
     */
    async update(id: string, data: Partial<TModel['_creationAttributes']>): Promise<TRead | null> {
        try {
            const row = await this.model.findByPk(id);
            if (!row) return null;
            await row.update(data);
            return this.toReadFn(row);
        } catch (e) {
            this.raiseError(e, this.model.name);
        }
    }

    /**
     * Verifica existencia por filtros.
     */
    async exists(filters: WhereOptions): Promise<boolean> {
        try {
            const n = await this.model.count({ where: filters });
            return n > 0;
        } catch (e) {
            this.raiseError(e, this.model.name);
        }
    }

    /**
     * Eliminación hard delete por id.
     * - Devuelve true si borró ≥ 1 fila; false si no existía
     */
    async delete(id: string): Promise<boolean> {
        try {
            const deleted = await this.model.destroy({ where: { id } as WhereOptions });
            return deleted > 0;
        } catch (e) {
            this.raiseError(e, this.model.name);
        }
    }

    /**
     * Conteo con filtros opcionales.
     */
    async count(filters?: WhereOptions): Promise<number> {
        try {
            return await this.model.count({ where: filters ?? {} });
        } catch (e) {
            this.raiseError(e, this.model.name);
        }
    }

    /**
     * Traduce errores de Sequelize a excepciones de dominio.
     */
    protected raiseError(error: unknown, entityName?: string): never {
        const maybe = error as { name?: string; message?: string };
        const name = maybe?.name ?? '';

        if (
            name === 'SequelizeConnectionError' ||
            name === 'SequelizeConnectionRefusedError' ||
            name === 'SequelizeConnectionAcquireTimeoutError' ||
            name === 'SequelizeHostNotFoundError' ||
            name === 'SequelizeHostNotReachableError' ||
            name === 'SequelizeInvalidConnectionError' ||
            name === 'SequelizeConnectionTimedOutError' ||
            name === 'SequelizeTimeoutError'
        ) {
            throw new TransactionError({
                message: `Error de conexión/timeout: ${maybe?.message}`,
                entity: entityName,
            });
        }

        if (name === 'SequelizeDatabaseError') {
            throw new BaseDatabaseError({
                message: `Error de base de datos: ${maybe?.message}`,
                entity: entityName,
            });
        }

        if (name === 'SequelizeAggregateError' || name === 'AggregateError') {
            throw new UnexpectedError({
                message: `Error agregado: ${maybe?.message}`,
                entity: entityName,
            });
        }

        if (
            error instanceof NotFoundError ||
            error instanceof MultipleResultsFoundError ||
            error instanceof TransactionError ||
            error instanceof BaseDatabaseError ||
            error instanceof UnexpectedError
        ) {
            throw error;
        }

        throw new UnexpectedError({
            message: `Error inesperado: ${maybe?.message ?? String(error)}`,
            entity: entityName,
        });
    }
}
