"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutineSlot = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class RoutineSlot extends sequelize_1.Model {
}
exports.RoutineSlot = RoutineSlot;
RoutineSlot.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    className: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    day: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    time: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    subject: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    teacher: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'routine_slots',
});
//# sourceMappingURL=RoutineSlot.js.map