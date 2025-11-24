export interface IUnitOfWork<SvcBundle> {
    withTransaction<T>(work: (svc: SvcBundle) => Promise<T>): Promise<T>;
}
