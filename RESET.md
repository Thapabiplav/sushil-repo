# System Reset Guide

This document provides comprehensive instructions for resetting the MAGGU school management system to a fresh state.

## Overview

Resetting the system involves clearing:
1. **Frontend localStorage** - Authentication state, settings, user sessions
2. **Backend Database** - All tables, records, and configurations
3. **Application State** - In-memory caches and sessions

---

## Quick Reset (One-Click)

Run the automated reset script:

```bash
node reset-system.js
```

Follow the on-screen prompts to complete the reset.

---

## Manual Reset Steps

### Step 1: Clear Frontend localStorage

#### Admin-Panel
Clear the following localStorage keys in your browser:
- `admin:isAuthenticated` - Authentication state
- `schoolSettings` - School settings and theme preferences

**Browser Console Command:**
```javascript
localStorage.removeItem('admin:isAuthenticated');
localStorage.removeItem('schoolSettings');
location.reload();
```

#### Teacher/Student Frontend
Clear the following localStorage keys in your browser:
- `currentUser` - User session data

**Browser Console Command:**
```javascript
localStorage.removeItem('currentUser');
location.reload();
```

#### Clear All localStorage (All Applications)
```javascript
localStorage.clear();
location.reload();
```

---

### Step 2: Reset Database

#### Option A: Using the Reset Script (Recommended)

1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Run the reset script (this will drop all tables, recreate schema, and seed super admin):
   ```bash
   npx ts-node reset-database.ts
   ```

#### Option B: Using MySQL CLI

1. Drop the existing database:
   ```bash
   mysql -u your_db_user -p -e "DROP DATABASE IF EXISTS school_db;"
   ```

2. Create a fresh database:
   ```bash
   mysql -u your_db_user -p -e "CREATE DATABASE school_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

3. Restart the backend server (it will automatically sync models):
   ```bash
   cd Backend && npm run dev
   ```

#### Option C: Manual Table Deletion

If you need to keep the database but remove all data:

1. Connect to MySQL:
   ```bash
   mysql -u your_db_user -p
   ```

2. Execute SQL commands:
   ```sql
   -- Drop all tables
   SET FOREIGN_KEY_CHECKS = 0;
   DROP TABLE IF EXISTS users, roles, school_profiles, classes, subjects, attendance_records, notices, events, exams, materials, routines, class_assignments;
   SET FOREIGN_KEY_CHECKS = 1;
   
   -- Exit MySQL
   exit;
   ```

3. Restart the backend server to recreate tables.

---

### Step 3: Restart Applications

After resetting, restart all applications:

```bash
# Terminal 1 - Backend
cd Backend && npm run dev

# Terminal 2 - Admin Panel
cd Admin-Panel && npm run dev

# Terminal 3 - Teacher/Student Frontend
cd Maggu_Teacher_Student_Frontend && npm run dev
```

---

## What Gets Reset

### Data Removed

| Component | Data Removed |
|-----------|-------------|
| **Users** | All admin, teacher, and student accounts |
| **School Profile** | School name, logo, address, settings |
| **Classes** | All class definitions and sections |
| **Subjects** | All subject configurations |
| **Attendance** | All attendance records |
| **Notices/Events** | All notices and events |
| **Exams** | All exam records |
| **Routines** | All class routines |
| **Assignments** | All class assignments |

### Settings Reset

| Frontend | Settings Cleared |
|----------|-----------------|
| Admin-Panel | `admin:isAuthenticated`, `schoolSettings` |
| Teacher/Student Frontend | `currentUser` |

---

## Super Admin Credentials

After a fresh reset, the following super admin user is automatically seeded:

| Field | Value |
|-------|-------|
| **Email** | scti@maggu.com |
| **Password** | sctimaggu@123 |
| **Role** | admin |

> ⚠️ **Security Note**: Change these credentials immediately after first login in a production environment.

---

## Rollback (If Needed)

If you need to rollback after a reset:

1. **Restore from Backup**: If you have a database backup, restore it using MySQL:
   ```bash
   mysql -u your_db_user -p school_db < backup.sql
   ```

2. **Frontend State**: Users will need to log in again (their localStorage is cleared).

---

## Troubleshooting

### "Database connection failed"
- Ensure MySQL is running
- Check `.env` file in Backend directory has correct credentials
- Verify database exists

### "Tables not created"
- Ensure backend server is running
- Check console for Sequelize sync errors
- Run migrations if needed: `npx sequelize-cli db:migrate`

### "Frontend still shows old data"
- Hard refresh browser: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
- Clear browser cache
- Clear localStorage manually in DevTools

---

## API Endpoints Affected

After reset, these endpoints will return empty/default data:
- `GET /api/admin/dashboard` - Empty stats
- `GET /api/admin/school-profile` - Default profile
- `GET /api/students` - Empty list
- `GET /api/teachers` - Empty list
- `GET /api/classes` - Empty list

---

## Support

If you encounter issues during reset:
1. Check the backend console for database errors
2. Verify MySQL is running and accessible
3. Ensure all environment variables are set correctly in `.env` files
