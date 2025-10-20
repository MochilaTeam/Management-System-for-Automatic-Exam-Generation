"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const SubjectTopic_1 = __importDefault(require("./SubjectTopic"));
const Topic_1 = __importDefault(require("./Topic"));
const database_1 = require("../../../database/database");
class Subject extends sequelize_1.Model {
}
Subject.init({
    id: { type: sequelize_1.STRING, primaryKey: true },
    name: { type: sequelize_1.STRING(200), allowNull: false, unique: true },
    program: { type: sequelize_1.STRING(200), allowNull: false },
}, { sequelize: database_1.sequelize, tableName: 'Subjects' });
Subject.belongsToMany(Topic_1.default, {
    through: SubjectTopic_1.default,
    as: 'topics',
    foreignKey: 'subjectId',
    otherKey: 'topicId',
});
exports.default = Subject;
