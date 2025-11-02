import { get_logger } from "../../core/dependencies/dependencies";
import { AppError } from "../exceptions/appError";


export abstract class BaseUseCase<TInput, TOutput> {
  protected logger = get_logger()  
  private readonly useCaseName: string;

  constructor() {
    this.useCaseName = this.constructor.name;
  }

  abstract execute(input: TInput): Promise<TOutput>;

  protected logCommandStart(): void {
    this.logger.auditLogger.info(`STARTING COMMAND: ${this.useCaseName}`);
  }
  protected logCommandSuccess(): void {
    this.logger.auditLogger.info(`COMPLETED COMMAND: ${this.useCaseName}`);
  }
  protected logCommandError(error: unknown): void {
    this.logger.errorLogger.error(`FAILED COMMAND: ${this.useCaseName} | ERROR: ${String(error)}`);
  }

  protected logQueryStart(): void {
    this.logger.auditLogger.info(`STARTING QUERY: ${this.useCaseName}`);
  }
  protected logQuerySuccess(): void {
    this.logger.auditLogger.info(`COMPLETED QUERY: ${this.useCaseName}`);
  }
  protected logQueryError(error: unknown): void {
    this.logger.errorLogger.error(`FAILED QUERY: ${this.useCaseName} | ERROR: ${String(error)}`);
  }

  protected catchError(error: unknown, entity?: string): never {
    if (error instanceof AppError) {
      throw error; 
    }
    throw new AppError({
        message: `Error inesperado: ${String(error)}`,
        entity: entity ?? this.useCaseName,
    });
  }
}

/** Base para Commands (escritura) */
export abstract class BaseCommand<TInput, TOutput> extends BaseUseCase<TInput, TOutput> {
  /** Validación de entrada (opcional) */
  protected validateInput(_input: TInput): void {
    /* no-op por defecto */
  }

  /** Lógica de negocio específica (debe implementarse) */
  protected abstract executeBusinessLogic(input: TInput): Promise<TOutput>;

  async execute(input: TInput): Promise<TOutput> {
    try {
      this.logCommandStart();
      this.validateInput(input);
      const out = await this.executeBusinessLogic(input);
      this.logCommandSuccess();
      return out;
    } catch (err) {
      this.logCommandError(err);
      return this.catchError(err);
    }
  }
}

/** Base para Queries (lectura) */
export abstract class BaseQuery<TInput, TOutput> extends BaseUseCase<TInput, TOutput> {
  /** Validación de entrada (opcional) */
  protected validateInput(_input: TInput): void {
    /* no-op por defecto */
  }

  /** Lógica de negocio específica (debe implementarse) */
  protected abstract executeBusinessLogic(input: TInput): Promise<TOutput>;

  async execute(input: TInput): Promise<TOutput> {
    try {
      this.logQueryStart();
      this.validateInput(input);
      const out = await this.executeBusinessLogic(input);
      this.logQuerySuccess();
      return out;
    } catch (err) {
      this.logQueryError(err);
      return this.catchError(err);
    }
  }
}
//TODO: Implementar manejador de eventos? 