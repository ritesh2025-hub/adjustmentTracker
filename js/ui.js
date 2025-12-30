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
        await renderReceiptList();
        await renderComparisons();
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
    await renderReceiptList();
    await renderComparisons();
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
        await renderCouponList();
        await renderComparisons();
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

    // Load item-to-page mapping and get specific page image
    let itemData = null;
    try {
        const response = await fetch('coupons/item-to-page-mapping.json');
        const mapping = await response.json();
        const month = coupon.validUntil.substring(0, 7); // Get YYYY-MM format
        itemData = mapping[month] && mapping[month][itemNumber];

        if (itemData) {
            // Support both old string format and new object format
            const pageFilename = typeof itemData === 'string' ? itemData : itemData.page;
            const coords = typeof itemData === 'object' ? itemData.coords : null;

            const imageUrl = 'https://raw.githubusercontent.com/ritesh2025-hub/adjustmentTracker/main/coupons/images/' + month + '/' + pageFilename;

            // Always show with zoom controls (will use OCR to find item)
            content += '<div style="margin-top: 20px;">';
            // View toggle buttons
            content += '<div style="margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap;">';
            content += '<button onclick="showZoomedView()" class="btn btn-primary" id="zoom-btn">🔍 Zoomed View</button>';
            content += '<button onclick="showFullView()" class="btn btn-secondary" id="full-btn">📄 Full Page</button>';
            content += '<button onclick="toggleHighlight()" class="btn btn-cancel" id="highlight-toggle-btn">Hide Highlight</button>';
            content += '</div>';
            // Status message
            content += '<p id="ocr-status" style="margin-bottom: 10px; color: #2196F3; font-size: 0.9rem;">🔍 Searching for item #' + itemNumber + ' on page...</p>';
            // Hidden full image for processing
            content += '<img src="' + imageUrl + '" style="display: none;" alt="Coupon page" id="coupon-image-full" crossorigin="anonymous">';
            // Canvas for zoomed section
            content += '<canvas id="zoomed-canvas" style="max-width: 100%; border: 2px solid #ddd; border-radius: 8px; display: none;"></canvas>';
            // Full page view
            content += '<img src="' + imageUrl + '" id="full-page-view" style="max-width: 100%; border: 2px solid #ddd; border-radius: 8px; display: none;" alt="Coupon page">';
            content += '</div>';

            // Store item number for OCR search
            window.currentSearchItemNumber = itemNumber;
        } else if (coupon.imageData) {
            content += '<div style="margin-top: 20px;"><img src="' + coupon.imageData + '" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;" alt="Coupon image"></div>';
        } else if (coupon.imageUrl) {
            content += '<div style="margin-top: 20px;"><img src="' + coupon.imageUrl + '" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;" alt="Coupon image"></div>';
        } else {
            // No image available
            content += '<div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 4px;">';
            content += '<p><strong>💡 Tip:</strong> View the full Costco coupon book online to see this item.</p>';
            content += '<p>Valid period: ' + formatDate(coupon.validFrom) + ' - ' + formatDate(coupon.validUntil) + '</p>';
            content += '</div>';
        }
    } catch (error) {
        console.error('Could not load item-to-page mapping:', error);
        // Fallback to old behavior
        if (coupon.imageData || coupon.imageUrl) {
            const imgSrc = coupon.imageData || coupon.imageUrl;
            content += '<div style="margin-top: 20px;"><img src="' + imgSrc + '" style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px;" alt="Coupon image"></div>';
        }
    }

    showModal(content);

    // Use OCR to find item number on page
    if (itemData && window.currentSearchItemNumber) {
        window.highlightEnabled = true;

        setTimeout(() => {
            searchItemWithOCR(window.currentSearchItemNumber);
        }, 100);
    }
}

// Global variables for view state
let currentItemCoords = null;
let highlightEnabled = true;

async function searchItemWithOCR(itemNumber) {
    const statusEl = document.getElementById('ocr-status');
    const img = document.getElementById('coupon-image-full');

    if (!img) {
        statusEl.textContent = '❌ Error: Image not found';
        statusEl.style.color = '#f44336';
        return;
    }

    // Wait for image to load
    if (!img.complete || img.naturalWidth === 0) {
        img.onload = () => searchItemWithOCR(itemNumber);
        return;
    }

    try {
        statusEl.textContent = '🔍 Searching for item #' + itemNumber + '...';

        // Initialize Tesseract worker
        const worker = await Tesseract.createWorker();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789',
        });

        // Run OCR on full image
        const { data } = await worker.recognize(img);

        // Find the item number in OCR results
        let found = null;
        for (const word of data.words) {
            if (word.text.includes(itemNumber) || itemNumber.includes(word.text)) {
                found = word.bbox;
                break;
            }
        }

        await worker.terminate();

        if (found) {
            // Found the item! Create a 2"x2" box around it (roughly 200x200 pixels at typical DPI)
            const boxSize = 250; // 2-3 inches at typical screen DPI
            const centerX = found.x0 + (found.x1 - found.x0) / 2;
            const centerY = found.y0 + (found.y1 - found.y0) / 2;

            window.currentItemCoords = {
                x: Math.max(0, centerX - boxSize / 2),
                y: Math.max(0, centerY - boxSize / 2),
                width: boxSize,
                height: boxSize
            };

            statusEl.textContent = '✅ Found item #' + itemNumber + '!';
            statusEl.style.color = '#4CAF50';

            console.log('✅ Found item via OCR:', {
                itemNumber,
                bbox: found,
                center: { x: centerX, y: centerY },
                cropBox: window.currentItemCoords
            });

            showZoomedView();
        } else {
            statusEl.textContent = '⚠️ Item #' + itemNumber + ' not found on page';
            statusEl.style.color = '#ff9800';
            showFullView();
        }
    } catch (error) {
        console.error('OCR search failed:', error);
        statusEl.textContent = '❌ Search failed - showing full page';
        statusEl.style.color = '#f44336';
        showFullView();
    }
}

function showZoomedView() {
    if (!window.currentItemCoords) return;

    document.getElementById('zoomed-canvas').style.display = 'block';
    document.getElementById('full-page-view').style.display = 'none';
    document.getElementById('zoom-btn').classList.add('active');
    document.getElementById('full-btn').classList.remove('active');

    const coords = window.currentItemCoords;
    cropAndZoomToSection(coords.x, coords.y, coords.width, coords.height, window.highlightEnabled);
}

function showFullView() {
    document.getElementById('zoomed-canvas').style.display = 'none';
    document.getElementById('full-page-view').style.display = 'block';
    document.getElementById('zoom-btn').classList.remove('active');
    document.getElementById('full-btn').classList.add('active');
}

function toggleHighlight() {
    window.highlightEnabled = !window.highlightEnabled;
    const btn = document.getElementById('highlight-toggle-btn');
    btn.textContent = window.highlightEnabled ? 'Hide Highlight' : 'Show Highlight';

    // Redraw zoomed view if it's active
    if (document.getElementById('zoomed-canvas').style.display === 'block') {
        showZoomedView();
    }
}

function cropAndZoomToSection(origX, origY, origWidth, origHeight, showHighlight = true) {
    const img = document.getElementById('coupon-image-full');
    const canvas = document.getElementById('zoomed-canvas');

    if (!img || !canvas) {
        console.log('Image or canvas not found yet, retrying...');
        setTimeout(() => cropAndZoomToSection(origX, origY, origWidth, origHeight, showHighlight), 200);
        return;
    }

    // Wait for image to load if not loaded yet
    if (!img.complete || img.naturalWidth === 0) {
        console.log('Image not loaded yet, waiting...');
        img.onload = () => cropAndZoomToSection(origX, origY, origWidth, origHeight, showHighlight);
        return;
    }

    const ctx = canvas.getContext('2d');

    // Crop to the exact box (2"x2" around item number)
    const cropX = Math.max(0, origX);
    const cropY = Math.max(0, origY);
    const cropWidth = Math.min(origWidth, img.naturalWidth - cropX);
    const cropHeight = Math.min(origHeight, img.naturalHeight - cropY);

    // Scale to reasonable viewing size (max 600px wide for 2"x2" section)
    const maxWidth = 600;
    const scale = maxWidth / cropWidth;
    canvas.width = cropWidth * scale;
    canvas.height = cropHeight * scale;

    // Draw the cropped 2"x2" section
    ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,  // Source crop area (exact 2"x2")
        0, 0, canvas.width, canvas.height      // Destination (scaled up)
    );

    // Draw highlight if enabled - highlight the center where item number was found
    if (showHighlight) {
        const centerHighlightSize = Math.min(cropWidth, cropHeight) * 0.6; // Highlight center 60%
        const highlightX = (cropWidth - centerHighlightSize) / 2 * scale;
        const highlightY = (cropHeight - centerHighlightSize) / 2 * scale;
        const highlightW = centerHighlightSize * scale;
        const highlightH = centerHighlightSize * scale;

        ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
        ctx.fillRect(highlightX, highlightY, highlightW, highlightH);

        ctx.strokeStyle = 'rgba(76, 175, 80, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeRect(highlightX, highlightY, highlightW, highlightH);
    }

    console.log('✅ Zoomed view rendered (2"x2" section):', {
        crop: { x: cropX, y: cropY, w: cropWidth, h: cropHeight },
        canvas: { w: canvas.width, h: canvas.height },
        zoom: scale.toFixed(2) + 'x',
        highlight: showHighlight
    });
}

async function toggleShowExpired() {
    const checkbox = document.getElementById('show-expired-toggle');
    await setSetting('showExpiredAdjustments', checkbox.checked);
    await renderComparisons();
}

async function toggleClaimedFilter() {
    await renderComparisons();
}

async function markAsClaimed(adjustmentKey, amount) {
    if (confirm('Mark this adjustment as claimed?')) {
        await markAdjustmentClaimed(adjustmentKey, amount);
        showToast('Marked as claimed! 💰', 'success');
        await renderComparisons();
    }
}

async function unclaimAdjustment(adjustmentKey) {
    if (confirm('Remove this adjustment from claimed list?')) {
        await unmarkAdjustmentClaimed(adjustmentKey);
        showToast('Adjustment unclaimed', 'info');
        await renderComparisons();
    }
}

async function recalculateComparisons() {
    console.log('🔄 Recalculating price comparisons...');
    showToast('Recalculating price comparisons...', 'info');

    try {
        // Force re-fetch coupons from GitHub (bypassing any cache)
        await renderComparisons(true);

        showToast('Price comparisons updated!', 'success');
        console.log('✅ Recalculation complete');
    } catch (error) {
        console.error('Failed to recalculate:', error);
        showToast('Failed to recalculate: ' + error.message, 'error');
    }
}

async function renderComparisons(bustCache = false) {
    console.log('🔄 renderComparisons called - View Coupon button should appear');
    const adjustmentWindow = await getSetting('adjustmentWindow', 30);
    const showExpired = await getSetting('showExpiredAdjustments', false);
    const claimedFilter = document.getElementById('claimed-filter')?.value || 'unclaimed';

    // Update checkbox state
    const checkbox = document.getElementById('show-expired-toggle');
    if (checkbox) {
        checkbox.checked = showExpired;
    }

    const receipts = await getReceipts();
    console.log('📝 Found receipts:', receipts.length);

    // Load coupons from GitHub monthly files instead of IndexedDB
    const coupons = await loadMonthlyCouponsToMemory(bustCache);

    // Load claimed adjustments
    const claimedAdjustments = await getAllClaimedAdjustments();

    let adjustments = calculatePriceAdjustments(receipts, coupons, adjustmentWindow);

    // Add claimed status to each adjustment
    adjustments = adjustments.map(adj => {
        const key = `${adj.receiptId}_${adj.itemNumber}_${adj.couponId}`;
        const claimed = claimedAdjustments[key];
        return {
            ...adj,
            adjustmentKey: key,
            claimed: !!claimed,
            claimedDate: claimed ? claimed.claimedDate : null
        };
    });

    // Sort by purchase date ascending (oldest first)
    adjustments.sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));

    // Filter out expired if showExpired is false
    if (!showExpired) {
        adjustments = adjustments.filter(adj => adj.eligible);
    }

    // Filter by claimed status
    if (claimedFilter === 'claimed') {
        adjustments = adjustments.filter(adj => adj.claimed);
    } else if (claimedFilter === 'unclaimed') {
        adjustments = adjustments.filter(adj => !adj.claimed);
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

    // Update lifetime savings
    const lifetimeSavings = await getLifetimeSavings();
    document.getElementById('lifetime-savings').textContent = formatCurrency(lifetimeSavings);

    console.log('📊 Rendering adjustments to DOM:', adjustments.length);
    listEl.innerHTML = adjustments.map(adj => {
        const formatted = formatAdjustment(adj);
        console.log(`   Card for Item #${adj.itemNumber}: ${formatted.daysRemainingText}`);
        const statusIndicator = adj.claimed ? '✅' : (adj.eligible ? '🟢' : '⚪');
        let cardClass = adj.eligible ? 'comparison-card' : 'comparison-card expired';
        if (adj.claimed) {
            cardClass += ' claimed';
        }

        // Build different display for discount-only vs exact price
        let priceComparisonHtml = '';
        let adjustmentLabelHtml = '';

        if (adj.isDiscountOnly) {
            // Discount-only: Show message about checking store
            priceComparisonHtml =
                '<div class="comparison-detail"><div class="comparison-detail-label">Purchase date:</div><div class="comparison-detail-value">' + formatted.purchaseDateFormatted + '</div></div>' +
                '<div class="comparison-detail"><div class="comparison-detail-label">You paid:</div><div class="comparison-detail-value">' + formatted.pricePaidFormatted + '</div></div>' +
                '<div class="comparison-detail"><div class="comparison-detail-label">Coupon discount:</div><div class="comparison-detail-value" style="color: #ffc107; font-weight: bold;">$' + adj.discountAmount.toFixed(2) + ' OFF</div></div>';
            adjustmentLabelHtml = 'Potential savings (check store for current price)';
        } else {
            // Exact price: Show normal comparison
            priceComparisonHtml =
                '<div class="comparison-detail"><div class="comparison-detail-label">Purchase date:</div><div class="comparison-detail-value">' + formatted.purchaseDateFormatted + '</div></div>' +
                '<div class="comparison-detail"><div class="comparison-detail-label">You paid:</div><div class="comparison-detail-value">' + formatted.pricePaidFormatted + '</div></div>' +
                '<div class="comparison-detail"><div class="comparison-detail-label">Current price:</div><div class="comparison-detail-value">' + formatted.currentPriceFormatted + '</div></div>';
            adjustmentLabelHtml = 'Adjustment';
        }

        // Build claimed status HTML
        let claimedStatusHtml = '';
        if (adj.claimed && adj.claimedDate) {
            const claimedDateFormatted = formatDate(adj.claimedDate.split('T')[0]);
            claimedStatusHtml = '<div class="comparison-detail" style="background: #e8f5e9; padding: 8px; border-radius: 4px; margin-top: 8px;"><div class="comparison-detail-label" style="color: #2e7d32;">✅ Claimed on:</div><div class="comparison-detail-value" style="color: #2e7d32;">' + claimedDateFormatted + '</div></div>';
        }

        // Build action buttons
        let actionButtons = '<button class="btn btn-secondary" onclick="viewCouponImage(\'' + adj.couponId + '\', \'' + adj.itemNumber + '\')">View Coupon</button>';
        if (!adj.claimed) {
            actionButtons += '<button class="btn btn-success" onclick="markAsClaimed(\'' + adj.adjustmentKey + '\', ' + adj.adjustment + ')" style="margin-left: 8px;">Mark as Claimed</button>';
        } else {
            actionButtons += '<button class="btn btn-cancel" onclick="unclaimAdjustment(\'' + adj.adjustmentKey + '\')" style="margin-left: 8px;">Unclaim</button>';
        }

        return '<div class="' + cardClass + '"><div class="comparison-header"><span class="status-indicator">' + statusIndicator + '</span><div class="comparison-item-title">Item #' + adj.itemNumber + (adj.description ? ' - ' + adj.description : '') + '</div></div><div class="comparison-details">' + priceComparisonHtml + '<div class="comparison-detail"><div class="comparison-detail-label">' + adjustmentLabelHtml + ':</div><div class="comparison-detail-value adjustment-amount">' + formatted.adjustmentFormatted + '</div><div class="comparison-detail-label">' + formatted.daysRemainingText + '</div></div>' + claimedStatusHtml + '</div><div class="card-actions" style="margin-top: 10px;">' + actionButtons + '</div></div>';
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
        await renderReceiptList();
        await renderComparisons();
        await renderStats();
    } catch (error) {
        showToast('Import failed: ' + error.message, 'error');
    }
}

async function clearAllDataConfirm() {
    if (confirm('Delete ALL data? This cannot be undone!') && confirm('Really delete everything?')) {
        await clearAllData();
        showToast('All data cleared', 'success');
        await renderReceiptList();
        await renderComparisons();
        await renderStats();
    }
}

async function saveSettings() {
    const adjustmentWindow = parseInt(document.getElementById('adjustment-window').value);
    const defaultStore = document.getElementById('default-store').value;
    await setSetting('adjustmentWindow', adjustmentWindow);
    await setSetting('defaultStore', defaultStore);
    showToast('Settings saved!', 'success');
    await renderComparisons();
}

async function loadSettings() {
    const adjustmentWindow = await getSetting('adjustmentWindow', 30);
    const defaultStore = await getSetting('defaultStore', '');
    document.getElementById('adjustment-window').value = adjustmentWindow;
    document.getElementById('default-store').value = defaultStore;
}
