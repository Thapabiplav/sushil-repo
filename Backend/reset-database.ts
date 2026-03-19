/**
 * Database Reset Script
 * 
 * This script drops all tables, recreates the database schema,
 * and seeds the super admin user.
 * 
 * Usage: npx ts-node reset-database.ts
 */

import { sequelize } from './src/config/database';
import { User } from './src/models/User';
import bcrypt from 'bcryptjs';

const SUPER_ADMIN_EMAIL = 'scti@maggu.com';
const SUPER_ADMIN_PASSWORD = 'sctimaggu@123';

async function resetDatabase() {
  console.log('🔄 Starting database reset...\n');

  try {
    // Test database connection
    console.log('📡 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Disable foreign key checks temporarily
    console.log('🔓 Disabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Foreign key checks disabled.\n');

    // Drop all tables
    console.log('🗑️  Dropping all tables...');
    await sequelize.drop({ cascade: true });
    console.log('✅ All tables dropped.\n');

    // Re-enable foreign key checks
    console.log('🔒 Re-enabling foreign key checks...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Foreign key checks re-enabled.\n');

    // Sync database (creates all tables based on models)
    console.log('📦 Recreating database schema...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database schema recreated.\n');

    // Seed super admin user
    console.log('👤 Creating super admin user...');
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
    
    await User.create({
      email: SUPER_ADMIN_EMAIL,
      passwordHash,
      role: 'admin',
      name: 'Super Admin',
      needsPasswordChange: false,
    });
    console.log('✅ Super admin user created.\n');

    console.log('🎉 Database reset completed successfully!\n');
    console.log('📝 Default login credentials:');
    console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log('   Role: admin\n');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the reset
resetDatabase();
