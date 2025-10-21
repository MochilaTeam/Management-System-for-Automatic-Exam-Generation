import Student from './Student';
import Teacher from './Teacher';
import User from './User';

let __USER_ASSOCS_INIT__ = false;

export function initUserAssociations() {
  if (__USER_ASSOCS_INIT__) return;
  __USER_ASSOCS_INIT__ = true;

  Student.belongsTo(User, {
    as: 'user',
    foreignKey: { name: 'userId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Teacher.belongsTo(User, {
    as: 'user',
    foreignKey: { name: 'userId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  User.hasOne(Student, {
    as: 'student',
    foreignKey: { name: 'userId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  User.hasOne(Teacher, {
    as: 'teacher',
    foreignKey: { name: 'userId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
}

initUserAssociations();
