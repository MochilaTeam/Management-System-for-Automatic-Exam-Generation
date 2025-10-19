import { sequelize } from '../../../database/database'; // <- usa TU instancia
import defineUser, { User } from './User';
import defineProfesor, { Profesor } from './Teacher';
import defineEstudiante, { Estudiante } from './Student';

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
