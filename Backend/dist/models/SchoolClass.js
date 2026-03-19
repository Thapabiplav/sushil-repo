"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolClass = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class SchoolClass extends sequelize_1.Model {
}
exports.SchoolClass = SchoolClass;
SchoolClass.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'school_classes',
});
//# sourceMappingURL=SchoolClass.js.map