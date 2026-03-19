"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const Role_1 = require("./Role");
class User extends sequelize_1.Model {
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('admin', 'teacher', 'student'),
        allowNull: false,
    },
    roleId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    phone: sequelize_1.DataTypes.STRING,
    address: sequelize_1.DataTypes.STRING,
    image: sequelize_1.DataTypes.STRING,
    username: sequelize_1.DataTypes.STRING,
    teacherId: sequelize_1.DataTypes.STRING,
    classTeacherOf: sequelize_1.DataTypes.STRING,
    assignedClasses: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    class: sequelize_1.DataTypes.STRING,
    section: sequelize_1.DataTypes.STRING,
    rollNumber: sequelize_1.DataTypes.STRING,
    needsPasswordChange: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    passwordUpdatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'users',
});
User.belongsTo(Role_1.Role, {
    foreignKey: 'roleId',
    as: 'assignedRole',
});
//# sourceMappingURL=User.js.map