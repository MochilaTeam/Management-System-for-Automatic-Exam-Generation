"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../../database/database");
class QuestionType extends sequelize_1.Model {
}
QuestionType.init({
    id: { type: sequelize_1.STRING, primaryKey: true },
    name: { type: sequelize_1.STRING, allowNull: false, unique: true },
}, {
    sequelize: database_1.sequelize,
    tableName: 'QuestionTypes',
    indexes: [{ unique: true, fields: ['name'] }],
});
exports.default = QuestionType;
