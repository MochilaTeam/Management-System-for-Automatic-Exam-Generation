"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../../../database/database");
class SubjectTopic extends sequelize_1.Model {
}
SubjectTopic.init({
    topicId: {
        type: sequelize_1.STRING,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Topics', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    subjectId: {
        type: sequelize_1.STRING,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Subjects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'SubjectTopics',
    indexes: [{ fields: ['subjectId'] }, { fields: ['topicId'] }],
});
exports.default = SubjectTopic;
