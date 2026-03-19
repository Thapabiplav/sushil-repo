"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassSection = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const SchoolClass_1 = require("./SchoolClass");
class ClassSection extends sequelize_1.Model {
}
exports.ClassSection = ClassSection;
ClassSection.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    classId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'class_sections',
});
SchoolClass_1.SchoolClass.hasMany(ClassSection, {
    foreignKey: 'classId',
    as: 'sections',
});
ClassSection.belongsTo(SchoolClass_1.SchoolClass, {
    foreignKey: 'classId',
    as: 'schoolClass',
});
//# sourceMappingURL=ClassSection.js.map