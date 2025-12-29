// coupon-manager.js - Centralized coupon management with monthly JSON files

/**
 * Get current and next month file names
 */
function getMonthlyFileNames() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

    return {
        current: `coupons/${currentMonth}.json`,
        next: `coupons/${nextMonth}.json`,
        currentMonth,
        nextMonth
    };
}

/**
 * Load coupons from monthly JSON files (current and next month)
 * @param {boolean} bustCache - If true, adds timestamp to force fresh fetch
 */
async function loadMonthlyCoupons(bustCache = false) {
    const { current, next } = getMonthlyFileNames();
    const allCoupons = [];

    // Add cache-busting parameter if requested
    const cacheBuster = bustCache ? `?t=${Date.now()}` : '';

    try {
        // Load current month
        const currentResponse = await fetch(current + cacheBuster);
        if (currentResponse.ok) {
            const currentData = await currentResponse.json();
            if (currentData.coupons) {
                allCoupons.push(...currentData.coupons);
                console.log(`✅ Loaded ${currentData.coupons.length} coupons from current month`);
            }
        }
    } catch (error) {
        console.warn('Could not load current month coupons:', error);
    }

    try {
        // Load next month (for coupons that span month boundaries)
        const nextResponse = await fetch(next + cacheBuster);
        if (nextResponse.ok) {
            const nextData = await nextResponse.json();
            if (nextData.coupons) {
                allCoupons.push(...nextData.coupons);
                console.log(`✅ Loaded ${nextData.coupons.length} coupons from next month`);
            }
        }
    } catch (error) {
        console.warn('Could not load next month coupons:', error);
    }

    return allCoupons;
}

/**
 * Admin: Generate monthly JSON file content from a new coupon
 */
function generateMonthlyJSON(coupon) {
    const validUntil = new Date(coupon.validUntil);
    const month = `${validUntil.getFullYear()}-${String(validUntil.getMonth() + 1).padStart(2, '0')}`;
    const startDate = `${validUntil.getFullYear()}-${String(validUntil.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(validUntil.getFullYear(), validUntil.getMonth() + 1, 0).getDate();
    const endDate = `${validUntil.getFullYear()}-${String(validUntil.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Generate unique ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    coupon.id = `coupon_${month.replace('-', '_')}_${timestamp}_${randomSuffix}`;

    return {
        month,
        fileName: `${month}.json`,
        data: {
            month,
            startDate,
            endDate,
            coupons: [coupon]  // Single coupon - admin will merge manually
        }
    };
}

/**
 * Admin: Download monthly JSON file
 */
function downloadMonthlyJSON(fileName, data) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Admin: Show instructions for uploading to GitHub
 */
function showUploadInstructions(fileName) {
    const instructions = `
📤 Next Steps to Publish This Coupon:

1. **Download Complete**: You now have "${fileName}"

2. **Go to GitHub**:
   https://github.com/ritesh2025-hub/adjustmentTracker/tree/main/coupons

3. **Upload the file**:
   - Click "Add file" → "Upload files"
   - Drag "${fileName}" into the upload area
   - If file exists, it will ask to replace (that's OK!)
   - Click "Commit changes"

4. **Wait 2-3 minutes** for GitHub Pages to update

5. **All users will see this coupon automatically!**

📝 Note: If you're adding multiple coupons in the same month, you'll need to manually merge them into one JSON file.
    `.trim();

    alert(instructions);
}
