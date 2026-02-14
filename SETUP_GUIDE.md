# 🚀 Quick Setup Guide

## Step 1: Configure Supabase

1. Go to your Supabase project: https://supabase.com/dashboard
2. Copy these values:
   - **Project URL:** Settings → API → Project URL
   - **Anon Key:** Settings → API → Project API keys → `anon public`

3. Update `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
```

## Step 2: Setup Database

Run the SQL from `../finpassport-ios/SUPABASE_SCHEMA.md` in Supabase SQL Editor:
- Create `accounts` table
- Create `transactions` table
- Create `expense_categories` table
- Create `asset_valuations` table

## Step 3: Run Development Server

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Step 4: Test It Out

1. **Add an account:**
   - Click "Add Account"
   - Name: "Main Wallet", Type: Storage, Currency: USD, Balance: 1000
   - Create

2. **Add a transaction:**
   - Click "Add Transaction"
   - From: None (income), To: Main Wallet, Amount: 500
   - Create
   - Watch the balance update!

## 📱 Access from Phone

### Option A: Local Network
```bash
npm run dev -- -H 0.0.0.0
```
Then access from phone: `http://YOUR_LOCAL_IP:3000`

### Option B: Deploy to Vercel (Free)
```bash
npm install -g vercel
vercel --prod
```
Add env vars in Vercel dashboard, then access from anywhere!

---

## 🐛 Troubleshooting

**"Failed to fetch"**
- Check Supabase URL and key in `.env.local`
- Verify database tables exist

**"Empty dashboard"**
- Add some accounts and transactions first
- Check browser console for errors

**"Can't access from phone"**
- Make sure phone is on same WiFi
- Use `0.0.0.0` host flag
- Check firewall settings

---

**Need help?** Check README.md or ping Petrulio 🚀
