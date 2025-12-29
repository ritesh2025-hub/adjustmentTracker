// database.js - IndexedDB wrapper for storing receipts, coupons, and settings

const DB_NAME = 'ReceiptTrackerDB';
const DB_VERSION = 1;

const STORES = {
    RECEIPTS: 'receipts',
    COUPONS: 'coupons',
    SETTINGS: 'settings'
};

let db = null;

/**
 * Initialize IndexedDB and create object stores
 */
async function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database failed to open:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('Database upgrade needed, creating object stores...');

            // Create receipts object store
            if (!db.objectStoreNames.contains(STORES.RECEIPTS)) {
                const receiptsStore = db.createObjectStore(STORES.RECEIPTS, { keyPath: 'id' });
                receiptsStore.createIndex('purchaseDate', 'purchaseDate', { unique: false });
                receiptsStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                console.log('Created receipts object store');
            }

            // Create coupons object store
            if (!db.objectStoreNames.contains(STORES.COUPONS)) {
                const couponsStore = db.createObjectStore(STORES.COUPONS, { keyPath: 'id' });
                couponsStore.createIndex('validUntil', 'validUntil', { unique: false });
                couponsStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                console.log('Created coupons object store');
            }

            // Create settings object store
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                console.log('Created settings object store');
            }
        };
    });
}

/**
 * Load monthly coupons from GitHub (replaces local coupon storage)
 * This function loads coupons from monthly JSON files instead of IndexedDB
 * @param {boolean} bustCache - If true, forces fresh fetch from GitHub
 */
async function loadMonthlyCouponsToMemory(bustCache = false) {
    try {
        console.log('Loading monthly coupons from GitHub...');

        // Use the coupon-manager.js function to load from monthly files
        const monthlyCoupons = await loadMonthlyCoupons(bustCache);

        if (monthlyCoupons && monthlyCoupons.length > 0) {
            console.log(`✅ Loaded ${monthlyCoupons.length} coupons from monthly files`);
            return monthlyCoupons;
        } else {
            console.warn('No monthly coupons found, app will work without coupons');
            return [];
        }
    } catch (error) {
        console.error('Could not load monthly coupons:', error);
        return [];
    }
}

/**
 * Get a transaction for the specified store
 */
function getTransaction(storeName, mode = 'readonly') {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db.transaction([storeName], mode);
}

/**
 * Save a receipt to the database
 */
async function saveReceipt(receipt) {
    return new Promise((resolve, reject) => {
        const transaction = getTransaction(STORES.RECEIPTS, 'readwrite');
        const store = transaction.objectStore(STORES.RECEIPTS);

        // Generate ID if not present
        if (!receipt.id) {
            receipt.id = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Set upload date if not present
        if (!receipt.uploadDate) {
            receipt.uploadDate = new Date().toISOString();
        }

        const request = store.put(receipt);

        request.onsuccess = () => {
            console.log('Receipt saved successfully:', receipt.id);
            resolve(receipt);
        };

        request.onerror = () => {
            console.error('Failed to save receipt:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Get all receipts, optionally filtered by date range
 */
async function getReceipts(startDate = null, endDate = null) {
    return new Promise((resolve, reject) => {
        const transaction = getTransaction(STORES.RECEIPTS, 'readonly');
        const store = transaction.objectStore(STORES.RECEIPTS);
        const request = store.getAll();

        request.onsuccess = () => {
            let receipts = request.result;

            // Filter by date range if provided
            if (startDate || endDate) {
                receipts = receipts.filter(receipt => {
                    const purchaseDate = new Date(receipt.purchaseDate);
                    if (startDate && purchaseDate < new Date(startDate)) return false;
                    if (endDate && purchaseDate > new Date(endDate)) return false;
                    return true;
                });
            }

            resolve(receipts);
        };

        request.onerror = () => {
            console.error('Failed to get receipts:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Get a specific receipt by ID
 */
async function getReceiptById(id) {
    return new Promise((resolve, reject) => {
        const transaction = getTransaction(STORES.RECEIPTS, 'readonly');
        const store = transaction.objectStore(STORES.RECEIPTS);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error('Failed to get receipt:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Delete a receipt by ID
 */
async function deleteReceipt(id) {
    return new Promise((resolve, reject) => {
        const transaction = getTransaction(STORES.RECEIPTS, 'readwrite');
        const store = transaction.objectStore(STORES.RECEIPTS);
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log('Receipt deleted successfully:', id);
            resolve(true);
        };

        request.onerror = () => {
            console.error('Failed to delete receipt:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Save a coupon to the database
 */
async function saveCoupon(coupon) {
    return new Promise((resolve, reject) => {
        const transaction = getTransaction(STORES.COUPONS, 'readwrite');
        const store = transaction.objectStore(STORES.COUPONS);

        // Generate ID if not present
        if (!coupon.id) {
            coupon.id = `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Set upload date if not present
        if (!coupon.uploadDate) {
            coupon.uploadDate = new Date().toISOString();
        }

        const request = store.put(coupon);

        request.onsuccess = () => {
            console.log('Coupon saved successfully:', coupon.id);
            resolve(coupon);
        };

        request.onerror = () => {
            console.error('Failed to save coupon:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Get all coupons, optionally only active ones
 */
async function getCoupons(activeOnly = false) {
    return new Promise((resolve, reject) => {
        const transaction = getTransaction(STORES.COUPONS, 'readonly');
        const store = transaction.objectStore(STORES.COUPONS);
        const request = store.getAll();

        request.onsuccess = () => {
            let coupons = request.result;

            // Filter active coupons (not expired)
            if (activeOnly) {
                const today = new Date();
                coupons = coupons.filter(coupon => {
                    if (!coupon.validUntil) return true;
                    return new Date(coupon.validUntil) >= today;
                });
            }

            resolve(coupons);
        };

        request.onerror = () => {
            console.error('Failed to get coupons:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Get a specific coupon by ID
 */
async function getCouponById(id) {
    return new Promise((resolve, reject) => {
        const transaction = getTransaction(STORES.COUPONS, 'readonly');
        const store = transaction.objectStore(STORES.COUPONS);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error('Failed to get coupon:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Delete a coupon by ID
 */
async function deleteCoupon(id) {
    return new Promise((resolve, reject) => {
        const transaction = getTransaction(STORES.COUPONS, 'readwrite');
        const store = transaction.objectStore(STORES.COUPONS);
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log('Coupon deleted successfully:', id);
            resolve(true);
        };

        request.onerror = () => {
            console.error('Failed to delete coupon:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Get a setting value by key
 */
async function getSetting(key, defaultValue = null) {
    return new Promise((resolve, reject) => {
        const transaction = getTransaction(STORES.SETTINGS, 'readonly');
        const store = transaction.objectStore(STORES.SETTINGS);
        const request = store.get(key);

        request.onsuccess = () => {
            const result = request.result;
            resolve(result ? result.value : defaultValue);
        };

        request.onerror = () => {
            console.error('Failed to get setting:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Set a setting value
 */
async function setSetting(key, value) {
    return new Promise((resolve, reject) => {
        const transaction = getTransaction(STORES.SETTINGS, 'readwrite');
        const store = transaction.objectStore(STORES.SETTINGS);
        const request = store.put({ key, value });

        request.onsuccess = () => {
            console.log('Setting saved:', key, value);
            resolve(value);
        };

        request.onerror = () => {
            console.error('Failed to save setting:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Get all data for export
 */
async function exportAllData() {
    const receipts = await getReceipts();
    const coupons = await getCoupons();
    const settings = await getAllSettings();

    return {
        version: DB_VERSION,
        exportDate: new Date().toISOString(),
        receipts,
        coupons,
        settings
    };
}

/**
 * Get all settings
 */
async function getAllSettings() {
    return new Promise((resolve, reject) => {
        const transaction = getTransaction(STORES.SETTINGS, 'readonly');
        const store = transaction.objectStore(STORES.SETTINGS);
        const request = store.getAll();

        request.onsuccess = () => {
            const settings = {};
            request.result.forEach(item => {
                settings[item.key] = item.value;
            });
            resolve(settings);
        };

        request.onerror = () => {
            console.error('Failed to get settings:', request.error);
            reject(request.error);
        };
    });
}

/**
 * Import data from backup
 */
async function importData(data) {
    try {
        // Import receipts
        if (data.receipts && Array.isArray(data.receipts)) {
            for (const receipt of data.receipts) {
                await saveReceipt(receipt);
            }
        }

        // Import coupons
        if (data.coupons && Array.isArray(data.coupons)) {
            for (const coupon of data.coupons) {
                await saveCoupon(coupon);
            }
        }

        // Import settings
        if (data.settings && typeof data.settings === 'object') {
            for (const [key, value] of Object.entries(data.settings)) {
                await setSetting(key, value);
            }
        }

        console.log('Data imported successfully');
        return true;
    } catch (error) {
        console.error('Failed to import data:', error);
        throw error;
    }
}

/**
 * Clear all data from the database
 */
async function clearAllData() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.RECEIPTS, STORES.COUPONS, STORES.SETTINGS], 'readwrite');

        let completedStores = 0;
        const totalStores = 3;

        const checkComplete = () => {
            completedStores++;
            if (completedStores === totalStores) {
                console.log('All data cleared successfully');
                resolve(true);
            }
        };

        // Clear receipts
        const receiptsRequest = transaction.objectStore(STORES.RECEIPTS).clear();
        receiptsRequest.onsuccess = checkComplete;
        receiptsRequest.onerror = () => reject(receiptsRequest.error);

        // Clear coupons
        const couponsRequest = transaction.objectStore(STORES.COUPONS).clear();
        couponsRequest.onsuccess = checkComplete;
        couponsRequest.onerror = () => reject(couponsRequest.error);

        // Clear settings
        const settingsRequest = transaction.objectStore(STORES.SETTINGS).clear();
        settingsRequest.onsuccess = checkComplete;
        settingsRequest.onerror = () => reject(settingsRequest.error);
    });
}

/**
 * Get database statistics
 */
async function getStats() {
    const receipts = await getReceipts();
    const coupons = await getCoupons();

    const totalItems = receipts.reduce((sum, receipt) => {
        return sum + (receipt.items ? receipt.items.length : 0);
    }, 0);

    return {
        receiptCount: receipts.length,
        couponCount: coupons.length,
        itemCount: totalItems
    };
}

/**
 * Mark an adjustment as claimed
 * @param {string} adjustmentKey - Unique key for the adjustment (receiptId_itemNumber_couponId)
 * @param {number} amount - Amount claimed
 */
async function markAdjustmentClaimed(adjustmentKey, amount) {
    const claimedAdjustments = await getSetting('claimedAdjustments', {});
    claimedAdjustments[adjustmentKey] = {
        claimedDate: new Date().toISOString(),
        amount: amount
    };
    await setSetting('claimedAdjustments', claimedAdjustments);
}

/**
 * Check if an adjustment has been claimed
 * @param {string} adjustmentKey - Unique key for the adjustment
 * @returns {Object|null} Claimed info or null if not claimed
 */
async function isAdjustmentClaimed(adjustmentKey) {
    const claimedAdjustments = await getSetting('claimedAdjustments', {});
    return claimedAdjustments[adjustmentKey] || null;
}

/**
 * Get all claimed adjustments
 * @returns {Object} Object with claimed adjustment keys and info
 */
async function getAllClaimedAdjustments() {
    return await getSetting('claimedAdjustments', {});
}

/**
 * Calculate lifetime total saved (all claimed adjustments)
 * @returns {number} Total amount claimed
 */
async function getLifetimeSavings() {
    const claimedAdjustments = await getSetting('claimedAdjustments', {});
    return Object.values(claimedAdjustments).reduce((sum, claim) => sum + (claim.amount || 0), 0);
}
