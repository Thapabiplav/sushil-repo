"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Material = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
class Material extends sequelize_1.Model {
}
exports.Material = Material;
Material.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    subject: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    class: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    size: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    uploadedByName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    uploadedOn: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    url: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    teacherId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'materials',
});
Material.belongsTo(User_1.User, { foreignKey: 'teacherId', as: 'teacher' });
User_1.User.hasMany(Material, { foreignKey: 'teacherId', as: 'materials' });
//# sourceMappingURL=Material.js.map