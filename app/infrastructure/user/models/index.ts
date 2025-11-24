import Student from './Student';
import Teacher from './Teacher';
import User from './User';

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

export { Student, Teacher, User };
