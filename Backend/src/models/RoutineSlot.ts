import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface RoutineSlotAttributes {
  id: number;
  className: string;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type RoutineSlotCreationAttributes = Optional<RoutineSlotAttributes, 'id'>;

export class RoutineSlot
  extends Model<RoutineSlotAttributes, RoutineSlotCreationAttributes>
  implements RoutineSlotAttributes
{
  public id!: number;
  public className!: string;
  public day!: string;
  public time!: string;
  public subject!: string;
  public teacher!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RoutineSlot.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    className: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    day: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacher: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'routine_slots',
  }
);

