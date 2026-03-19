"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolProfile = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class SchoolProfile extends sequelize_1.Model {
}
exports.SchoolProfile = SchoolProfile;
SchoolProfile.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'School Name',
    },
    motto: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true,
        },
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    telephone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    website: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    established: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    principal: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    registrationNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    panNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    contactPerson: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    alternatePhone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    fax: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    schoolLogo: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    loginBackground: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    profileBackground: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    backgroundImages: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]',
    },
    socialMedia: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        defaultValue: '{}',
    },
    themeColor: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: '#22c55e', // Default green color
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'school_profiles',
    timestamps: true,
});
//# sourceMappingURL=SchoolProfile.js.map