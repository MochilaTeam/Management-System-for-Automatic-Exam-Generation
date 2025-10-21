"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionSubtopic = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../../../database/database");
class QuestionSubtopic extends sequelize_1.Model {
}
exports.QuestionSubtopic = QuestionSubtopic;
QuestionSubtopic.init({
    questionId: {
        type: sequelize_1.STRING,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Questions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    subtopicId: {
        type: sequelize_1.STRING,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Subtopics', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'QuestionSubtopics',
    indexes: [{ fields: ['questionId'] }, { fields: ['subtopicId'] }],
});
exports.default = QuestionSubtopic;
