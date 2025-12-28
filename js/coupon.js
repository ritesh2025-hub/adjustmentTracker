// coupon.js - Coupon parsing and management

// Regular expression patterns for parsing coupons
const COUPON_PATTERNS = {
    // Date formats
    date: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g,

    // Item numbers
    itemNumber: /\b(\d{4,12})\b/g,

    // Prices
    price: /\$?\s*\d+\.\d{2}/g,

    // Keywords
    validThru: /valid\s*(through|thru|until|to)|expires?/i,
    sale: /sale|now|price|save/i
};

/**
 * Parse OCR text from a coupon
 * @param {string} ocrText - Raw text from OCR
 * @returns {Object} Parsed coupon data
 */
function parseCoupon(ocrText) {
    const coupon = {
        id: null,
        uploadDate: new Date().toISOString(),
        validFrom: extractValidFromDate(ocrText),
        validUntil: extractValidUntilDate(ocrText),
        items: [],
        rawText: ocrText
    };

    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line);

    let currentItem = null;
    let currentDescription = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip date/validity lines
        if (COUPON_PATTERNS.validThru.test(line) || /valid/i.test(line)) {
            continue;
        }

        // Look for discount amounts (e.g., $10 OFF, $7 OFF)
        const discountMatch = line.match(/\$\s*(\d+(?:\.\d{2})?)\s*OFF/i);
        if (discountMatch) {
            // This line has a discount, look ahead for item number
            const discount = parseFloat(discountMatch[1]);

            // Look in next few lines for item number
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const nextLine = lines[j];

                // Match "Item" followed by number
                const itemMatch = nextLine.match(/Item\s+(\d{6,12})/i);
                if (itemMatch) {
                    const itemNumber = itemMatch[1];

                    // Get description from lines between discount and item number
                    let description = '';
                    for (let k = i + 1; k < j; k++) {
                        const descLine = lines[k].replace(/Item\s+\d+/i, '').trim();
                        if (descLine && !descLine.match(/LIMIT|^\d+$/)) {
                            description += ' ' + descLine;
                        }
                    }
                    description = description.trim() || 'Unknown Item';

                    coupon.items.push({
                        itemNumber: itemNumber,
                        description: description,
                        salePrice: 0,  // We'll set this to 0 since we only have discount
                        discount: discount
                    });

                    i = j;  // Skip ahead
                    break;
                }
            }
            continue;
        }

        // Alternative: Look for standalone item numbers (Item XXXXXXX)
        const itemMatch = line.match(/Item\s+(\d{6,12})/i);
        if (itemMatch) {
            const itemNumber = itemMatch[1];

            // Look backwards for price/discount
            let price = 0;
            let discount = 0;

            for (let j = Math.max(0, i - 5); j < i; j++) {
                const prevLine = lines[j];

                // Check for discount
                const discMatch = prevLine.match(/\$\s*(\d+(?:\.\d{2})?)\s*OFF/i);
                if (discMatch) {
                    discount = parseFloat(discMatch[1]);
                }

                // Check for regular price
                const priceMatch = prevLine.match(/\$\s*(\d+\.\d{2})(?!\s*OFF)/);
                if (priceMatch) {
                    price = parseFloat(priceMatch[1]);
                }
            }

            // Get description from previous line(s)
            let description = '';
            for (let j = Math.max(0, i - 3); j < i; j++) {
                const descLine = lines[j].replace(/\$.*/, '').replace(/Item.*/, '').trim();
                if (descLine && descLine.length > 2 && !descLine.match(/LIMIT|^\d+$/)) {
                    description += ' ' + descLine;
                }
            }
            description = description.trim() || 'Unknown Item';

            coupon.items.push({
                itemNumber: itemNumber,
                description: description,
                salePrice: price > 0 ? price : 0,
                discount: discount
            });
        }
    }

    return coupon;
}

/**
 * Extract valid from date from coupon text
 */
function extractValidFromDate(text) {
    // Default to today
    return new Date().toISOString().split('T')[0];
}

/**
 * Extract valid until date from coupon text
 */
function extractValidUntilDate(text) {
    const lines = text.split('\n');

    // Look for "Valid Month Day - Month Day, Year" format
    const validDatePattern = /Valid\s+([A-Za-z]+)\.?\s+(\d{1,2})\s*[-–]\s*([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})/i;
    const match = text.match(validDatePattern);

    if (match) {
        const endMonth = match[3];
        const endDay = match[4];
        const year = match[5];

        // Convert month name to number
        const monthMap = {
            'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
            'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7,
            'aug': 8, 'august': 8, 'sep': 9, 'september': 9, 'oct': 10, 'october': 10,
            'nov': 11, 'november': 11, 'dec': 12, 'december': 12
        };

        const monthNum = monthMap[endMonth.toLowerCase()];
        if (monthNum) {
            const date = new Date(parseInt(year), monthNum - 1, parseInt(endDay));
            return date.toISOString().split('T')[0];
        }
    }

    // Try standard date format
    for (const line of lines) {
        if (COUPON_PATTERNS.validThru.test(line) || /valid/i.test(line)) {
            const dateMatches = line.match(COUPON_PATTERNS.date);
            if (dateMatches && dateMatches.length > 0) {
                return parseDateString(dateMatches[dateMatches.length - 1]);
            }
        }
    }

    // Default to 30 days from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    return futureDate.toISOString().split('T')[0];
}

/**
 * Parse date string to ISO format
 */
function parseDateString(dateStr) {
    const parts = dateStr.split(/[\/\-\.]/);

    let month = parseInt(parts[0]);
    let day = parseInt(parts[1]);
    let year = parseInt(parts[2]);

    // Handle 2-digit years
    if (year < 100) {
        year += year > 50 ? 1900 : 2000;
    }

    const date = new Date(year, month - 1, day);
    return date.toISOString().split('T')[0];
}

/**
 * Validate coupon data
 */
function validateCoupon(coupon) {
    const errors = [];

    if (!coupon.validUntil) {
        errors.push('Valid until date is required');
    }

    if (!coupon.items || coupon.items.length === 0) {
        errors.push('At least one item is required');
    }

    coupon.items.forEach((item, index) => {
        if (!item.itemNumber || item.itemNumber.length < 4) {
            errors.push(`Item ${index + 1}: Item number must be at least 4 digits`);
        }

        // Allow discount-only coupons (no sale price required)
        // Just need either a sale price OR a discount amount
        const hasDiscount = item.discount && item.discount > 0;
        const hasPrice = item.salePrice && item.salePrice > 0;

        if (!hasPrice && !hasDiscount) {
            errors.push(`Item ${index + 1}: Must have either a sale price or discount amount`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Format coupon for display
 */
function formatCoupon(coupon) {
    return {
        ...coupon,
        validFromFormatted: formatDate(coupon.validFrom),
        validUntilFormatted: formatDate(coupon.validUntil),
        items: coupon.items.map(item => ({
            ...item,
            salePriceFormatted: formatCurrency(item.salePrice)
        }))
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
