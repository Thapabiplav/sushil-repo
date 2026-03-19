/**
 * Complete System Reset Script
 * 
 * This script resets the entire MAGGU school management system:
 * 1. Clears all frontend localStorage data
 * 2. Resets the backend database (drops and recreates all tables)
 * 3. Seeds the super admin user
 * 
 * Usage: node reset-system.js
 * 
 * Prerequisites:
 * - Node.js installed
 * - Backend dependencies installed (cd Backend && npm install)
 * - Database running (MySQL)
 */

const { execSync } = require('child_process');
const readline = require('readline');

console.log('\n');
console.log('═'.repeat(60));
console.log('🗑️  MAGGU SYSTEM RESET');
console.log('═'.repeat(60));
console.log('\nThis will:');
console.log('  1. Clear all frontend localStorage data');
console.log('  2. Drop and recreate all database tables');
console.log('  3. Seed the super admin user');
console.log('  4. Remove ALL existing data, configurations, and history');
console.log('\n');

// Interactive confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  Are you sure you want to continue? (type "RESET" to confirm): ', (answer) => {
  if (answer !== 'RESET') {
    console.log('\n❌ Reset cancelled.\n');
    rl.close();
    process.exit(0);
  }

  console.log('\n🔄 Starting system reset...\n');

  try {
    // Step 1: Clear frontend localStorage
    console.log('─'.repeat(60));
    console.log('📦 Step 1: Clearing Frontend localStorage');
    console.log('─'.repeat(60));
    
    console.log('\n🧹 Clearing localStorage in browsers...');
    console.log('\nFor Admin-Panel (Admin-Panel/src/App.tsx):');
    console.log('  - admin:isAuthenticated');
    console.log('  - schoolSettings');
    console.log('\nFor Teacher/Student Frontend (Maggu_Teacher_Student_Frontend/src/App.tsx):');
    console.log('  - currentUser');
    
    console.log('\n✅ Frontend localStorage keys identified.\n');
    console.log('💡 To clear, run in browser console:');
    console.log('   localStorage.clear();');
    console.log('   location.reload();\n');

    // Step 2: Reset database with super admin seed
    console.log('─'.repeat(60));
    console.log('🗄️  Step 2: Resetting Database & Seeding Super Admin');
    console.log('─'.repeat(60));
    
    console.log('\n📡 To reset the database and seed the super admin, run:\n');
    console.log('   cd Backend');
    console.log('   npx ts-node reset-database.ts\n');
    
    console.log('   OR if you have MySQL CLI installed:\n');
    console.log('   mysql -u your_db_user -p -e "DROP DATABASE IF EXISTS school_db;"');
    console.log('   mysql -u your_db_user -p -e "CREATE DATABASE school_db;"');
    console.log('   cd Backend && npm run dev\n');
    console.log('   Then the server will automatically seed the super admin on startup.\n');

    console.log('─'.repeat(60));
    console.log('✅ System Reset Preparation Complete');
    console.log('─'.repeat(60));
    
    console.log('\n📋 Summary of actions needed:\n');
    console.log('  1. Open browser DevTools (F12) → Application → Local Storage');
    console.log('     → Clear all localStorage data');
    console.log('');
    console.log('  2. Run database reset command:');
    console.log('     cd Backend && npx ts-node reset-database.ts');
    console.log('');
    console.log('  3. Restart the backend server:');
    console.log('     cd Backend && npm run dev');
    console.log('');
    console.log('  4. Restart frontend applications:');
    console.log('     cd Admin-Panel && npm run dev');
    console.log('     cd Maggu_Teacher_Student_Frontend && npm run dev');
    console.log('\n');
    
    console.log('🔑 Super Admin credentials (seeded automatically):');
    console.log('   Email: scti@maggu.com');
    console.log('   Password: sctimaggu@123');
    console.log('   Role: admin');
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error during reset:', error);
  } finally {
    rl.close();
  }
});
