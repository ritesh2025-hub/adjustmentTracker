// receipt.js - Receipt parsing and management

// Regular expression patterns for parsing receipts
const RECEIPT_PATTERNS = {
    // Date formats: 12/28/2024, 12-28-2024, 12.28.2024
    date: /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g,

    // Item numbers (4-12 digits, possibly with spaces or dashes)
    itemNumber: /\b(\d{4,12})\b/g,

    // Prices (with or without $, including negatives for discounts)
    price: /(-?\$?\s*\d+\.\d{2})/g,

    // Line item: item number + description + price
    lineItem: /(\d{4,12})\s+([A-Z0-9\s\-\/\.\,]+?)\s+(\$?\s*\d+\.\d{2})/gi,

    // Keywords
    subtotal: /sub\s*total|subtotal/i,
    tax: /\btax\b/i,
    total: /\btotal\b/i,
    discount: /discount|savings|save|off/i
};

/**
 * Parse OCR text from a receipt
 * @param {string} ocrText - Raw text from OCR
 * @returns {Object} Parsed receipt data
 */
function parseReceipt(ocrText) {
    const receipt = {
        id: null,
        uploadDate: new Date().toISOString(),
        purchaseDate: extractPurchaseDate(ocrText),
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        rawText: ocrText
    };

    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line);

    let itemNumber = null;
    let description = '';
    let lastPrice = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for total lines
        if (RECEIPT_PATTERNS.subtotal.test(line)) {
            receipt.subtotal = extractPrice(line) || receipt.subtotal;
            continue;
        }
        if (RECEIPT_PATTERNS.tax.test(line)) {
            receipt.tax = extractPrice(line) || receipt.tax;
            continue;
        }
        if (RECEIPT_PATTERNS.total.test(line)) {
            const totalPrice = extractPrice(line);
            if (totalPrice) {
                receipt.total = totalPrice;
            }
            continue;
        }

        // Try to match line item pattern
        const lineItemMatch = line.match(/(\d{4,12})\s+([A-Z0-9\s\-\/\.\,]+?)\s+(\$?\s*\d+\.\d{2})/i);

        if (lineItemMatch) {
            // Full line item found
            const item = {
                itemNumber: lineItemMatch[1],
                description: lineItemMatch[2].trim(),
                finalPrice: parseFloat(lineItemMatch[3].replace(/[$\s]/g, '')),
                discount: 0,
                lineNumber: i + 1
            };
            receipt.items.push(item);
            itemNumber = null;
            description = '';
        } else {
            // Check for item number
            const itemNumMatch = line.match(/^\d{4,12}$/);
            if (itemNumMatch) {
                itemNumber = itemNumMatch[0];
                continue;
            }

            // Check for price
            const priceMatch = line.match(/(-?\$?\s*\d+\.\d{2})$/);
            if (priceMatch) {
                const price = parseFloat(priceMatch[1].replace(/[$\s]/g, ''));

                if (itemNumber) {
                    // We have item number and price, create item
                    const item = {
                        itemNumber: itemNumber,
                        description: description.trim(),
                        finalPrice: price,
                        discount: 0,
                        lineNumber: i + 1
                    };
                    receipt.items.push(item);
                    itemNumber = null;
                    description = '';
                } else if (RECEIPT_PATTERNS.discount.test(line)) {
                    // This is a discount
                    if (receipt.items.length > 0) {
                        const lastItem = receipt.items[receipt.items.length - 1];
                        lastItem.discount = price;
                        lastItem.finalPrice += price; // Price is already negative
                    }
                }
                lastPrice = price;
            } else if (itemNumber) {
                // This line is part of description
                description += ' ' + line;
            }
        }
    }

    // Calculate totals if not found
    if (receipt.items.length > 0 && receipt.total === 0) {
        receipt.subtotal = receipt.items.reduce((sum, item) => sum + item.finalPrice, 0);
        receipt.total = receipt.subtotal + receipt.tax;
    }

    return receipt;
}

/**
 * Extract purchase date from OCR text
 */
function extractPurchaseDate(text) {
    const matches = text.match(RECEIPT_PATTERNS.date);

    if (matches && matches.length > 0) {
        // Take the first date found
        const dateStr = matches[0];
        const parts = dateStr.split(/[\/\-\.]/);

        let month = parseInt(parts[0]);
        let day = parseInt(parts[1]);
        let year = parseInt(parts[2]);

        // Handle 2-digit years
        if (year < 100) {
            year += year > 50 ? 1900 : 2000;
        }

        // Create date object
        const date = new Date(year, month - 1, day);

        // Return ISO date string (YYYY-MM-DD)
        return date.toISOString().split('T')[0];
    }

    // Default to today
    return new Date().toISOString().split('T')[0];
}

/**
 * Extract price from a line of text
 */
function extractPrice(text) {
    const match = text.match(/(-?\$?\s*\d+\.\d{2})/);
    if (match) {
        return parseFloat(match[1].replace(/[$\s]/g, ''));
    }
    return null;
}

/**
 * Validate receipt data
 */
function validateReceipt(receipt) {
    const errors = [];

    if (!receipt.purchaseDate) {
        errors.push('Purchase date is required');
    }

    if (!receipt.items || receipt.items.length === 0) {
        errors.push('At least one item is required');
    }

    receipt.items.forEach((item, index) => {
        if (!item.itemNumber || item.itemNumber.length < 4) {
            errors.push(`Item ${index + 1}: Item number must be at least 4 digits`);
        }

        if (typeof item.finalPrice !== 'number' || isNaN(item.finalPrice)) {
            errors.push(`Item ${index + 1}: Invalid price`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Format receipt for display
 */
function formatReceipt(receipt) {
    return {
        ...receipt,
        purchaseDateFormatted: formatDate(receipt.purchaseDate),
        subtotalFormatted: formatCurrency(receipt.subtotal),
        taxFormatted: formatCurrency(receipt.tax),
        totalFormatted: formatCurrency(receipt.total),
        items: receipt.items.map(item => ({
            ...item,
            finalPriceFormatted: formatCurrency(item.finalPrice),
            discountFormatted: item.discount ? formatCurrency(item.discount) : null
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
    return `$${Math.abs(amount).toFixed(2)}${amount < 0 ? ' (discount)' : ''}`;
}
