"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = exports.Teacher = exports.User = exports.sequelize = void 0;
const Student_1 = __importDefault(require("./Student"));
exports.Student = Student_1.default;
const Teacher_1 = __importDefault(require("./Teacher"));
exports.Teacher = Teacher_1.default;
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
const database_1 = require("../../../database/database");
Object.defineProperty(exports, "sequelize", { enumerable: true, get: function () { return database_1.sequelize; } });
User_1.default.hasOne(Teacher_1.default, {
    foreignKey: 'userId',
    as: 'Teacher',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
Teacher_1.default.belongsTo(User_1.default, {
    foreignKey: 'userId',
    as: 'user',
});
User_1.default.hasOne(Student_1.default, {
    foreignKey: 'userId',
    as: 'student',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
Student_1.default.belongsTo(User_1.default, {
    foreignKey: 'userId',
    as: 'user',
});
