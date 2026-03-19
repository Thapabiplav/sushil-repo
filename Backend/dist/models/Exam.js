"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exam = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
class Exam extends sequelize_1.Model {
}
exports.Exam = Exam;
Exam.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    studentId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    exam: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    results: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
    },
    totalObtained: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    totalMarks: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    percentage: {
        type: sequelize_1.DataTypes.FLOAT.UNSIGNED,
        allowNull: false,
    },
    rank: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'exams',
});
Exam.belongsTo(User_1.User, { foreignKey: 'studentId', as: 'student' });
User_1.User.hasMany(Exam, { foreignKey: 'studentId', as: 'exams' });
//# sourceMappingURL=Exam.js.map