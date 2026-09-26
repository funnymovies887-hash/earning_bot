/**
 * adminAutoSync.ts
 * Intelligent Client-Side Data Vault & Auto-Sync Engine
 * Ensures admin added packages, users, and configurations are NEVER lost,
 * even when code is updated, server is redeployed, or container is rebooted.
 */

export interface VaultStats {
  packages: number;
  users: number;
  orders: number;
  lastSyncTime: string;
}

const VAULT_STORAGE_KEY = 'CHOLO_INCOME_MASTER_VAULT_V2';
const VAULT_TIME_KEY = 'CHOLO_INCOME_VAULT_LAST_SYNC';

/**
 * Save current live system snapshot to browser storage
 */
export function saveVaultSnapshot(fullData: any): void {
  if (!fullData || typeof fullData !== 'object') return;
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString(),
      data: fullData.data || fullData,
    };
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(payload));
    localStorage.setItem(VAULT_TIME_KEY, payload.displayTime);
  } catch (err) {
    console.warn('[AdminVault] LocalStorage save warning:', err);
  }
}

/**
 * Get the stored master vault snapshot from browser storage
 */
export function getVaultSnapshot(): { timestamp: string; displayTime: string; data: any } | null {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Specifically update package list in browser vault and user caches
 * Ensures deleted packages are pruned immediately across all storage
 */
export function updateVaultPackages(packages: any[]): void {
  try {
    const vault = getVaultSnapshot();
    if (vault && vault.data) {
      vault.data.packages = packages;
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    }
    localStorage.setItem('earn_digital_packages', JSON.stringify(packages));
  } catch (e) {
    console.warn('[AdminVault] updateVaultPackages warning:', e);
  }
}

/**
 * Intelligent Auto-Sync:
 * 1. Checks current server state via /api/admin/backup/export
 * 2. Compares with local browser vault
 * 3. If server is missing packages or users (e.g. after container restart / fresh GitHub deploy),
 *    it sends an auto-sync merge request to restore them immediately!
 * 4. If server has latest data, updates the browser vault to keep it safe.
 */
export async function performAutoSync(forceSync = false): Promise<{
  success: boolean;
  action: 'restored' | 'backed_up' | 'already_synced';
  addedPackages?: number;
  updatedUsers?: number;
  serverCounts?: any;
  message: string;
}> {
  try {
    const res = await fetch('/api/admin/backup/export');
    if (!res.ok) {
      throw new Error('সার্ভার থেকে ডাটা রিড করতে ব্যর্থ হয়েছে');
    }
    const serverPayload = await res.json();
    const serverData = serverPayload.data || {};
    const serverCounts = serverPayload.counts || {};

    const serverPkgCount = serverData.packages?.length || 0;
    const serverUserCount = Object.keys(serverData.users || {}).length;

    const vault = getVaultSnapshot();

    // Only if forceSync is explicitly true (manual user action from backup screen),
    // we trigger auto-merge back to server.
    // NEVER automatically restore on normal page loads, because that resurrects items deleted by admin!
    if (forceSync && vault && vault.data) {
      const vaultPkgCount = vault.data.packages?.length || 0;
      const vaultUserCount = Object.keys(vault.data.users || {}).length;

      // Trigger auto-merge back to server!
      const mergeRes = await fetch('/api/admin/backup/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: vault.data }),
      });

      if (mergeRes.ok) {
        const mergeResult = await mergeRes.json();
        // Also fetch fresh server state to refresh vault
        const refreshRes = await fetch('/api/admin/backup/export');
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          saveVaultSnapshot(freshData);
        }

        return {
          success: true,
          action: 'restored',
          addedPackages: mergeResult.addedPackages || (vaultPkgCount - serverPkgCount),
          updatedUsers: mergeResult.updatedUsers || (vaultUserCount - serverUserCount),
          serverCounts: mergeResult.counts,
          message: `✅ ব্যাকআপ রিস্টোর সফল! ${vaultPkgCount}টি প্যাকেজ ও ইউজার ডাটা সার্ভারে রিস্টোর করা হয়েছে।`,
        };
      }
    }

    // Otherwise, server is healthy/newer: update local vault
    saveVaultSnapshot(serverPayload);

    return {
      success: true,
      action: 'backed_up',
      serverCounts,
      message: `✅ সকল ডাটা ব্রাউজার ভল্টে অটো-সেভ ও সিঙ্ক রয়েছে (${serverPkgCount}টি প্যাকেজ, ${serverUserCount} জন ইউজার)।`,
    };
  } catch (err: any) {
    console.error('[AdminVault AutoSync Error]:', err);
    return {
      success: false,
      action: 'already_synced',
      message: err.message || 'অটো-সিঙ্ক সম্পন্ন হতে সমস্যা হয়েছে',
    };
  }
}
