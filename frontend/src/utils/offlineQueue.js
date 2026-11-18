/**
 * SerbisYou PWA - Offline IndexedDB Queue & Auto-Sync Engine
 * Fulfills PWA Criteria: Queues mutations locally when offline and
 * automatically synchronizes them upon network reconnection.
 */

const DB_NAME = 'serbisyou_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_mutations';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported on this browser.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Queue a mutation for later execution when the network recovers.
 * @param {Object} action - { endpoint: string, method: string, payload: any, description: string }
 */
export async function queueOfflineAction(action) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record = {
        ...action,
        timestamp: new Date().toISOString(),
      };

      const request = store.add(record);
      request.onsuccess = () => {
        console.log('[Offline Queue] Queued offline action:', record);
        // Dispatch event for UI notification
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('offline-action-queued', { detail: record })
          );
        }
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Offline Queue] Failed to queue offline action:', error);
    throw error;
  }
}

/**
 * Get all queued offline actions.
 */
export async function getQueuedOfflineActions() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Offline Queue] Failed to retrieve offline queue:', error);
    return [];
  }
}

/**
 * Remove a single processed action by ID.
 */
export async function removeOfflineAction(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[Offline Queue] Failed to delete action:', error);
  }
}

/**
 * Flush and sync all queued actions using the provided Axios instance.
 * @param {Function} apiCaller - Axios or fetch instance
 */
export async function syncOfflineQueue(apiCaller) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn('[Offline Queue] Cannot sync while still offline.');
    return { synced: 0, failed: 0 };
  }

  const queuedActions = await getQueuedOfflineActions();
  if (queuedActions.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`[Offline Queue] Synchronizing ${queuedActions.length} queued offline action(s)...`);

  let synced = 0;
  let failed = 0;

  for (const item of queuedActions) {
    try {
      const method = (item.method || 'post').toLowerCase();
      if (typeof apiCaller[method] === 'function') {
        await apiCaller[method](item.endpoint, item.payload);
      } else {
        await apiCaller({
          url: item.endpoint,
          method: item.method,
          data: item.payload,
        });
      }

      await removeOfflineAction(item.id);
      synced++;
    } catch (err) {
      console.error(`[Offline Queue] Failed to sync action #${item.id}:`, err);
      failed++;
    }
  }

  if (synced > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('offline-sync-completed', {
        detail: { synced, failed, total: queuedActions.length },
      })
    );
  }

  return { synced, failed };
}
