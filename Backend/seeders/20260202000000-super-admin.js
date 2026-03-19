'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('superadmin123', 10);

    // Delete existing superadmin if exists
    await queryInterface.bulkDelete('users', {
      email: 'superadmin@school.com',
    });

    // Insert new superadmin
    await queryInterface.bulkInsert('users', [
      {
        email: 'superadmin@school.com',
        passwordHash,
        role: 'admin',
        roleId: null,
        name: 'Super Admin',
        phone: '9841000000',
        address: 'School Address',
        needsPasswordChange: false,
        passwordUpdatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: 'superadmin@school.com',
    });
  },
};
