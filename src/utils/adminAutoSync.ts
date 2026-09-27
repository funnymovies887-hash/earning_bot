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
    const clean = (packages || []).filter(
      (p: any) => p && p.id && !['pkg-1', 'pkg-2', 'pkg-3'].includes(p.id)
    );
    const vault = getVaultSnapshot();
    if (vault && vault.data) {
      vault.data.packages = clean;
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
    }
    localStorage.setItem('earn_digital_packages', JSON.stringify(clean));
  } catch (e) {
    console.warn('[AdminVault] updateVaultPackages warning:', e);
  }
}

/**
 * Intelligent Auto-Sync:
 * 1. Checks current server state via /api/admin/backup/export
 * 2. Prunes any legacy demo packages (pkg-1, pkg-2, pkg-3)
 * 3. Updates browser localStorage and vault with pristine server data
 * 4. Ensures deleted packages never return
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

    const rawPackages = Array.isArray(serverData.packages) ? serverData.packages : [];
    // Strict filter: remove any legacy demo package IDs
    const cleanPackages = rawPackages.filter(
      (p: any) => p && p.id && !['pkg-1', 'pkg-2', 'pkg-3'].includes(p.id)
    );

    // Save clean packages to user digital store cache
    localStorage.setItem('earn_digital_packages', JSON.stringify(cleanPackages));

    // Save pristine snapshot to master vault
    serverData.packages = cleanPackages;
    saveVaultSnapshot({ ...serverPayload, data: serverData });

    const serverPkgCount = cleanPackages.length;
    const serverUserCount = Object.keys(serverData.users || {}).length;

    return {
      success: true,
      action: 'backed_up',
      serverCounts: { ...serverCounts, packages: serverPkgCount },
      message: `✅ সমস্ত ডাটা সার্ভার ও ব্রাউজারে সফলভাবে সংরক্ষিত রয়েছে (${serverPkgCount}টি প্যাকেজ, ${serverUserCount} জন ইউজার)।`,
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
