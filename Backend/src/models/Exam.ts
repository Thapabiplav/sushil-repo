import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export interface ExamResultEntry {
  subject: string;
  fullMarks: number;
  obtained: number;
  grade: string;
}

export interface ExamAttributes {
  id: number;
  studentId: number;
  exam: string;
  date: Date;
  results: ExamResultEntry[];
  totalObtained: number;
  totalMarks: number;
  percentage: number;
  rank: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type ExamCreationAttributes = Optional<ExamAttributes, 'id'>;

export class Exam
  extends Model<ExamAttributes, ExamCreationAttributes>
  implements ExamAttributes
{
  public id!: number;
  public studentId!: number;
  public exam!: string;
  public date!: Date;
  public results!: ExamResultEntry[];
  public totalObtained!: number;
  public totalMarks!: number;
  public percentage!: number;
  public rank!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Exam.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    exam: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    results: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    totalObtained: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    totalMarks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    percentage: {
      type: DataTypes.FLOAT.UNSIGNED,
      allowNull: false,
    },
    rank: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'exams',
  }
);

Exam.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
User.hasMany(Exam, { foreignKey: 'studentId', as: 'exams' });

