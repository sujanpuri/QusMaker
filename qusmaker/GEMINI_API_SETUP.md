# Gemini API Setup Guide

## How to Check and Fix OCR Errors

### Step 1: Test Your API Key

1. **Go to the test page**: Navigate to `http://localhost:3000/test-ocr` in your browser
2. **Click "Test API Key"** button
3. **Check the results**:
   - ✅ Green box = API key is working
   - ❌ Red box = There's a problem

### Step 2: Check Browser Console for Detailed Errors

1. Open your browser's Developer Tools (press `F12`)
2. Go to the **Console** tab
3. Try using the OCR feature
4. Look for error messages that start with:
   - 🔍 (magnifying glass) = Debug info
   - ✅ (green check) = Success messages
   - ❌ (red X) = Error messages

### Step 3: Set Up Your API Key (If Not Working)

#### Get Your API Key:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the API key (it looks like: `AIzaSyB...`)

#### Configure Your Project:
1. **Create a `.env.local` file** in your project root directory (same folder as `package.json`)
   ```
   d:\Coding\Next.js\Projects\QusMaker\qusmaker\.env.local
   ```

2. **Add this line** to the file:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyB74jiUBmunfU6w1jUAgZYjAd9CYscq7-s
   ```
   (Replace with your actual API key from Google)

3. **Restart your development server**:
   - Stop the server (Ctrl+C in terminal)
   - Start it again: `npm run dev`

### Common Error Messages and Solutions

| Error Message | Solution |
|--------------|----------|
| "API Key not found" | Create `.env.local` file with your API key |
| "Invalid API key" | Check if you copied the full key correctly |
| "API key not configured" | Restart dev server after creating `.env.local` |
| "401 Unauthorized" | Your API key is invalid or expired - get a new one |
| "429 Too Many Requests" | You've exceeded API quota - wait or upgrade plan |
| "Network error" | Check your internet connection |

### Step 4: Verify Everything Works

1. Go back to `http://localhost:3000/test-ocr`
2. Click "Test API Key" again
3. You should see ✅ "API Key is working correctly!"
4. Now try using the OCR feature in the editor

### Additional Help

#### Where to Check Logs:
- **Browser Console** (F12) - Shows all OCR processing logs
- **Terminal** - Shows server-side errors
- **Test Page** - `http://localhost:3000/test-ocr`

#### Your Current API Key (from code):
The fallback API key in your code is: `AIzaSyB74jiUBmunfU6w1jUAgZYjAd9CYscq7-s`

**⚠️ Warning:** Having API keys directly in code is not recommended for production. Always use environment variables!

#### Still Having Issues?

1. Check the browser console for the exact error message
2. Make sure the `.env.local` file is in the correct location
3. Verify you restarted the dev server after creating/modifying `.env.local`
4. Test your API key at the test page first
5. Check if you have internet connection

### Quick Checklist:

- [ ] Created `.env.local` file
- [ ] Added `NEXT_PUBLIC_GEMINI_API_KEY=your_key_here`
- [ ] Restarted development server
- [ ] Tested at `/test-ocr` page
- [ ] Checked browser console (F12) for errors
- [ ] API key is valid and not expired
