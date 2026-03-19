"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceRecord = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
class AttendanceRecord extends sequelize_1.Model {
}
exports.AttendanceRecord = AttendanceRecord;
AttendanceRecord.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    studentId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Present', 'Absent'),
        allowNull: false,
    },
    time: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    location: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    photoUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'attendance_records',
});
AttendanceRecord.belongsTo(User_1.User, { foreignKey: 'studentId', as: 'student' });
User_1.User.hasMany(AttendanceRecord, { foreignKey: 'studentId', as: 'attendanceRecords' });
//# sourceMappingURL=AttendanceRecord.js.map