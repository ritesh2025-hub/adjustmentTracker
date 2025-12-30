# Admin Guide - Receipt Tracker

## How Admin Mode Works

### For Regular Users:
- Access: `https://ritesh2025-hub.github.io/adjustmentTracker/`
- Can **ONLY**:
  - Upload receipts
  - View their purchases
  - See price comparisons with pre-loaded coupons
- **CANNOT**:
  - Upload new coupons
  - See "Upload Coupon" tab

### For Admin (You):
- Access: `https://ritesh2025-hub.github.io/adjustmentTracker/?admin=true`
- OR: `https://ritesh2025-hub.github.io/adjustmentTracker/#admin`
- Can **DO EVERYTHING**:
  - Upload receipts
  - **Upload new coupons** (special tab appears)
  - View all purchases
  - See price comparisons

---

## 🔐 Admin URL

**Your Admin URL:**
```
https://ritesh2025-hub.github.io/adjustmentTracker/?admin=true
```

**Bookmark this URL** - don't share it with regular users!

---

## 📝 How to Add Coupons (2 Ways)

### Method 1: Upload via Admin Panel (Easy)
1. Go to your admin URL above
2. Click **"🎫 Upload Coupon (Admin)"** tab
3. Upload coupon image
4. Review OCR results
5. Click "Save Coupon"
6. ✅ Done! All users will see this coupon immediately

### Method 2: Edit default-coupons.json (Manual)
1. Edit `/app1/js/default-coupons.json` file
2. Add your coupon data:
```json
{
  "validFrom": "2025-01-01",
  "validUntil": "2025-02-28",
  "items": [
    {
      "itemNumber": "1234567",
      "description": "Product Name",
      "salePrice": 19.99,
      "discount": 0
    }
  ]
}
```
3. Upload to GitHub
4. ✅ Done! New users will see these coupons

---

## 🎯 Default Coupons

The app automatically loads default coupons from `js/default-coupons.json` on first use.

**Current default coupons include:**
- Kirkland Organic Extra Virgin Olive Oil (Item #1587186) - $10 OFF
- Kirkland Paper Towels (Item #1234567) - $15.99
- Organic Eggs (Item #7654321) - $3.50 OFF
- Rotisserie Chicken (Item #9876543) - $4.99
- Kirkland Vitamin D3 (Item #5555555) - $7.00 OFF

**To update defaults:**
1. Edit `js/default-coupons.json`
2. Upload to GitHub
3. New users will get updated coupons
4. Existing users: they'll keep their old data (won't auto-update)

---

## 🔒 Security Notes

**Admin access is URL-based:**
- ✅ Simple and works without login system
- ✅ No database or authentication needed
- ⚠️ Anyone with the admin URL can upload coupons
- 💡 **Don't share the `?admin=true` URL publicly**

**To make it more secure (optional):**
- Change `admin=true` to a secret code like `?key=yourSecretCode123`
- Update the check in `app.js` line 7:
```javascript
const isAdmin = window.location.search.includes('key=yourSecretCode123');
```

---

## 📤 Uploading Changes to GitHub

After adding coupons or making changes:

### Browser Method (Easiest):
1. Go to: https://github.com/ritesh2025-hub/adjustmentTracker
2. Click the file you want to update (e.g., `js/default-coupons.json`)
3. Click the pencil icon (Edit)
4. Make your changes
5. Scroll down, click "Commit changes"
6. Wait 2-3 minutes for GitHub Pages to update
7. ✅ Changes are live!

---

## 👥 Sharing with Users

**Regular User URL:**
```
https://ritesh2025-hub.github.io/adjustmentTracker/
```

**Tell them:**
- Upload your receipts
- Check "Price Comparisons" tab to see potential refunds
- All data stays on your device
- Works on any phone/computer

---

## 🐛 Troubleshooting

**Admin tab not showing:**
- Make sure URL has `?admin=true` at the end
- Clear browser cache and reload

**Coupons not appearing for users:**
- Check `default-coupons.json` is valid JSON
- Check GitHub Pages is deployed successfully
- Users may need to clear browser data to reload defaults

**Changes not appearing:**
- Wait 2-3 minutes after GitHub commit
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check https://github.com/ritesh2025-hub/adjustmentTracker/deployments

---

## 📊 User Data Privacy

**Important:**
- Each user's data is stored **only on their device**
- You **cannot see** what receipts users upload
- Users **cannot see** each other's data
- Only the **coupon data you upload** is shared (public)

---

## Questions?

Check the main README.md or refer to the code comments in:
- `js/app.js` - Admin detection logic (line 7)
- `js/database.js` - Default coupon loading (line 64)
- `index.html` - Admin-only elements (class="admin-only")
