"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subject = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Subject extends sequelize_1.Model {
}
exports.Subject = Subject;
Subject.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        // Unique constraint removed to allow same name in different classes
    },
    classId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: 'school_classes',
            key: 'id',
        },
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'subjects',
    indexes: [
        {
            unique: true,
            fields: ['name', 'classId'],
        },
    ],
});
//# sourceMappingURL=Subject.js.map