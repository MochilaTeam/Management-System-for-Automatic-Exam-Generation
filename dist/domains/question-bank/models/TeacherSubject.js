"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherSubject = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../../../database/database");
class TeacherSubject extends sequelize_1.Model {
}
exports.TeacherSubject = TeacherSubject;
TeacherSubject.init({
    professorId: {
        type: sequelize_1.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'profesores', key: 'id' },
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
    tableName: 'TeacherSubjects',
    indexes: [{ fields: ['professorId'] }, { fields: ['subjectId'] }],
});
exports.default = TeacherSubject;
