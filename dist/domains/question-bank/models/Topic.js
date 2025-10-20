"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Topic = void 0;
const sequelize_1 = require("sequelize");
const Subject_1 = __importDefault(require("./Subject"));
const SubjectTopic_1 = __importDefault(require("./SubjectTopic"));
const SubTopic_1 = __importDefault(require("./SubTopic"));
const database_1 = require("../../../database/database");
class Topic extends sequelize_1.Model {
}
exports.Topic = Topic;
Topic.init({
    id: { type: sequelize_1.STRING, primaryKey: true },
    title: { type: sequelize_1.STRING(200), allowNull: false, unique: true },
}, {
    sequelize: database_1.sequelize,
    tableName: 'Topics',
});
Topic.hasMany(SubTopic_1.default, {
    as: 'subtopics',
    foreignKey: 'topicId',
    sourceKey: 'id',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
});
Topic.belongsToMany(Subject_1.default, {
    through: SubjectTopic_1.default,
    as: 'subjects',
    foreignKey: 'topicId',
    otherKey: 'subjectId',
});
exports.default = Topic;
