import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export interface AttendanceRecordAttributes {
  id: number;
  studentId: number;
  date: Date;
  status: 'Present' | 'Absent';
  time: string;
  location: string;
  photoUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type AttendanceRecordCreationAttributes = Optional<AttendanceRecordAttributes, 'id' | 'photoUrl'>;

export class AttendanceRecord
  extends Model<AttendanceRecordAttributes, AttendanceRecordCreationAttributes>
  implements AttendanceRecordAttributes
{
  public id!: number;
  public studentId!: number;
  public date!: Date;
  public status!: 'Present' | 'Absent';
  public time!: string;
  public location!: string;
  public photoUrl!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AttendanceRecord.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Present', 'Absent'),
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'attendance_records',
  }
);

AttendanceRecord.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
User.hasMany(AttendanceRecord, { foreignKey: 'studentId', as: 'attendanceRecords' });

