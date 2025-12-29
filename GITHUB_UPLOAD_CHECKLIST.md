# GitHub Upload Checklist

## ✅ All Files Ready to Push

Everything has been committed to your local git repository. You just need to push to GitHub.

## What's Included:

### 1. Core Application Files
- ✅ `index.html` - Main app with all features
- ✅ `js/ui.js` - Updated with View Coupon button and item-to-page mapping
- ✅ `js/comparison.js` - Fixed price adjustment logic
- ✅ `js/database.js` - Monthly coupon loading from GitHub
- ✅ `js/app.js` - Batch coupon processing
- ✅ `js/receipt.js`, `js/coupon.js`, `js/ocr.js` - Supporting files
- ✅ `css/styles.css` - All styling

### 2. Coupon Data Files
- ✅ `coupons/2026-01.json` - All Costco January 2026 coupon data
- ✅ `coupons/item-to-page-mapping.json` - Maps item numbers to specific page images

### 3. Coupon Images (24 files)
- ✅ `coupons/images/2026-01/Costco-January-2026-Coupon-Book-Page-1.jpg`
- ✅ `coupons/images/2026-01/Costco-January-2026-Coupon-Book-Page-2.jpg`
- ... (all 24 pages through Page-24.jpg)

### 4. Documentation
- ✅ `README.md` - App documentation
- ✅ `ADMIN_GUIDE.md` - Admin instructions
- ✅ `ADMIN_WORKFLOW.md` - Admin workflow

## How to Push to GitHub:

### Option 1: Command Line (if authentication is set up)

```bash
cd /Users/riteshmaharjan/app1
git push origin main
```

If you get authentication error, see Option 2.

### Option 2: GitHub Desktop

1. Open GitHub Desktop
2. Select the "adjustmentTracker" repository
3. You should see all changes ready to push
4. Click "Push origin"

### Option 3: Manual Upload via Web

Since git push had authentication issues earlier, you may need to:

1. Go to https://github.com/ritesh2025-hub/adjustmentTracker
2. Use "Add file" → "Upload files" for each folder
3. Upload in this order:
   - All files in root (`index.html`, `README.md`, etc.)
   - `js/` folder files
   - `css/` folder files
   - `coupons/2026-01.json`
   - `coupons/item-to-page-mapping.json`
   - `coupons/images/2026-01/` folder (all 24 images)

## After Upload - How It Works:

1. **User uploads a receipt** with item #1243880 (Optimum Nutrition Whey Protein)
2. **App compares** with `coupons/2026-01.json` (fetched from GitHub)
3. **App finds match**: Item was $64.99 on receipt, now $49.99 in coupon
4. **Price Comparisons tab** shows: "$15.00 adjustment available"
5. **User clicks "View Coupon"** button
6. **App looks up** item #1243880 in `item-to-page-mapping.json`
7. **App finds**: Page-2.jpg
8. **App fetches image** from GitHub:
   ```
   https://raw.githubusercontent.com/ritesh2025-hub/adjustmentTracker/main/coupons/images/2026-01/Costco-January-2026-Coupon-Book-Page-2.jpg
   ```
9. **Modal displays** the actual coupon page image showing the item!

## Verify Upload Success:

Once pushed, test these URLs in your browser:

1. **Main app**: https://ritesh2025-hub.github.io/adjustmentTracker/
2. **Coupon data**: https://raw.githubusercontent.com/ritesh2025-hub/adjustmentTracker/main/coupons/2026-01.json
3. **Mapping file**: https://raw.githubusercontent.com/ritesh2025-hub/adjustmentTracker/main/coupons/item-to-page-mapping.json
4. **Sample image**: https://raw.githubusercontent.com/ritesh2025-hub/adjustmentTracker/main/coupons/images/2026-01/Costco-January-2026-Coupon-Book-Page-2.jpg

If all 4 URLs work, your app is fully functional! 🎉

## Git Commits Included:

```
d8ec37c - Add item-to-page mapping for individual coupon images
dd1b07d - Add debug logging to troubleshoot View Coupon button visibility
6fcf5a8 - Add 'View Coupon' button to show coupon images in modal
3268b04 - Add ability to edit receipt date after saving
9ea445f - Add toggle to show/hide expired adjustments and sort by date
191636e - Fix: Reject receipts too old for price adjustment
1b74620 - Fix price adjustment logic for correct promotion window handling
```

## Features Now Complete:

✅ Upload receipts with OCR
✅ Upload coupons (admin-only)
✅ View all purchases
✅ Calculate price adjustments automatically
✅ Correct 30-day before/after promotion logic
✅ Sort by date (oldest first)
✅ Show/hide expired adjustments
✅ Edit receipt date after saving
✅ **View actual coupon page image** ← NEW!
✅ Item-to-page mapping for specific images
✅ Centralized monthly coupon data on GitHub

## Next Month Setup (February 2026 Coupons):

When the next coupon book comes out:

1. Use the review page at: `/Users/riteshmaharjan/Downloads/costcoDecember/review-coupons.html`
2. Update dates to new month
3. Process new coupon images
4. Download `2026-02.json`
5. Upload images to `coupons/images/2026-02/`
6. Add new month to `item-to-page-mapping.json`
7. Push to GitHub

Users will automatically get the new coupons!
