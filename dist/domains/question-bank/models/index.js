"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Subject_1 = __importDefault(require("./Subject"));
const TeacherSubject_1 = __importDefault(require("./TeacherSubject"));
const Teacher_1 = require("../../user/models/Teacher");
Teacher_1.Profesor.belongsToMany(Subject_1.default, {
    through: TeacherSubject_1.default,
    as: 'subjects',
    foreignKey: 'professorId',
    otherKey: 'subjectId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
});
Subject_1.default.belongsToMany(Teacher_1.Profesor, {
    through: TeacherSubject_1.default,
    as: 'professors',
    foreignKey: 'subjectId',
    otherKey: 'professorId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
});
