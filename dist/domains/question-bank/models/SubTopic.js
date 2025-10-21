"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subtopic = void 0;
const sequelize_1 = require("sequelize");
const Topic_1 = __importDefault(require("./Topic"));
const database_1 = require("../../../database/database");
class Subtopic extends sequelize_1.Model {
}
exports.Subtopic = Subtopic;
Subtopic.init({
    id: {
        type: sequelize_1.STRING,
        primaryKey: true,
    },
    topicId: {
        type: sequelize_1.STRING,
        allowNull: false,
        references: { model: 'Topics', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    name: {
        type: sequelize_1.STRING(200),
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'Subtopics',
    indexes: [{ fields: ['topicId'] }, { unique: true, fields: ['topicId', 'name'] }],
});
Subtopic.belongsTo(Topic_1.default, {
    as: 'topic',
    foreignKey: 'topicId',
    targetKey: 'id',
});
exports.default = Subtopic;
