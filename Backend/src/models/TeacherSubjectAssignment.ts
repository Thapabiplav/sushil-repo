import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Subject } from './Subject';
import { SchoolClass } from './SchoolClass';
import { ClassSection } from './ClassSection';

export interface TeacherSubjectAssignmentAttributes {
  id: number;
  teacherId: number;
  subjectId: number;
  classId: number;
  sectionId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type TeacherSubjectAssignmentCreationAttributes = Optional<
  TeacherSubjectAssignmentAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export class TeacherSubjectAssignment
  extends Model<TeacherSubjectAssignmentAttributes, TeacherSubjectAssignmentCreationAttributes>
  implements TeacherSubjectAssignmentAttributes
{
  public id!: number;
  public teacherId!: number;
  public subjectId!: number;
  public classId!: number;
  public sectionId!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TeacherSubjectAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    teacherId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    subjectId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id',
      },
    },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'school_classes',
        key: 'id',
      },
    },
    sectionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'class_sections',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'teacher_subject_assignments',
    indexes: [
      {
        name: 'unique_teacher_subject_class_section',
        unique: true,
        fields: ['teacherId', 'subjectId', 'classId', 'sectionId'],
      },
    ],
  }
);

// Associations
TeacherSubjectAssignment.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(TeacherSubjectAssignment, { foreignKey: 'teacherId', as: 'subjectAssignments' });

TeacherSubjectAssignment.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
Subject.hasMany(TeacherSubjectAssignment, { foreignKey: 'subjectId', as: 'teacherAssignments' });

TeacherSubjectAssignment.belongsTo(SchoolClass, { foreignKey: 'classId', as: 'class' });
SchoolClass.hasMany(TeacherSubjectAssignment, { foreignKey: 'classId', as: 'subjectAssignments' });

TeacherSubjectAssignment.belongsTo(ClassSection, { foreignKey: 'sectionId', as: 'section' });
ClassSection.hasMany(TeacherSubjectAssignment, { foreignKey: 'sectionId', as: 'subjectAssignments' });
