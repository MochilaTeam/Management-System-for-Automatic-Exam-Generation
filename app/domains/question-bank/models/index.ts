import Subject from "./Subject";
import ProfessorSubject from "./TeacherSubject";
import { Profesor } from "../../user/models/Teacher"; 

Profesor.belongsToMany(Subject, {
  through: ProfessorSubject,
  as: "subjects",
  foreignKey: "professorId",
  otherKey: "subjectId",
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});

Subject.belongsToMany(Profesor, {
  through: ProfessorSubject,
  as: "professors",
  foreignKey: "subjectId",
  otherKey: "professorId",
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});
