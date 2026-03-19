import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { SchoolClass } from './SchoolClass';

export interface ClassSectionAttributes {
  id: number;
  classId: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type ClassSectionCreationAttributes = Optional<ClassSectionAttributes, 'id'>;

export class ClassSection
  extends Model<ClassSectionAttributes, ClassSectionCreationAttributes>
  implements ClassSectionAttributes
{
  public id!: number;
  public classId!: number;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ClassSection.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'class_sections',
  }
);

SchoolClass.hasMany(ClassSection, {
  foreignKey: 'classId',
  as: 'sections',
});

ClassSection.belongsTo(SchoolClass, {
  foreignKey: 'classId',
  as: 'schoolClass',
});

