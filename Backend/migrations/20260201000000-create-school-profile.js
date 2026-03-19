module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('school_profiles', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'School Name',
      },
      motto: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      telephone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      established: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      principal: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      registrationNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      panNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contactPerson: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      alternatePhone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fax: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      schoolLogo: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      loginBackground: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      profileBackground: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      backgroundImages: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '[]',
      },
      socialMedia: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '{}',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('school_profiles');
  },
};
