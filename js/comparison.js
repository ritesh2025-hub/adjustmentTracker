// comparison.js - Price comparison and adjustment calculation

/**
 * Calculate price adjustments by comparing receipts with current coupon prices
 * @param {Array} receipts - Array of receipt objects
 * @param {Array} coupons - Array of coupon objects
 * @param {number} adjustmentWindowDays - Number of days after purchase to allow adjustments
 * @returns {Array} Array of price adjustment opportunities
 */
function calculatePriceAdjustments(receipts, coupons, adjustmentWindowDays = 30) {
    const today = new Date();
    const adjustmentOpportunities = [];

    // Build item number index from coupons (use lowest price if multiple coupons have same item)
    const couponPrices = {};
    coupons.forEach(coupon => {
        if (!coupon.items) return;

        coupon.items.forEach(item => {
            const hasActualPrice = item.salePrice && item.salePrice > 0;
            const hasDiscount = item.discount && item.discount > 0;

            if (!hasActualPrice && !hasDiscount) return; // Skip invalid items

            // Store both price and discount info
            if (!couponPrices[item.itemNumber]) {
                couponPrices[item.itemNumber] = {
                    price: hasActualPrice ? item.salePrice : null,
                    discount: hasDiscount ? item.discount : null,
                    couponId: coupon.id,
                    validUntil: coupon.validUntil,
                    description: item.description
                };
            } else {
                // If we have an actual price and it's lower, use it
                if (hasActualPrice && (!couponPrices[item.itemNumber].price || item.salePrice < couponPrices[item.itemNumber].price)) {
                    couponPrices[item.itemNumber].price = item.salePrice;
                    couponPrices[item.itemNumber].couponId = coupon.id;
                }
                // Track discount even if we don't know final price
                if (hasDiscount && (!couponPrices[item.itemNumber].discount || item.discount > couponPrices[item.itemNumber].discount)) {
                    couponPrices[item.itemNumber].discount = item.discount;
                }
            }
        });
    });

    // Check each receipt item against current coupon prices
    receipts.forEach(receipt => {
        if (!receipt.items) return;

        const purchaseDate = new Date(receipt.purchaseDate);
        const daysAgo = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));

        receipt.items.forEach(item => {
            const couponInfo = couponPrices[item.itemNumber];

            if (!couponInfo) return; // No matching coupon

            const eligible = daysAgo <= adjustmentWindowDays;
            const adjustmentDeadline = new Date(purchaseDate);
            adjustmentDeadline.setDate(adjustmentDeadline.getDate() + adjustmentWindowDays);

            // Case 1: Coupon has actual sale price - calculate exact adjustment
            if (couponInfo.price && item.finalPrice > couponInfo.price) {
                const adjustment = item.finalPrice - couponInfo.price;

                adjustmentOpportunities.push({
                    itemNumber: item.itemNumber,
                    description: item.description || couponInfo.description || 'Unknown Item',
                    pricePaid: item.finalPrice,
                    currentPrice: couponInfo.price,
                    adjustment: adjustment,
                    discountAmount: couponInfo.discount || null,
                    isDiscountOnly: false,
                    purchaseDate: receipt.purchaseDate,
                    daysAgo: daysAgo,
                    eligible: eligible,
                    adjustmentDeadline: adjustmentDeadline.toISOString().split('T')[0],
                    couponValidUntil: couponInfo.validUntil,
                    receiptId: receipt.id,
                    couponId: couponInfo.couponId
                });
            }
            // Case 2: Discount-only coupon (no final price known) - flag as potential adjustment
            else if (couponInfo.discount && !couponInfo.price) {
                // Estimate adjustment as the discount amount (best case scenario)
                const estimatedAdjustment = couponInfo.discount;

                adjustmentOpportunities.push({
                    itemNumber: item.itemNumber,
                    description: item.description || couponInfo.description || 'Unknown Item',
                    pricePaid: item.finalPrice,
                    currentPrice: null, // Unknown final price
                    adjustment: estimatedAdjustment, // Show discount as potential savings
                    discountAmount: couponInfo.discount,
                    isDiscountOnly: true, // Flag to display differently in UI
                    purchaseDate: receipt.purchaseDate,
                    daysAgo: daysAgo,
                    eligible: eligible,
                    adjustmentDeadline: adjustmentDeadline.toISOString().split('T')[0],
                    couponValidUntil: couponInfo.validUntil,
                    receiptId: receipt.id,
                    couponId: couponInfo.couponId
                });
            }
        });
    });

    // Sort by adjustment amount (highest first)
    return adjustmentOpportunities.sort((a, b) => b.adjustment - a.adjustment);
}

/**
 * Find matching coupon for a specific item number
 * @param {string} itemNumber - Item number to search for
 * @param {Array} coupons - Array of coupon objects
 * @returns {Object|null} Matching coupon item or null
 */
function findMatchingCoupon(itemNumber, coupons) {
    for (const coupon of coupons) {
        if (!coupon.items) continue;

        for (const item of coupon.items) {
            if (item.itemNumber === itemNumber) {
                return {
                    ...item,
                    couponId: coupon.id,
                    validUntil: coupon.validUntil
                };
            }
        }
    }
    return null;
}

/**
 * Check if a purchase is eligible for price adjustment
 * @param {string|Date} purchaseDate - Date of purchase
 * @param {number} windowDays - Adjustment window in days
 * @returns {boolean} True if eligible
 */
function isEligibleForAdjustment(purchaseDate, windowDays = 30) {
    const today = new Date();
    const purchase = new Date(purchaseDate);
    const daysAgo = Math.floor((today - purchase) / (1000 * 60 * 60 * 24));

    return daysAgo <= windowDays;
}

/**
 * Calculate total potential savings from all adjustments
 * @param {Array} adjustments - Array of adjustment opportunities
 * @param {boolean} eligibleOnly - Only count eligible adjustments
 * @returns {number} Total savings amount
 */
function calculateTotalSavings(adjustments, eligibleOnly = true) {
    return adjustments
        .filter(adj => !eligibleOnly || adj.eligible)
        .reduce((total, adj) => total + adj.adjustment, 0);
}

/**
 * Group adjustments by eligibility status
 * @param {Array} adjustments - Array of adjustment opportunities
 * @returns {Object} Object with eligible and expired arrays
 */
function groupByEligibility(adjustments) {
    return {
        eligible: adjustments.filter(adj => adj.eligible),
        expired: adjustments.filter(adj => !adj.eligible)
    };
}

/**
 * Format adjustment for display
 * @param {Object} adjustment - Adjustment opportunity object
 * @returns {Object} Formatted adjustment
 */
function formatAdjustment(adjustment) {
    return {
        ...adjustment,
        pricePaidFormatted: formatCurrency(adjustment.pricePaid),
        currentPriceFormatted: formatCurrency(adjustment.currentPrice),
        adjustmentFormatted: formatCurrency(adjustment.adjustment),
        purchaseDateFormatted: formatDate(adjustment.purchaseDate),
        adjustmentDeadlineFormatted: formatDate(adjustment.adjustmentDeadline),
        couponValidUntilFormatted: formatDate(adjustment.couponValidUntil),
        daysRemainingText: getDaysRemainingText(adjustment.adjustmentDeadline)
    };
}

/**
 * Format date as MM/DD/YYYY
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

/**
 * Format number as currency
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '$0.00';
    }
    return `$${amount.toFixed(2)}`;
}

/**
 * Get human-readable text for days remaining
 */
function getDaysRemainingText(deadlineStr) {
    const today = new Date();
    const deadline = new Date(deadlineStr);
    const daysRemaining = Math.floor((deadline - today) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
        return 'Expired';
    } else if (daysRemaining === 0) {
        return 'Expires today!';
    } else if (daysRemaining === 1) {
        return '1 day remaining';
    } else {
        return `${daysRemaining} days remaining`;
    }
}

/**
 * Get statistics about adjustments
 * @param {Array} adjustments - Array of adjustment opportunities
 * @returns {Object} Statistics object
 */
function getAdjustmentStats(adjustments) {
    const grouped = groupByEligibility(adjustments);

    return {
        total: adjustments.length,
        eligible: grouped.eligible.length,
        expired: grouped.expired.length,
        totalSavings: calculateTotalSavings(adjustments, true),
        potentialSavings: calculateTotalSavings(adjustments, false)
    };
}
