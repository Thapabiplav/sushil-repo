"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notice = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Notice extends sequelize_1.Model {
}
exports.Notice = Notice;
Notice.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'notices',
});
//# sourceMappingURL=Notice.js.map