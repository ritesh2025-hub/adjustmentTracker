# Receipt & Coupon Price Tracker

A client-side web application that helps you track your purchases and find price adjustment opportunities by comparing receipt prices with current coupon prices.

## Features

- 📸 **Receipt OCR**: Upload receipt images and automatically extract items, prices, and dates
- 🎫 **Coupon Tracking**: Upload coupon images to track current sale prices
- 💰 **Price Comparison**: Automatically find items eligible for price adjustments
- 📊 **Purchase History**: View all your purchases filtered by date range
- 🔒 **Privacy-Focused**: All data stays in your browser (IndexedDB), no server needed
- 📱 **Mobile-Friendly**: Responsive design works on desktop and mobile devices

## How to Use

### 1. Open the Application

Simply open `index.html` in your web browser. No installation or server required!

For best experience, use:
- Google Chrome
- Microsoft Edge
- Firefox
- Safari

### 2. Upload Receipts

1. Click on the "📸 Upload Receipt" tab
2. Drag and drop a receipt image or click "Browse Files"
3. Wait for OCR processing (2-10 seconds)
4. Review and edit the parsed items if needed
5. Set the purchase date
6. Click "Save Receipt"

**Tips for Better OCR Results**:
- Take clear, well-lit photos
- Ensure text is readable
- Avoid shadows and glare
- Hold camera steady

### 3. Upload Coupons

1. Click on the "🎫 Upload Coupon" tab
2. Upload a coupon image
3. Review parsed item numbers and prices
4. Set valid dates
5. Click "Save Coupon"

### 4. View Price Comparisons

1. Click on the "💵 Price Comparisons" tab
2. See all items where current coupon prices are lower than what you paid
3. Only items purchased within the adjustment window (default: 30 days) are eligible
4. Mark adjustments as claimed when you get your refund

### 5. Manage Purchases

1. Click on the "📋 My Purchases" tab
2. Filter by date range
3. Sort by date or total amount
4. View receipt details or delete old receipts

### 6. Configure Settings

1. Click on the "⚙️ Settings" tab
2. Adjust the price adjustment window (default: 30 days)
3. Set a default store name
4. Export/import data for backup
5. Clear all data if needed

## Price Adjustment Policy

Most major retailers offer price adjustments if:
- The item goes on sale within 14-30 days of purchase
- You have the original receipt
- The item is in stock
- You present the current sale price/coupon

**Always check your store's specific policy!**

Common retailers with price adjustment policies:
- **Target**: 14 days
- **Best Buy**: 15 days (Elite/Plus members get longer)
- **Walmart**: Varies by item
- **Home Depot**: 30 days (some exclusions)
- **Costco**: Anytime for many items

## Data Storage

All data is stored locally in your browser using IndexedDB:
- **Receipts**: Purchase date, items, prices
- **Coupons**: Valid dates, item numbers, sale prices
- **Settings**: Adjustment window, preferences

**Important**:
- Data is NOT synced across devices
- Clearing browser data will delete your receipts
- Use the Export feature to create backups!

## Troubleshooting

### OCR Not Working
- Ensure you're using a supported browser
- Check that JavaScript is enabled
- Try preprocessing your image (crop, enhance contrast)
- Manually enter data if OCR fails

### Receipt Parsing Issues
- Receipts vary greatly in format
- Always review and edit parsed data before saving
- You can manually add or edit items

### No Price Comparisons Found
- Make sure you've uploaded both receipts AND coupons
- Check that item numbers match between receipts and coupons
- Verify dates are within the adjustment window

### Browser Compatibility
- Works best in Chrome, Edge, Firefox, Safari
- Requires IndexedDB support
- Requires JavaScript enabled

## Development & Deployment

### Local Development

1. Clone or download this repository
2. Open `index.html` in a web browser
3. No build process or dependencies needed!

### Deployment Options

**Option 1: GitHub Pages** (Recommended)
1. Create a GitHub repository
2. Push all files
3. Enable GitHub Pages in settings
4. Access via `https://username.github.io/repo-name`

**Option 2: Netlify/Vercel**
1. Create account on Netlify or Vercel
2. Drag-and-drop the folder
3. Get instant HTTPS URL

**Option 3: Local HTTP Server**
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# Then open http://localhost:8000
```

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **OCR**: Tesseract.js (client-side OCR library)
- **Storage**: IndexedDB (browser database)
- **No Backend Required**: 100% client-side application

## Privacy & Security

✅ **All data stays on your device**
- No data sent to external servers
- No tracking or analytics
- No user accounts required

✅ **Your images are safe**
- Processed locally in your browser
- Not uploaded anywhere
- You can delete them anytime

## Future Enhancements

Potential features for future versions:
- Barcode scanning for easier item entry
- Cloud sync across devices
- Automatic price checking via store APIs
- Budget tracking and spending analytics
- Receipt categories (groceries, electronics, etc.)
- Email notifications for expiring adjustments
- Multi-store support with different policies

## License

This project is free to use and modify. No warranty provided.

## Support

For issues or questions:
- Check this README
- Review the troubleshooting section
- Verify your browser is up-to-date

## Credits

- **Tesseract.js**: OCR library
- **IndexedDB**: Browser storage API

---

**Happy Saving!** 💰

Remember: Always check your store's specific price adjustment policy and keep your receipts!
