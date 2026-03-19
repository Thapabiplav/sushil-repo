/**
 * LocalStorage Clear Utility for Admin-Panel
 * 
 * This utility clears all localStorage data used by the Admin-Panel
 * to reset the frontend to a fresh state.
 * 
 * Usage: import { clearAdminPanelStorage } from './lib/clearStorage';
 *        clearAdminPanelStorage();
 */

export function clearAdminPanelStorage(): void {
  console.log('🧹 Clearing Admin-Panel localStorage...');

  // List of all localStorage keys used by Admin-Panel
  const keysToRemove = [
    'admin:isAuthenticated',  // Authentication state
    'schoolSettings',         // School settings and theme preferences
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

  console.log('✅ Admin-Panel localStorage cleared.\n');
}

export function clearAllFrontendStorage(): void {
  console.log('🧹 Clearing ALL frontend localStorage...');
  
  // Clear all localStorage
  localStorage.clear();
  console.log('✅ All localStorage cleared.\n');
  
  // Note: sessionStorage is not cleared as it typically expires when browser closes
  // If you want to clear sessionStorage as well:
  // sessionStorage.clear();
}

export function clearFrontendAndLogout(): void {
  clearAdminPanelStorage();
  // Force page reload to apply changes
  window.location.reload();
}
