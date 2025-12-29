// app.js - Application initialization and event handling

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Receipt Tracker App starting...');

    // Check if admin mode (URL contains ?admin=true or #admin)
    const isAdmin = window.location.search.includes('admin=true') || window.location.hash.includes('admin');
    if (isAdmin) {
        console.log('🔑 Admin mode enabled');
        // Show admin-only elements
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = '';
        });
    }

    // Initialize database
    try {
        await initDatabase();
        console.log('Database initialized');

        // Note: Coupons are now loaded dynamically from monthly JSON files
        // when rendering comparisons, not stored in IndexedDB
    } catch (error) {
        console.error('Failed to initialize database:', error);
        showToast('Failed to initialize app', 'error');
        return;
    }

    // Initialize OCR
    try {
        await initOCR();
        console.log('OCR initialized');
    } catch (error) {
        console.warn('OCR initialization failed:', error);
    }
    
    // Setup tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Setup modal close
    document.querySelector('.modal-close').addEventListener('click', hideModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') hideModal();
    });
    
    // Receipt upload handlers
    setupReceiptHandlers();

    // Coupon upload handlers (admin only)
    if (isAdmin) {
        setupCouponHandlers();
    }

    // Purchases tab handlers
    document.getElementById('purchase-type').addEventListener('change', renderReceiptList);
    document.getElementById('purchase-filter').addEventListener('change', renderReceiptList);
    document.getElementById('purchase-sort').addEventListener('change', renderReceiptList);
    
    // Settings handlers
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    document.getElementById('import-data-btn').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importDataFromFile(e.target.files[0]);
        }
    });
    document.getElementById('clear-data-btn').addEventListener('click', clearAllDataConfirm);
    document.getElementById('debug-data-btn').addEventListener('click', debugDatabase);

    // Load settings
    await loadSettings();
    
    // Initial renders
    await renderReceiptList();
    await renderComparisons();
    await renderStats();
    
    console.log('App initialized successfully');
});

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
    
    // Refresh data when switching to certain tabs
    if (tabName === 'purchases') {
        renderReceiptList();
    } else if (tabName === 'comparisons') {
        renderComparisons();
    } else if (tabName === 'settings') {
        loadSettings();
        renderStats();
    }
}

function setupReceiptHandlers() {
    const fileInput = document.getElementById('receipt-file-input');
    const browseBtn = document.getElementById('receipt-browse-btn');
    const cameraBtn = document.getElementById('receipt-camera-btn');
    const uploadArea = document.getElementById('receipt-upload-area');
    const saveBtn = document.getElementById('receipt-save-btn');
    const cancelBtn = document.getElementById('receipt-cancel-btn');
    const addItemBtn = document.getElementById('receipt-add-item-btn');
    
    browseBtn.addEventListener('click', () => fileInput.click());
    cameraBtn.addEventListener('click', () => {
        fileInput.setAttribute('capture', 'environment');
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            processReceiptImage(e.target.files[0]);
        }
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            processReceiptImage(e.dataTransfer.files[0]);
        }
    });
    
    saveBtn.addEventListener('click', saveReceiptData);
    cancelBtn.addEventListener('click', resetReceiptForm);
    addItemBtn.addEventListener('click', addReceiptItemRow);
}

let currentReceiptData = null;

async function processReceiptImage(file) {
    try {
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('receipt-preview-image').src = e.target.result;
            document.getElementById('receipt-preview-section').style.display = 'block';
            document.getElementById('receipt-ocr-progress').style.display = 'block';
        };
        reader.readAsDataURL(file);
        
        // Process with OCR
        const result = await processImage(file, (progress) => {
            document.getElementById('receipt-progress-fill').style.width = progress + '%';
            document.getElementById('receipt-progress-text').textContent = progress + '%';
        });
        
        // Parse receipt
        currentReceiptData = parseReceipt(result.text);
        
        // Display parsed data
        document.getElementById('receipt-purchase-date').value = currentReceiptData.purchaseDate;
        renderReceiptItems(currentReceiptData.items);
        updateReceiptTotals();
        
        document.getElementById('receipt-ocr-progress').style.display = 'none';
        document.getElementById('receipt-parsed-section').style.display = 'block';
        
        showToast('Receipt processed successfully!', 'success');
    } catch (error) {
        console.error('Failed to process receipt:', error);
        showToast('OCR failed. Please enter items manually.', 'error');
        document.getElementById('receipt-ocr-progress').style.display = 'none';
        document.getElementById('receipt-parsed-section').style.display = 'block';
        currentReceiptData = { items: [], subtotal: 0, tax: 0, total: 0 };
        renderReceiptItems([]);
    }
}

function renderReceiptItems(items) {
    const tbody = document.getElementById('receipt-items-tbody');
    tbody.innerHTML = items.map((item, index) => 
        '<tr><td><input type="text" value="' + item.itemNumber + '" data-index="' + index + '" data-field="itemNumber"></td>' +
        '<td><input type="text" value="' + (item.description || '') + '" data-index="' + index + '" data-field="description"></td>' +
        '<td><input type="number" step="0.01" value="' + item.finalPrice + '" data-index="' + index + '" data-field="finalPrice"></td>' +
        '<td><button class="btn btn-danger" onclick="removeReceiptItem(' + index + ')">Remove</button></td></tr>'
    ).join('');
    
    // Add event listeners
    tbody.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', updateReceiptItemData);
    });
}

function updateReceiptItemData(e) {
    const index = parseInt(e.target.getAttribute('data-index'));
    const field = e.target.getAttribute('data-field');
    const value = field === 'finalPrice' ? parseFloat(e.target.value) : e.target.value;
    currentReceiptData.items[index][field] = value;
    updateReceiptTotals();
}

function addReceiptItemRow() {
    currentReceiptData.items.push({ itemNumber: '', description: '', finalPrice: 0 });
    renderReceiptItems(currentReceiptData.items);
}

function removeReceiptItem(index) {
    currentReceiptData.items.splice(index, 1);
    renderReceiptItems(currentReceiptData.items);
    updateReceiptTotals();
}

function updateReceiptTotals() {
    const subtotal = currentReceiptData.items.reduce((sum, item) => sum + item.finalPrice, 0);
    currentReceiptData.subtotal = subtotal;
    currentReceiptData.total = subtotal + (currentReceiptData.tax || 0);
    
    document.getElementById('receipt-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('receipt-tax').textContent = formatCurrency(currentReceiptData.tax || 0);
    document.getElementById('receipt-total').textContent = formatCurrency(currentReceiptData.total);
}

async function saveReceiptData() {
    currentReceiptData.purchaseDate = document.getElementById('receipt-purchase-date').value;
    
    const validation = validateReceipt(currentReceiptData);
    if (!validation.isValid) {
        showToast('Invalid receipt: ' + validation.errors.join(', '), 'error');
        return;
    }
    
    try {
        await saveReceipt(currentReceiptData);
        showToast('Receipt saved successfully!', 'success');
        resetReceiptForm();
        await renderReceiptList();
        await renderComparisons();
    } catch (error) {
        showToast('Failed to save receipt: ' + error.message, 'error');
    }
}

function resetReceiptForm() {
    currentReceiptData = null;
    document.getElementById('receipt-preview-section').style.display = 'none';
    document.getElementById('receipt-file-input').value = '';
}

function setupCouponHandlers() {
    const fileInput = document.getElementById('coupon-file-input');
    const browseBtn = document.getElementById('coupon-browse-btn');
    const cameraBtn = document.getElementById('coupon-camera-btn');
    const saveBtn = document.getElementById('coupon-save-btn');
    const cancelBtn = document.getElementById('coupon-cancel-btn');
    const addItemBtn = document.getElementById('coupon-add-item-btn');

    if (!fileInput || !browseBtn || !cameraBtn) return; // Elements not present

    browseBtn.addEventListener('click', () => fileInput.click());
    cameraBtn.addEventListener('click', () => {
        fileInput.setAttribute('capture', 'environment');
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            if (e.target.files.length > 1) {
                // Batch processing multiple files
                processCouponBatch(e.target.files);
            } else {
                // Single file processing
                processCouponImage(e.target.files[0]);
            }
        }
    });

    saveBtn.addEventListener('click', saveCouponData);
    cancelBtn.addEventListener('click', resetCouponForm);
    addItemBtn.addEventListener('click', addCouponItemRow);
}

let currentCouponData = null;
let batchCouponItems = []; // Store all items from batch processing

async function processCouponBatch(files) {
    try {
        console.log(`🔄 Starting batch processing of ${files.length} images...`);

        // Show batch processing UI
        document.getElementById('coupon-batch-processing').style.display = 'block';
        document.getElementById('coupon-parsed-section').style.display = 'none';
        document.getElementById('coupon-preview-section').style.display = 'none';

        const totalFiles = files.length;
        document.getElementById('total-batch-number').textContent = totalFiles;

        batchCouponItems = []; // Reset batch items
        const batchResults = document.getElementById('batch-results');
        batchResults.innerHTML = '';

        // Process each file sequentially
        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            const fileNumber = i + 1;

            document.getElementById('current-batch-number').textContent = fileNumber;
            const progress = Math.round((fileNumber / totalFiles) * 100);
            document.getElementById('batch-progress-fill').style.width = progress + '%';
            document.getElementById('batch-progress-text').textContent = progress + '%';

            batchResults.innerHTML += `<div>📄 Processing ${file.name}...</div>`;

            try {
                // Process OCR
                const result = await processImage(file, () => {});

                // Parse coupon
                const couponData = parseCoupon(result.text);

                if (couponData.items && couponData.items.length > 0) {
                    // Add all items to batch
                    batchCouponItems.push(...couponData.items);
                    batchResults.innerHTML += `<div style="color: green;">✅ ${file.name}: Found ${couponData.items.length} items</div>`;
                } else {
                    batchResults.innerHTML += `<div style="color: orange;">⚠️ ${file.name}: No items found</div>`;
                }
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                batchResults.innerHTML += `<div style="color: red;">❌ ${file.name}: OCR failed</div>`;
            }

            // Scroll to bottom of results
            batchResults.scrollTop = batchResults.scrollHeight;
        }

        console.log(`✅ Batch processing complete! Found ${batchCouponItems.length} total items`);

        // Hide batch processing, show review screen
        document.getElementById('coupon-batch-processing').style.display = 'none';
        document.getElementById('coupon-parsed-section').style.display = 'block';
        document.getElementById('review-header').textContent = `Review & Edit All Coupons (${batchCouponItems.length} items found)`;
        document.getElementById('total-items-count').textContent = batchCouponItems.length;

        // Set default dates (can be edited)
        document.getElementById('coupon-valid-from').value = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        document.getElementById('coupon-valid-until').value = futureDate.toISOString().split('T')[0];

        // Render all items in review table
        renderBatchCouponItems(batchCouponItems);

        showToast(`Batch processing complete! ${batchCouponItems.length} items found`, 'success');
    } catch (error) {
        console.error('Batch processing error:', error);
        showToast('Batch processing failed: ' + error.message, 'error');
        document.getElementById('coupon-batch-processing').style.display = 'none';
    }
}

async function processCouponImage(file) {
    try {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('coupon-preview-image').src = e.target.result;
            document.getElementById('coupon-preview-section').style.display = 'block';
            document.getElementById('coupon-ocr-progress').style.display = 'block';
        };
        reader.readAsDataURL(file);

        const result = await processImage(file, (progress) => {
            document.getElementById('coupon-progress-fill').style.width = progress + '%';
            document.getElementById('coupon-progress-text').textContent = progress + '%';
        });

        currentCouponData = parseCoupon(result.text);

        document.getElementById('coupon-valid-from').value = currentCouponData.validFrom;
        document.getElementById('coupon-valid-until').value = currentCouponData.validUntil;
        renderCouponItems(currentCouponData.items);

        document.getElementById('coupon-ocr-progress').style.display = 'none';
        document.getElementById('coupon-parsed-section').style.display = 'block';

        showToast('Coupon processed successfully!', 'success');
    } catch (error) {
        console.error('Failed to process coupon:', error);
        showToast('OCR failed. Please enter items manually.', 'error');
        currentCouponData = { items: [] };
        renderCouponItems([]);
    }
}

function renderBatchCouponItems(items) {
    const tbody = document.getElementById('coupon-items-tbody');
    tbody.innerHTML = items.map((item, index) => {
        const priceValue = (item.salePrice && item.salePrice > 0) ? item.salePrice : 0;
        const discountValue = (item.discount && item.discount > 0) ? item.discount : 0;

        return `<tr>
            <td><input type="text" value="${item.itemNumber || ''}" data-index="${index}" data-field="itemNumber" style="width: 100%;"></td>
            <td><input type="text" value="${item.description || ''}" data-index="${index}" data-field="description" style="width: 100%;"></td>
            <td><input type="number" step="0.01" value="${priceValue}" data-index="${index}" data-field="salePrice" style="width: 100%;"></td>
            <td><input type="number" step="0.01" value="${discountValue}" data-index="${index}" data-field="discount" style="width: 100%;"></td>
            <td><button class="btn btn-danger btn-sm" onclick="removeBatchCouponItem(${index})">✕</button></td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', updateBatchCouponItemData);
    });
}

function renderCouponItems(items) {
    const tbody = document.getElementById('coupon-items-tbody');
    tbody.innerHTML = items.map((item, index) => {
        const priceValue = (item.salePrice && item.salePrice > 0) ? item.salePrice : 0;
        const hasDiscount = item.discount && item.discount > 0;
        const warningStyle = hasDiscount && priceValue === 0 ? 'background: #fff3cd;' : '';
        const placeholder = hasDiscount ? 'Enter actual sale price!' : 'Final price after discount';

        return '<tr style="' + warningStyle + '"><td><input type="text" value="' + item.itemNumber + '" data-index="' + index + '" data-field="itemNumber"></td>' +
        '<td><input type="text" value="' + (item.description || '') + '" data-index="' + index + '" data-field="description"></td>' +
        '<td>' +
        (hasDiscount ? '<small style="color: #856404;">Discount: $' + item.discount + ' OFF<br></small>' : '') +
        '<input type="number" step="0.01" value="' + priceValue + '" data-index="' + index + '" data-field="salePrice" placeholder="' + placeholder + '" style="width: 100%;">' +
        '</td>' +
        '<td><button class="btn btn-danger" onclick="removeCouponItem(' + index + ')">Remove</button></td></tr>';
    }).join('');

    tbody.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', updateCouponItemData);
    });
}

function updateBatchCouponItemData(e) {
    const index = parseInt(e.target.getAttribute('data-index'));
    const field = e.target.getAttribute('data-field');
    let value = e.target.value;

    if (field === 'salePrice' || field === 'discount') {
        value = parseFloat(value) || 0;
    }

    batchCouponItems[index][field] = value;
}

function updateCouponItemData(e) {
    const index = parseInt(e.target.getAttribute('data-index'));
    const field = e.target.getAttribute('data-field');
    const value = field === 'salePrice' ? parseFloat(e.target.value) : e.target.value;
    currentCouponData.items[index][field] = value;
}

function addCouponItemRow() {
    if (batchCouponItems.length > 0) {
        // Batch mode
        batchCouponItems.push({ itemNumber: '', description: '', salePrice: 0, discount: 0 });
        renderBatchCouponItems(batchCouponItems);
        document.getElementById('total-items-count').textContent = batchCouponItems.length;
    } else if (currentCouponData) {
        // Single mode
        currentCouponData.items.push({ itemNumber: '', description: '', salePrice: 0 });
        renderCouponItems(currentCouponData.items);
    }
}

function removeBatchCouponItem(index) {
    batchCouponItems.splice(index, 1);
    renderBatchCouponItems(batchCouponItems);
    document.getElementById('total-items-count').textContent = batchCouponItems.length;
    document.getElementById('review-header').textContent = `Review & Edit All Coupons (${batchCouponItems.length} items found)`;
}

function removeCouponItem(index) {
    currentCouponData.items.splice(index, 1);
    renderCouponItems(currentCouponData.items);
}

async function saveCouponData() {
    const validFrom = document.getElementById('coupon-valid-from').value;
    const validUntil = document.getElementById('coupon-valid-until').value;

    // Check if we're in batch mode
    if (batchCouponItems.length > 0) {
        // Batch mode: Get latest values from table
        const tbody = document.getElementById('coupon-items-tbody');
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 4 && batchCouponItems[index]) {
                batchCouponItems[index].itemNumber = inputs[0].value;
                batchCouponItems[index].description = inputs[1].value;
                batchCouponItems[index].salePrice = parseFloat(inputs[2].value) || 0;
                batchCouponItems[index].discount = parseFloat(inputs[3].value) || 0;
            }
        });

        // Create coupon object with all batch items
        const batchCouponData = {
            validFrom: validFrom,
            validUntil: validUntil,
            items: batchCouponItems.filter(item => item.itemNumber && item.itemNumber.trim() !== '')
        };

        console.log(`💾 Generating monthly JSON with ${batchCouponData.items.length} items from batch`);

        try {
            // Generate monthly JSON file
            const monthlyJSON = generateMonthlyJSON(batchCouponData);

            // Download the JSON file
            downloadMonthlyJSON(monthlyJSON.fileName, monthlyJSON.data);

            // Show upload instructions
            showUploadInstructions(monthlyJSON.fileName);

            console.log(`✅ Monthly JSON generated: ${monthlyJSON.fileName}`);
            showToast(`✅ Download complete! ${batchCouponData.items.length} items in ${monthlyJSON.fileName}`, 'success');

            resetCouponForm();
        } catch (error) {
            console.error('❌ Failed to generate monthly JSON:', error);
            showToast('Failed to generate coupon file: ' + error.message, 'error');
        }

    } else if (currentCouponData) {
        // Single coupon mode
        currentCouponData.validFrom = validFrom;
        currentCouponData.validUntil = validUntil;

        const tbody = document.getElementById('coupon-items-tbody');
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            if (inputs.length >= 3) {
                currentCouponData.items[index].itemNumber = inputs[0].value;
                currentCouponData.items[index].description = inputs[1].value;
                currentCouponData.items[index].salePrice = parseFloat(inputs[2].value) || 0;
            }
        });

        console.log('💾 Generating monthly JSON for single coupon');

        const validation = validateCoupon(currentCouponData);
        if (!validation.isValid) {
            showToast('Invalid coupon: ' + validation.errors.join(', '), 'error');
            return;
        }

        try {
            // Generate monthly JSON file
            const monthlyJSON = generateMonthlyJSON(currentCouponData);

            // Download the JSON file
            downloadMonthlyJSON(monthlyJSON.fileName, monthlyJSON.data);

            // Show upload instructions
            showUploadInstructions(monthlyJSON.fileName);

            console.log(`✅ Monthly JSON generated: ${monthlyJSON.fileName}`);
            showToast(`Download complete! Upload ${monthlyJSON.fileName} to GitHub`, 'success');

            resetCouponForm();
        } catch (error) {
            console.error('❌ Failed to generate monthly JSON:', error);
            showToast('Failed to generate coupon file: ' + error.message, 'error');
        }
    }
}

function resetCouponForm() {
    currentCouponData = null;
    batchCouponItems = [];
    document.getElementById('coupon-preview-section').style.display = 'none';
    document.getElementById('coupon-batch-processing').style.display = 'none';
    document.getElementById('coupon-parsed-section').style.display = 'none';
    document.getElementById('coupon-file-input').value = '';
}

async function debugDatabase() {
    console.clear();
    console.log('%c=== RECEIPT TRACKER DEBUG ===', 'color: blue; font-size: 20px; font-weight: bold;');
    console.log('');

    // Get all data
    const receipts = await getReceipts();
    const coupons = await getCoupons();
    const adjustmentWindow = await getSetting('adjustmentWindow', 30);

    console.log('%c1. RECEIPTS (' + receipts.length + ' total)', 'color: green; font-size: 16px; font-weight: bold;');
    receipts.forEach((receipt, index) => {
        console.log('%c  Receipt #' + (index + 1) + ':', 'font-weight: bold;');
        console.log('    ID:', receipt.id);
        console.log('    Purchase Date:', receipt.purchaseDate);
        console.log('    Total:', receipt.total);
        console.log('    Items:', receipt.items.length);
        receipt.items.forEach(item => {
            console.log('      - Item #' + item.itemNumber + ': ' + (item.description || 'No description') + ' - $' + item.finalPrice);
        });
        console.log('');
    });

    console.log('%c2. COUPONS (' + coupons.length + ' total)', 'color: orange; font-size: 16px; font-weight: bold;');
    coupons.forEach((coupon, index) => {
        console.log('%c  Coupon #' + (index + 1) + ':', 'font-weight: bold;');
        console.log('    ID:', coupon.id);
        console.log('    Valid From:', coupon.validFrom);
        console.log('    Valid Until:', coupon.validUntil);
        console.log('    Items:', coupon.items.length);
        coupon.items.forEach(item => {
            console.log('      - Item #' + item.itemNumber + ': ' + (item.description || 'No description') + ' - $' + item.salePrice + (item.discount ? ' (Discount: $' + item.discount + ')' : ''));
        });
        console.log('');
    });

    console.log('%c3. COMPARISON ANALYSIS', 'color: purple; font-size: 16px; font-weight: bold;');
    console.log('  Adjustment Window:', adjustmentWindow + ' days');
    console.log('');

    // Run comparison logic
    const adjustments = calculatePriceAdjustments(receipts, coupons, adjustmentWindow);

    console.log('%c4. PRICE ADJUSTMENTS FOUND: ' + adjustments.length, 'color: red; font-size: 16px; font-weight: bold;');
    
    if (adjustments.length === 0) {
        console.log('%c  ❌ NO ADJUSTMENTS FOUND', 'color: red; font-weight: bold;');
        console.log('');
        console.log('%c  Why?', 'font-weight: bold;');
        
        // Analyze why no matches
        if (receipts.length === 0) {
            console.log('    ❌ No receipts uploaded');
        }
        if (coupons.length === 0) {
            console.log('    ❌ No coupons uploaded');
        }
        if (receipts.length > 0 && coupons.length > 0) {
            console.log('    🔍 Checking item number matches...');
            
            const receiptItemNumbers = new Set();
            receipts.forEach(r => {
                r.items.forEach(item => receiptItemNumbers.add(item.itemNumber));
            });
            
            const couponItemNumbers = new Set();
            coupons.forEach(c => {
                c.items.forEach(item => couponItemNumbers.add(item.itemNumber));
            });
            
            console.log('    Receipt item numbers:', Array.from(receiptItemNumbers));
            console.log('    Coupon item numbers:', Array.from(couponItemNumbers));
            
            const matches = Array.from(receiptItemNumbers).filter(num => couponItemNumbers.has(num));
            
            if (matches.length === 0) {
                console.log('    ❌ No matching item numbers between receipts and coupons');
                console.log('    💡 TIP: Make sure item numbers match EXACTLY (including length)');
            } else {
                console.log('    ✅ Found ' + matches.length + ' matching item numbers:', matches);
                console.log('    🔍 Checking prices...');
                
                matches.forEach(itemNum => {
                    const receiptItem = receipts.flatMap(r => r.items).find(i => i.itemNumber === itemNum);
                    const couponItem = coupons.flatMap(c => c.items).find(i => i.itemNumber === itemNum);
                    
                    console.log('      Item #' + itemNum + ':');
                    console.log('        Receipt price: $' + receiptItem.finalPrice);
                    console.log('        Coupon price: $' + couponItem.salePrice);
                    
                    if (receiptItem.finalPrice <= couponItem.salePrice) {
                        console.log('        ❌ No adjustment: Receipt price is not higher than coupon price');
                    }
                });
                
                // Check dates
                console.log('    🔍 Checking purchase dates...');
                const today = new Date();
                receipts.forEach(r => {
                    const purchaseDate = new Date(r.purchaseDate);
                    const daysAgo = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
                    console.log('      Receipt from ' + r.purchaseDate + ' is ' + daysAgo + ' days ago' + (daysAgo > adjustmentWindow ? ' ❌ EXPIRED' : ' ✅ ELIGIBLE'));
                });
            }
        }
    } else {
        adjustments.forEach((adj, index) => {
            console.log('%c  Adjustment #' + (index + 1) + ':', 'font-weight: bold;');
            console.log('    Item #' + adj.itemNumber + ': ' + adj.description);
            console.log('    You paid: $' + adj.pricePaid + ' on ' + adj.purchaseDate);
            console.log('    Current price: $' + adj.currentPrice);
            console.log('    💰 Potential adjustment: $' + adj.adjustment.toFixed(2));
            console.log('    Days ago: ' + adj.daysAgo);
            console.log('    ' + (adj.eligible ? '✅ ELIGIBLE' : '❌ EXPIRED (> ' + adjustmentWindow + ' days)'));
            console.log('');
        });
    }

    console.log('%c=== END DEBUG ===', 'color: blue; font-size: 20px; font-weight: bold;');
    
    showToast('Debug info logged to console (press F12)', 'info');
}
