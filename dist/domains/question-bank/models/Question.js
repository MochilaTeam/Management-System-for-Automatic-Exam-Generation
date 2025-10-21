"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const enums_1 = require("./enums/enums");
const QuestionSubTopic_1 = __importDefault(require("./QuestionSubTopic"));
const QuestionType_1 = __importDefault(require("./QuestionType"));
const SubTopic_1 = __importDefault(require("./SubTopic"));
const database_1 = require("../../../database/database");
const Teacher_1 = __importDefault(require("../../user/models/Teacher"));
class Question extends sequelize_1.Model {
}
Question.init({
    id: { type: sequelize_1.STRING, primaryKey: true },
    subjectId: { type: sequelize_1.STRING, allowNull: false },
    options: { type: sequelize_1.JSON, allowNull: true },
    response: { type: sequelize_1.TEXT, allowNull: true },
    professorId: {
        type: sequelize_1.INTEGER,
        allowNull: false,
        references: { model: 'Teacheres', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
    },
    difficulty: { type: sequelize_1.ENUM(...enums_1.DifficultyValues), allowNull: false },
    body: { type: sequelize_1.STRING(1024), allowNull: false },
    questionTypeId: {
        type: sequelize_1.STRING,
        allowNull: false,
        references: { model: 'QuestionTypes', key: 'id' },
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'Questions',
    indexes: [
        { fields: ['subjectId', 'difficulty', 'options', 'response'] },
        { unique: true, fields: ['subjectId', 'body'] },
        { fields: ['questionTypeId'] },
        { fields: ['professorId'] },
    ],
});
QuestionType_1.default.hasMany(Question, {
    foreignKey: 'questionTypeId',
    as: 'questions',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});
Question.belongsTo(QuestionType_1.default, {
    foreignKey: 'questionTypeId',
    as: 'questionType',
});
Teacher_1.default.hasMany(Question, {
    foreignKey: 'professorId',
    as: 'questions',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});
Question.belongsTo(Teacher_1.default, {
    foreignKey: 'professorId',
    as: 'professor',
});
Question.belongsToMany(SubTopic_1.default, {
    through: QuestionSubTopic_1.default,
    as: 'subtopics',
    foreignKey: 'questionId',
    otherKey: 'subtopicId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
});
SubTopic_1.default.belongsToMany(Question, {
    through: QuestionSubTopic_1.default,
    as: 'questions',
    foreignKey: 'subtopicId',
    otherKey: 'questionId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
});
exports.default = Question;
