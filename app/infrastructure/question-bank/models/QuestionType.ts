import { DataTypes, Model } from 'sequelize';

import { QuestionTypeEnum } from '../../../domains/question-bank/entities/enums/QuestionType';
import { sequelize } from '../../../database/database';

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
