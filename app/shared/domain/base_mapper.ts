import { Model } from 'sequelize';

export interface BaseMapper<TModel extends Model, TRead> {
    toRead(instance: TModel): TRead;
}
