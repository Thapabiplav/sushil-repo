import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface SchoolClassAttributes {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type SchoolClassCreationAttributes = Optional<
  SchoolClassAttributes,
  'id' | 'isActive'
>;

export class SchoolClass
  extends Model<SchoolClassAttributes, SchoolClassCreationAttributes>
  implements SchoolClassAttributes
{
  public id!: number;
  public name!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SchoolClass.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'school_classes',
  }
);

