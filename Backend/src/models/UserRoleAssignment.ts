import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Role } from './Role';

export interface UserRoleAssignmentAttributes {
  id: number;
  userId: number;
  roleId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserRoleAssignmentCreationAttributes = Optional<UserRoleAssignmentAttributes, 'id'>;

export class UserRoleAssignment
  extends Model<UserRoleAssignmentAttributes, UserRoleAssignmentCreationAttributes>
  implements UserRoleAssignmentAttributes
{
  public id!: number;
  public userId!: number;
  public roleId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserRoleAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'user_role_assignments',
  }
);

User.belongsToMany(Role, {
  through: UserRoleAssignment,
  foreignKey: 'userId',
  as: 'roles',
});

Role.belongsToMany(User, {
  through: UserRoleAssignment,
  foreignKey: 'roleId',
  as: 'users',
});

