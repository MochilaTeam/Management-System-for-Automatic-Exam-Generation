"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../../database/database");
const Teacher_1 = __importDefault(require("./Teacher"));
const Student_1 = __importDefault(require("./Student"));
class User extends sequelize_1.Model {
}
User.init({
    id: { type: sequelize_1.INTEGER, primaryKey: true, autoIncrement: true },
    username: {
        type: sequelize_1.STRING(100),
        allowNull: false,
        unique: true,
    },
    passwordHash: {
        type: sequelize_1.STRING(255),
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'Users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['username'] }],
});
// Associations (1:1 with Teacher / Student)
User.hasOne(Teacher_1.default, {
    foreignKey: 'userId',
    as: 'teacher',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
User.hasOne(Student_1.default, {
    foreignKey: 'userId',
    as: 'student',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
exports.default = User;
