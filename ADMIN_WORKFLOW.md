# Admin Workflow - Monthly Coupon Management

## 🎯 How It Works Now

### **Old Way (What we had before):**
- Admin uploads coupon → Saves to browser's IndexedDB
- Each user has their own local coupons
- Data doesn't sync between users

### **New Way (Current system):**
- Admin uploads coupon → Downloads monthly JSON file
- Admin uploads JSON to GitHub → All users get same coupons
- Centralized coupon management! 🎉

---

## 📅 Monthly JSON Structure

Coupons are organized by month in the `coupons/` folder:

```
coupons/
├── 2025-01.json   (January 2025 coupons)
├── 2025-02.json   (February 2025 coupons)
├── 2025-03.json   (March 2025 coupons)
└── ... (and so on)
```

Each file contains:
```json
{
  "month": "2025-01",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "coupons": [
    {
      "id": "coupon_2025_01_001",
      "validFrom": "2025-01-01",
      "validUntil": "2025-01-31",
      "items": [
        {
          "itemNumber": "1587186",
          "description": "Kirkland Olive Oil",
          "salePrice": 0,
          "discount": 10.00
        }
      ]
    }
  ]
}
```

---

## 🔑 Admin Workflow: Add a New Coupon

### Step 1: Access Admin Mode
Go to: `https://ritesh2025-hub.github.io/adjustmentTracker/?admin=true`

### Step 2: Upload Coupon
1. Click **"🎫 Upload Coupon (Admin)"** tab
2. Upload coupon image (or take photo)
3. Wait for OCR to process
4. Review and edit parsed data:
   - Item numbers
   - Descriptions
   - Sale prices or discounts
   - Valid from/until dates

### Step 3: Save Coupon
1. Click **"Save Coupon"**
2. A JSON file will **automatically download** (e.g., `2025-01.json`)
3. An **alert popup** shows upload instructions

### Step 4: Upload to GitHub

**First time adding a coupon for this month:**
1. Go to: `https://github.com/ritesh2025-hub/adjustmentTracker/tree/main/coupons`
2. Click **"Add file"** → **"Upload files"**
3. Drag the downloaded `2025-01.json` file
4. Click **"Commit changes"**
5. ✅ Done! Wait 2-3 minutes for GitHub Pages to update

**Adding another coupon to the same month:**
1. Download the existing `2025-01.json` from GitHub
2. Open it in a text editor
3. Manually merge the new coupon into the `coupons` array
4. Upload the merged file back to GitHub

---

## 🔄 How Users See Coupons

### Automatic Loading
- App loads coupons from:
  - **Current month** file (e.g., `2025-01.json`)
  - **Next month** file (e.g., `2025-02.json`) - for overlapping dates
- Users DON'T need to upload coupons
- All users see the SAME coupons automatically

### When Comparisons Happen
- User uploads receipt
- Goes to **"Price Comparisons"** tab
- App fetches monthly coupons from GitHub
- Calculates potential adjustments
- Shows results!

---

## 📝 Example: Adding Multiple Coupons

Let's say you want to add 3 coupons in January 2025:

### Manual Merge Method (Recommended):

**After uploading first coupon:**
```json
{
  "month": "2025-01",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "coupons": [
    {
      "id": "coupon_2025_01_001",
      "validFrom": "2025-01-01",
      "validUntil": "2025-01-31",
      "items": [...]
    }
  ]
}
```

**After adding second and third coupons, merge to:**
```json
{
  "month": "2025-01",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "coupons": [
    {
      "id": "coupon_2025_01_001",
      ...
    },
    {
      "id": "coupon_2025_01_002",
      ...
    },
    {
      "id": "coupon_2025_01_003",
      ...
    }
  ]
}
```

---

## 🚨 Important Notes

### Monthly File Organization
- Coupons are grouped by their **validUntil** month
- Example: Coupon valid Jan 15 - Feb 15:
  - Goes in `2025-02.json` (expires in February)
  - App loads both current + next month files automatically

### Data Storage
- ❌ **NOT** stored in user's browser anymore
- ✅ **Stored** centrally on GitHub
- ✅ All users get live updates from GitHub

### Manual Merging Required
- Currently, you must manually merge multiple coupons for the same month
- **Future improvement**: Could build a merge tool in the app

---

## 🔧 Troubleshooting

### "Coupons not showing for users"
1. Check GitHub: Does `coupons/2025-01.json` exist?
2. Wait 2-3 minutes after uploading for GitHub Pages to deploy
3. Users may need to hard refresh (Ctrl+Shift+R)

### "Download didn't work"
- Check browser's download folder
- Make sure popup blockers aren't blocking the download

### "JSON file looks wrong"
- Validate JSON at https://jsonlint.com/
- Check for missing commas, brackets, quotes

---

## 📊 Admin URLs to Bookmark

| Purpose | URL |
|---------|-----|
| **Admin Panel** | https://ritesh2025-hub.github.io/adjustmentTracker/?admin=true |
| **GitHub Coupons Folder** | https://github.com/ritesh2025-hub/adjustmentTracker/tree/main/coupons |
| **GitHub Upload** | https://github.com/ritesh2025-hub/adjustmentTracker/upload/main/coupons |
| **Regular User URL** | https://ritesh2025-hub.github.io/adjustmentTracker/ |

---

## 🎓 Quick Reference

**To add ONE coupon:**
1. Admin URL → Upload Coupon tab
2. Upload image → Save
3. Download JSON → Upload to GitHub

**To add MULTIPLE coupons (same month):**
1. Follow steps above for first coupon
2. For additional coupons:
   - Upload → Save → Download JSON
   - Manually merge into existing monthly file
   - Upload merged file to GitHub

**To update an existing coupon:**
1. Download current monthly JSON from GitHub
2. Edit the JSON file manually
3. Upload back to GitHub

---

## 💡 Tips

- Keep a local backup of monthly JSON files
- Use a JSON validator before uploading to GitHub
- Test with a sample receipt after uploading new coupons
- Name your coupon IDs descriptively for easy tracking

---

Need help? Check the code in:
- `js/coupon-manager.js` - Monthly JSON generation
- `js/app.js` - Admin save coupon workflow
- `js/database.js` - Monthly coupon loading
