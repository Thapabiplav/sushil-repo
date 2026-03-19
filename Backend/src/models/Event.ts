import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface EventAttributes {
  id: number;
  title: string;
  date: Date;
  time: string;
  venue: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type EventCreationAttributes = Optional<EventAttributes, 'id'>;

export class Event
  extends Model<EventAttributes, EventCreationAttributes>
  implements EventAttributes
{
  public id!: number;
  public title!: string;
  public date!: Date;
  public time!: string;
  public venue!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'events',
  }
);

