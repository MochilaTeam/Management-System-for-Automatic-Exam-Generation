// Importa los elementos necesarios de Sequelize
const { Model, DataTypes } = require('sequelize');

// Exporta el modelo de Profesor
module.exports = (sequelize) => {
  class Profesor extends Model {}

  Profesor.init(
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
      especialidad: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Profesor',
      tableName: 'profesores',
      timestamps: false  // Si no usas campos de "createdAt" y "updatedAt"
    }
  );

  return Profesor;
};
