"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../../database/database");
const User_1 = __importDefault(require("./User"));
class Teacher extends sequelize_1.Model {
}
Teacher.init({
    id: { type: sequelize_1.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: sequelize_1.STRING(200), allowNull: false },
    specialty: { type: sequelize_1.STRING(200), allowNull: false },
    userId: {
        type: sequelize_1.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'Users', key: 'id' },
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'Teachers',
    timestamps: false,
    indexes: [{ unique: true, fields: ['userId'] }],
});
// Associations
Teacher.belongsTo(User_1.default, {
    foreignKey: 'userId',
    as: 'user',
});
exports.default = Teacher;
