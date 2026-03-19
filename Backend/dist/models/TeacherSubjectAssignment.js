"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherSubjectAssignment = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
const Subject_1 = require("./Subject");
const SchoolClass_1 = require("./SchoolClass");
const ClassSection_1 = require("./ClassSection");
class TeacherSubjectAssignment extends sequelize_1.Model {
}
exports.TeacherSubjectAssignment = TeacherSubjectAssignment;
TeacherSubjectAssignment.init({
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
    subjectId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: 'subjects',
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
}, {
    sequelize: database_1.sequelize,
    tableName: 'teacher_subject_assignments',
    indexes: [
        {
            name: 'unique_teacher_subject_class_section',
            unique: true,
            fields: ['teacherId', 'subjectId', 'classId', 'sectionId'],
        },
    ],
});
// Associations
TeacherSubjectAssignment.belongsTo(User_1.User, { foreignKey: 'teacherId', as: 'teacher' });
User_1.User.hasMany(TeacherSubjectAssignment, { foreignKey: 'teacherId', as: 'subjectAssignments' });
TeacherSubjectAssignment.belongsTo(Subject_1.Subject, { foreignKey: 'subjectId', as: 'subject' });
Subject_1.Subject.hasMany(TeacherSubjectAssignment, { foreignKey: 'subjectId', as: 'teacherAssignments' });
TeacherSubjectAssignment.belongsTo(SchoolClass_1.SchoolClass, { foreignKey: 'classId', as: 'class' });
SchoolClass_1.SchoolClass.hasMany(TeacherSubjectAssignment, { foreignKey: 'classId', as: 'subjectAssignments' });
TeacherSubjectAssignment.belongsTo(ClassSection_1.ClassSection, { foreignKey: 'sectionId', as: 'section' });
ClassSection_1.ClassSection.hasMany(TeacherSubjectAssignment, { foreignKey: 'sectionId', as: 'subjectAssignments' });
//# sourceMappingURL=TeacherSubjectAssignment.js.map