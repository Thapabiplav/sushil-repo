import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { SchoolClass } from './SchoolClass';
import { ClassSection } from './ClassSection';

export interface ClassTeacherAssignmentAttributes {
  id: number;
  teacherId: number;
  classId: number;
  sectionId?: number | null;
  academicYear: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type ClassTeacherAssignmentCreationAttributes = Optional<
  ClassTeacherAssignmentAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export class ClassTeacherAssignment
  extends Model<ClassTeacherAssignmentAttributes, ClassTeacherAssignmentCreationAttributes>
  implements ClassTeacherAssignmentAttributes
{
  public id!: number;
  public teacherId!: number;
  public classId!: number;
  public sectionId!: number | null;
  public academicYear!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ClassTeacherAssignment.init(
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
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
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
  }
);

// Associations
ClassTeacherAssignment.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(ClassTeacherAssignment, { foreignKey: 'teacherId', as: 'classTeacherAssignments' });

ClassTeacherAssignment.belongsTo(SchoolClass, { foreignKey: 'classId', as: 'class' });
SchoolClass.hasMany(ClassTeacherAssignment, { foreignKey: 'classId', as: 'classTeacherAssignments' });

ClassTeacherAssignment.belongsTo(ClassSection, { foreignKey: 'sectionId', as: 'section' });
ClassSection.hasMany(ClassTeacherAssignment, { foreignKey: 'sectionId', as: 'classTeacherAssignments' });
