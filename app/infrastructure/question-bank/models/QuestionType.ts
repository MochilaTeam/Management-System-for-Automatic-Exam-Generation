import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../../../database/database';
import { QuestionTypeEnum } from '../../../domains/question-bank/entities/enums/QuestionType';

class QuestionType extends Model {
    public id!: string;
    public name!: QuestionTypeEnum;
}

QuestionType.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [Object.values(QuestionTypeEnum)],
            },
        },
    },
    {
        sequelize,
        tableName: 'QuestionTypes',
        indexes: [{ unique: true, fields: ['name'] }],
    },
);

export default QuestionType;
