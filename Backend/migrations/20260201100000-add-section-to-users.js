'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add section column to users table
    await queryInterface.addColumn('users', 'section', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'class',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove section column from users table
    await queryInterface.removeColumn('users', 'section');
  },
};
