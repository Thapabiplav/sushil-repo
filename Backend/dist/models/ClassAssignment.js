"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassAssignment = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
class ClassAssignment extends sequelize_1.Model {
}
exports.ClassAssignment = ClassAssignment;
ClassAssignment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    teacherId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    subject: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    students: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    schedule: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    room: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'class_assignments',
});
ClassAssignment.belongsTo(User_1.User, { foreignKey: 'teacherId', as: 'teacher' });
User_1.User.hasMany(ClassAssignment, { foreignKey: 'teacherId', as: 'classAssignments' });
//# sourceMappingURL=ClassAssignment.js.map