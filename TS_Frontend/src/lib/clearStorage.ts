/**
 * LocalStorage Clear Utility for Teacher/Student Frontend
 * 
 * This utility clears all localStorage data used by the Teacher/Student Frontend
 * to reset the frontend to a fresh state.
 * 
 * Usage: import { clearTeacherStudentStorage } from './lib/clearStorage';
 *        clearTeacherStudentStorage();
 */

export function clearTeacherStudentStorage(): void {
  console.log('🧹 Clearing Teacher/Student Frontend localStorage...');

  // List of all localStorage keys used by Teacher/Student Frontend
  const keysToRemove = [
    'currentUser',  // User session data
  ];

  // Remove each key
  keysToRemove.forEach((key) => {
    const existing = localStorage.getItem(key);
    if (existing) {
      localStorage.removeItem(key);
      console.log(`  ✅ Removed: ${key}`);
    } else {
      console.log(`  ⏭️  Skipped (not found): ${key}`);
    }
  });

  console.log('✅ Teacher/Student Frontend localStorage cleared.\n');
}

export function clearAllFrontendStorage(): void {
  console.log('🧹 Clearing ALL frontend localStorage...');
  
  // Clear all localStorage
  localStorage.clear();
  console.log('✅ All localStorage cleared.\n');
}

export function clearFrontendAndLogout(): void {
  clearTeacherStudentStorage();
  // Force page reload to apply changes
  window.location.reload();
}
