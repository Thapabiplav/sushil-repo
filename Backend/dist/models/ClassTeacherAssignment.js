"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassTeacherAssignment = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
const SchoolClass_1 = require("./SchoolClass");
const ClassSection_1 = require("./ClassSection");
class ClassTeacherAssignment extends sequelize_1.Model {
}
exports.ClassTeacherAssignment = ClassTeacherAssignment;
ClassTeacherAssignment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    teacherId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    classId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: 'school_classes',
            key: 'id',
        },
    },
    sectionId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
            model: 'class_sections',
            key: 'id',
        },
    },
    academicYear: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'class_teacher_assignments',
    indexes: [
        {
            name: 'unique_teacher_class_section_year',
            unique: true,
            fields: ['teacherId', 'classId', 'sectionId', 'academicYear'],
        },
        {
            unique: true,
            fields: ['classId', 'sectionId', 'academicYear'],
            name: 'unique_class_section_year',
        },
    ],
});
// Associations
ClassTeacherAssignment.belongsTo(User_1.User, { foreignKey: 'teacherId', as: 'teacher' });
User_1.User.hasMany(ClassTeacherAssignment, { foreignKey: 'teacherId', as: 'classTeacherAssignments' });
ClassTeacherAssignment.belongsTo(SchoolClass_1.SchoolClass, { foreignKey: 'classId', as: 'class' });
SchoolClass_1.SchoolClass.hasMany(ClassTeacherAssignment, { foreignKey: 'classId', as: 'classTeacherAssignments' });
ClassTeacherAssignment.belongsTo(ClassSection_1.ClassSection, { foreignKey: 'sectionId', as: 'section' });
ClassSection_1.ClassSection.hasMany(ClassTeacherAssignment, { foreignKey: 'sectionId', as: 'classTeacherAssignments' });
//# sourceMappingURL=ClassTeacherAssignment.js.map