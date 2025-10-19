import defineEstudiante, { Estudiante } from './Student';
import defineProfesor, { Profesor } from './Teacher';
import defineUser, { User } from './User';
import { sequelize } from '../../../database/database'; // <- usa TU instancia

// 1) Definir modelos (NO crear nueva instancia de Sequelize aquí)
defineUser(sequelize);
defineProfesor(sequelize);
defineEstudiante(sequelize);

// 2) Asociaciones (una vez definidos todos)
User.hasOne(Profesor, {
  foreignKey: 'userId',
  as: 'profesor',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Profesor.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasOne(Estudiante, {
  foreignKey: 'userId',
  as: 'estudiante',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Estudiante.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export { sequelize, User, Profesor, Estudiante };
