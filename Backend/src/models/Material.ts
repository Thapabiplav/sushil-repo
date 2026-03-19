import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export interface MaterialAttributes {
  id: number;
  title: string;
  subject: string;
  class: string;
  type: string;
  size: string;
  uploadedByName: string;
  uploadedOn: Date;
  url: string;
  teacherId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type MaterialCreationAttributes = Optional<MaterialAttributes, 'id' | 'teacherId'>;

export class Material
  extends Model<MaterialAttributes, MaterialCreationAttributes>
  implements MaterialAttributes
{
  public id!: number;
  public title!: string;
  public subject!: string;
  public class!: string;
  public type!: string;
  public size!: string;
  public uploadedByName!: string;
  public uploadedOn!: Date;
  public url!: string;
  public teacherId!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Material.init(
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
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    class: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uploadedByName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uploadedOn: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacherId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'materials',
  }
);

Material.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(Material, { foreignKey: 'teacherId', as: 'materials' });

