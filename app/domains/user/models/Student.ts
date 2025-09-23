const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Estudiante extends Model {}

  Estudiante.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false
      },
      edad: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      curso: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Estudiante',
      tableName: 'estudiantes',
      timestamps: false 
    }
  );

  return Estudiante;
};
