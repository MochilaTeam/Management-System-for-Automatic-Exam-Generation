import defineStudent, { Student } from './Student';
import defineTeacher, { Teacher } from './Teacher';
import defineUser, { User } from './User';
import { sequelize } from '../../../database/database'; // <- usa TU instancia

// 1) Definir modelos (NO crear nueva instancia de Sequelize aquí)
defineUser(sequelize);
defineTeacher(sequelize);
defineStudent(sequelize);

// 2) Asociaciones (una vez definidos todos)
User.hasOne(Teacher, {
  foreignKey: 'userId',
  as: 'Teacher',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Teacher.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasOne(Student, {
  foreignKey: 'userId',
  as: 'student',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Student.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export { sequelize, User, Teacher, Student };
