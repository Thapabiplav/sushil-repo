import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export interface ClassAssignmentAttributes {
  id: number;
  teacherId: number;
  name: string;
  subject: string;
  students: number;
  schedule: string;
  room: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type ClassAssignmentCreationAttributes = Optional<ClassAssignmentAttributes, 'id'>;

export class ClassAssignment
  extends Model<ClassAssignmentAttributes, ClassAssignmentCreationAttributes>
  implements ClassAssignmentAttributes
{
  public id!: number;
  public teacherId!: number;
  public name!: string;
  public subject!: string;
  public students!: number;
  public schedule!: string;
  public room!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ClassAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    teacherId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    students: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    schedule: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    room: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'class_assignments',
  }
);

ClassAssignment.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(ClassAssignment, { foreignKey: 'teacherId', as: 'classAssignments' });

