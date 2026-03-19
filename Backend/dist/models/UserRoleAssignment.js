"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoleAssignment = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = require("./User");
const Role_1 = require("./Role");
class UserRoleAssignment extends sequelize_1.Model {
}
exports.UserRoleAssignment = UserRoleAssignment;
UserRoleAssignment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    roleId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'user_role_assignments',
});
User_1.User.belongsToMany(Role_1.Role, {
    through: UserRoleAssignment,
    foreignKey: 'userId',
    as: 'roles',
});
Role_1.Role.belongsToMany(User_1.User, {
    through: UserRoleAssignment,
    foreignKey: 'roleId',
    as: 'users',
});
//# sourceMappingURL=UserRoleAssignment.js.map