import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SchoolProfileAttributes {
  id: number;
  name: string;
  motto?: string;
  email?: string;
  phone?: string;
  telephone?: string;
  website?: string;
  address?: string;
  established?: string;
  principal?: string;
  description?: string;
  registrationNumber?: string;
  panNumber?: string;
  contactPerson?: string;
  alternatePhone?: string;
  fax?: string;
  schoolLogo?: string;
  loginBackground?: string;
  profileBackground?: string;
  backgroundImages?: string; // JSON array of background image URLs
  socialMedia?: string; // JSON object for social media links
  themeColor?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SchoolProfileCreationAttributes extends Optional<SchoolProfileAttributes, 'id'> {}

export class SchoolProfile extends Model<SchoolProfileAttributes, SchoolProfileCreationAttributes> implements SchoolProfileAttributes {
  public id!: number;
  public name!: string;
  public motto?: string;
  public email?: string;
  public phone?: string;
  public telephone?: string;
  public website?: string;
  public address?: string;
  public established?: string;
  public principal?: string;
  public description?: string;
  public registrationNumber?: string;
  public panNumber?: string;
  public contactPerson?: string;
  public alternatePhone?: string;
  public fax?: string;
  public schoolLogo?: string;
  public loginBackground?: string;
  public profileBackground?: string;
  public backgroundImages?: string;
  public socialMedia?: string;
  public themeColor?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SchoolProfile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'School Name',
    },
    motto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    telephone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    established: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    principal: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    panNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactPerson: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    alternatePhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fax: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    schoolLogo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    loginBackground: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profileBackground: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    backgroundImages: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]',
    },
    socialMedia: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '{}',
    },
    themeColor: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '#22c55e', // Default green color
    },
  },
  {
    sequelize,
    tableName: 'school_profiles',
    timestamps: true,
  }
);
