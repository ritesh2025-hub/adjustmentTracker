// ui.js - UI rendering and event handling
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showModal(content) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-body').innerHTML = content;
    modal.style.display = 'flex';
}

function hideModal() {
    document.getElementById('modal').style.display = 'none';
}

async function renderReceiptList() {
    const type = document.getElementById('purchase-type').value;
    const filter = document.getElementById('purchase-filter').value;

    if (type === 'coupons') {
        await renderCouponList();
        return;
    }

    let receipts = await getReceipts();

    if (filter !== 'all') {
        const daysAgo = parseInt(filter);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        receipts = receipts.filter(r => new Date(r.purchaseDate) >= startDate);
    }

    const listEl = document.getElementById('purchases-list');
    const emptyEl = document.getElementById('no-purchases');
    const emptyMsg = document.getElementById('no-purchases-message');

    if (receipts.length === 0) {
        listEl.innerHTML = '';
        emptyMsg.textContent = 'No receipts found';
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = receipts.map(r => {
        const formatted = formatReceipt(r);
        return '<div class="card"><div class="card-header"><span class="card-title">' + formatted.purchaseDateFormatted + '</span><span class="card-date">' + formatted.totalFormatted + '</span></div><div class="card-body"><div class="card-info"><span>Items:</span><span>' + (r.items ? r.items.length : 0) + '</span></div></div><div class="card-actions"><button class="btn btn-secondary" onclick="viewReceiptDetails(\'' + r.id + '\')">View</button><button class="btn btn-secondary" onclick="editReceiptDate(\'' + r.id + '\')">Edit Date</button><button class="btn btn-danger" onclick="deleteReceiptConfirm(\'' + r.id + '\')">Delete</button></div></div>';
    }).join('');
}

async function renderCouponList() {
    const filter = document.getElementById('purchase-filter').value;
    let coupons = await getCoupons();

    if (filter !== 'all') {
        const daysAgo = parseInt(filter);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        coupons = coupons.filter(c => new Date(c.uploadDate) >= startDate);
    }

    const listEl = document.getElementById('purchases-list');
    const emptyEl = document.getElementById('no-purchases');
    const emptyMsg = document.getElementById('no-purchases-message');

    if (coupons.length === 0) {
        listEl.innerHTML = '';
        emptyMsg.textContent = 'No coupons found';
        emptyEl.style.display = 'block';
        return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = coupons.map(c => {
        const formatted = formatCoupon(c);
        return '<div class="card"><div class="card-header"><span class="card-title">Valid until ' + formatted.validUntilFormatted + '</span></div><div class="card-body"><div class="card-info"><span>Items:</span><span>' + (c.items ? c.items.length : 0) + '</span></div></div><div class="card-actions"><button class="btn btn-secondary" onclick="viewCouponDetails(\'' + c.id + '\')">View</button><button class="btn btn-danger" onclick="deleteCouponConfirm(\'' + c.id + '\')">Delete</button></div></div>';
    }).join('');
}

async function viewReceiptDetails(receiptId) {
    const receipt = await getReceiptById(receiptId);
    if (!receipt) return;
    const formatted = formatReceipt(receipt);
    const itemsHtml = formatted.items.map(item => '<tr><td>' + item.itemNumber + '</td><td>' + (item.description || '-') + '</td><td>' + item.finalPriceFormatted + '</td></tr>').join('');
    const content = '<h2>Receipt Details</h2><p><strong>Date:</strong> ' + formatted.purchaseDateFormatted + '</p><table class="items-table"><thead><tr><th>Item</th><th>Description</th><th>Price</th></tr></thead><tbody>' + itemsHtml + '</tbody></table><div class="totals-section"><div class="total-row"><span>Total:</span><span>' + formatted.totalFormatted + '</span></div></div>';
    showModal(content);
}

async function deleteReceiptConfirm(receiptId) {
    if (confirm('Delete this receipt?')) {
        await deleteReceipt(receiptId);
        showToast('Receipt deleted', 'success');
        renderReceiptList();
        renderComparisons();
    }
}

async function editReceiptDate(receiptId) {
    const receipt = await getReceiptById(receiptId);
    if (!receipt) return;

    const content = '<h2>Edit Receipt Date</h2>' +
        '<div class="form-group">' +
        '<label for="edit-receipt-date">Purchase Date:</label>' +
        '<input type="date" id="edit-receipt-date" class="form-control" value="' + receipt.purchaseDate + '">' +
        '</div>' +
        '<div class="action-buttons" style="margin-top: 20px;">' +
        '<button class="btn btn-success" onclick="saveReceiptDate(\'' + receiptId + '\')">Save</button>' +
        '<button class="btn btn-cancel" onclick="hideModal()">Cancel</button>' +
        '</div>';

    showModal(content);
}

async function saveReceiptDate(receiptId) {
    const newDate = document.getElementById('edit-receipt-date').value;
    if (!newDate) {
        showToast('Please enter a valid date', 'error');
        return;
    }

    const receipt = await getReceiptById(receiptId);
    if (!receipt) return;

    receipt.purchaseDate = newDate;
    await saveReceipt(receipt);

    hideModal();
    showToast('Receipt date updated', 'success');
    renderReceiptList();
    renderComparisons();
}

async function viewCouponDetails(couponId) {
    const coupon = await getCouponById(couponId);
    if (!coupon) return;
    const formatted = formatCoupon(coupon);

    const itemsHtml = formatted.items.map(item => '<tr><td>' + item.itemNumber + '</td><td>' + (item.description || '-') + '</td><td>' + item.salePriceFormatted + '</td></tr>').join('');
    const content = '<h2>Coupon Details</h2><p><strong>Valid From:</strong> ' + formatted.validFromFormatted + '</p><p><strong>Valid Until:</strong> ' + formatted.validUntilFormatted + '</p><table class="items-table"><thead><tr><th>Item</th><th>Description</th><th>Price</th></tr></thead><tbody>' + itemsHtml + '</tbody></table>';
    showModal(content);
}

async function deleteCouponConfirm(couponId) {
    if (confirm('Delete this coupon?')) {
        await deleteCoupon(couponId);
        showToast('Coupon deleted', 'success');
        renderCouponList();
        renderComparisons();
    }
}

async function viewCouponImage(couponId, itemNumber) {
    // First try to get coupon from IndexedDB (locally uploaded coupons)
    let coupon = await getCouponById(couponId);

    // If not found locally, check monthly coupons loaded from GitHub
    if (!coupon) {
        const monthlyCoupons = await loadMonthlyCouponsToMemory();
        coupon = monthlyCoupons.find(c => c.id === couponId);
    }

    if (!coupon) {
        showToast('Coupon not found', 'error');
        return;
    }

    // Find the specific item
    const item = coupon.items.find(i => i.itemNumber === itemNumber);

    // Build modal content
    let content = '<h2>Coupon Details</h2>';
    content += '<p><strong>Item #' + itemNumber + '</strong></p>';
    if (item && item.description) {
        content += '<p>' + item.description + '</p>';
    }
    content += '<p><strong>Valid:</strong> ' + formatDate(coupon.validFrom) + ' - ' + formatDate(coupon.validUntil) + '</p>';

    if (item) {
        if (item.salePrice && item.salePrice > 0) {
            content += '<p><strong>Sale Price:</strong> $' + item.salePrice.toFixed(2) + '</p>';
        }
        if (item.discount && item.discount > 0) {
            content += '<p><strong>Discount:</strong> $' + item.discount.toFixed(2) + ' OFF</p>';
        }
    }

    // Show coupon image if available
    if (coupon.imageData) {
        content += '<div style="margin-top: 20px;"><img src="' + coupon.imageData + '" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;" alt="Coupon image"></div>';
    } else if (coupon.imageUrl) {
        content += '<div style="margin-top: 20px;"><img src="' + coupon.imageUrl + '" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;" alt="Coupon image"></div>';
    } else {
        // No image available - show link to Costco coupon book
        const month = coupon.validUntil.substring(0, 7); // Get YYYY-MM
        content += '<div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 4px;">';
        content += '<p><strong>💡 Tip:</strong> View the full Costco coupon book online to see this item.</p>';
        content += '<p>Valid period: ' + formatDate(coupon.validFrom) + ' - ' + formatDate(coupon.validUntil) + '</p>';
        content += '</div>';
    }

    showModal(content);
}

async function toggleShowExpired() {
    const checkbox = document.getElementById('show-expired-toggle');
    await setSetting('showExpiredAdjustments', checkbox.checked);
    await renderComparisons();
}

async function renderComparisons() {
    console.log('🔄 renderComparisons called - View Coupon button should appear');
    const adjustmentWindow = await getSetting('adjustmentWindow', 30);
    const showExpired = await getSetting('showExpiredAdjustments', false);

    // Update checkbox state
    const checkbox = document.getElementById('show-expired-toggle');
    if (checkbox) {
        checkbox.checked = showExpired;
    }

    const receipts = await getReceipts();
    console.log('📝 Found receipts:', receipts.length);

    // Load coupons from GitHub monthly files instead of IndexedDB
    const coupons = await loadMonthlyCouponsToMemory();

    let adjustments = calculatePriceAdjustments(receipts, coupons, adjustmentWindow);

    // Sort by purchase date ascending (oldest first)
    adjustments.sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));

    // Filter out expired if showExpired is false
    if (!showExpired) {
        adjustments = adjustments.filter(adj => adj.eligible);
    }

    const listEl = document.getElementById('comparisons-list');
    console.log('💰 Found adjustments:', adjustments.length);
    if (adjustments.length === 0) {
        document.getElementById('comparison-summary').style.display = 'none';
        listEl.innerHTML = '';
        document.getElementById('no-comparisons').style.display = 'block';
        return;
    }

    console.log('✅ Rendering', adjustments.length, 'adjustment cards with View Coupon buttons');
    document.getElementById('no-comparisons').style.display = 'none';
    document.getElementById('comparison-summary').style.display = 'block';

    const stats = getAdjustmentStats(adjustments);
    document.getElementById('total-adjustment').textContent = formatCurrency(stats.totalSavings);
    document.getElementById('eligible-count').textContent = stats.eligible;

    listEl.innerHTML = adjustments.map(adj => {
        const formatted = formatAdjustment(adj);
        const statusIndicator = adj.eligible ? '🟢' : '⚪';
        const cardClass = adj.eligible ? 'comparison-card' : 'comparison-card expired';

        // Build different display for discount-only vs exact price
        let priceComparisonHtml = '';
        let adjustmentLabelHtml = '';

        if (adj.isDiscountOnly) {
            // Discount-only: Show message about checking store
            priceComparisonHtml =
                '<div class="comparison-detail"><div class="comparison-detail-label">You paid:</div><div class="comparison-detail-value">' + formatted.pricePaidFormatted + '</div></div>' +
                '<div class="comparison-detail"><div class="comparison-detail-label">Coupon discount:</div><div class="comparison-detail-value" style="color: #ffc107; font-weight: bold;">$' + adj.discountAmount.toFixed(2) + ' OFF</div></div>';
            adjustmentLabelHtml = 'Potential savings (check store for current price)';
        } else {
            // Exact price: Show normal comparison
            priceComparisonHtml =
                '<div class="comparison-detail"><div class="comparison-detail-label">You paid:</div><div class="comparison-detail-value">' + formatted.pricePaidFormatted + '</div></div>' +
                '<div class="comparison-detail"><div class="comparison-detail-label">Current price:</div><div class="comparison-detail-value">' + formatted.currentPriceFormatted + '</div></div>';
            adjustmentLabelHtml = 'Adjustment';
        }

        return '<div class="' + cardClass + '"><div class="comparison-header"><span class="status-indicator">' + statusIndicator + '</span><div class="comparison-item-title">Item #' + adj.itemNumber + (adj.description ? ' - ' + adj.description : '') + '</div></div><div class="comparison-details">' + priceComparisonHtml + '<div class="comparison-detail"><div class="comparison-detail-label">' + adjustmentLabelHtml + ':</div><div class="comparison-detail-value adjustment-amount">' + formatted.adjustmentFormatted + '</div><div class="comparison-detail-label">' + formatted.daysRemainingText + '</div></div></div><div class="card-actions" style="margin-top: 10px;"><button class="btn btn-secondary" onclick="viewCouponImage(\'' + adj.couponId + '\', \'' + adj.itemNumber + '\')">View Coupon</button></div></div>';
    }).join('');
}

async function renderStats() {
    const stats = await getStats();
    const receipts = await getReceipts();
    const coupons = await getCoupons();
    const adjustmentWindow = await getSetting('adjustmentWindow', 30);
    const adjustments = calculatePriceAdjustments(receipts, coupons, adjustmentWindow);
    const totalSavings = calculateTotalSavings(adjustments, true);
    
    document.getElementById('stat-receipts').textContent = stats.receiptCount;
    document.getElementById('stat-coupons').textContent = stats.couponCount;
    document.getElementById('stat-items').textContent = stats.itemCount;
    document.getElementById('stat-savings').textContent = formatCurrency(totalSavings);
}

async function exportData() {
    try {
        const data = await exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'receipt-tracker-backup-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported!', 'success');
    } catch (error) {
        showToast('Export failed: ' + error.message, 'error');
    }
}

async function importDataFromFile(file) {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importData(data);
        showToast('Data imported!', 'success');
        renderReceiptList();
        renderComparisons();
        renderStats();
    } catch (error) {
        showToast('Import failed: ' + error.message, 'error');
    }
}

async function clearAllDataConfirm() {
    if (confirm('Delete ALL data? This cannot be undone!') && confirm('Really delete everything?')) {
        await clearAllData();
        showToast('All data cleared', 'success');
        renderReceiptList();
        renderComparisons();
        renderStats();
    }
}

async function saveSettings() {
    const adjustmentWindow = parseInt(document.getElementById('adjustment-window').value);
    const defaultStore = document.getElementById('default-store').value;
    await setSetting('adjustmentWindow', adjustmentWindow);
    await setSetting('defaultStore', defaultStore);
    showToast('Settings saved!', 'success');
    renderComparisons();
}

async function loadSettings() {
    const adjustmentWindow = await getSetting('adjustmentWindow', 30);
    const defaultStore = await getSetting('defaultStore', '');
    document.getElementById('adjustment-window').value = adjustmentWindow;
    document.getElementById('default-store').value = defaultStore;
}
