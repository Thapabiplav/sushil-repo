import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface NoticeAttributes {
  id: number;
  title: string;
  content: string;
  date: Date;
  type: string;
  imageUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type NoticeCreationAttributes = Optional<NoticeAttributes, 'id' | 'imageUrl'>;

export class Notice
  extends Model<NoticeAttributes, NoticeCreationAttributes>
  implements NoticeAttributes
{
  public id!: number;
  public title!: string;
  public content!: string;
  public date!: Date;
  public type!: string;
  public imageUrl!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notice.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notices',
  }
);

