# 💼 FinPassport Web Dashboard

Web dashboard for FinPassport - Personal finance & asset management.

## 🚀 Features

- ✅ **Dashboard** - Net worth, liquid balance, income/expense stats
- ✅ **Accounts Management** - Create, view, and manage all account types
- ✅ **Transactions** - Add income, expenses, transfers with automatic balance updates
- ✅ **Mobile-Responsive** - Works perfectly on phones and desktops
- ✅ **Real-time Sync** - Connects to Supabase for instant data access

## 🏗️ Tech Stack

- **Framework:** Next.js 15 + React 19
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Icons:** Lucide React
- **TypeScript:** Full type safety

## 📦 Setup

### 1. Clone & Install

```bash
cd finpassport-web
npm install
```

### 2. Configure Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📱 Mobile Access

The dashboard is fully responsive. Access from:
- **Desktop:** Full feature set with optimal layout
- **Tablet:** Adaptive grid layout
- **Mobile:** Touch-optimized UI, works great on phones

## 🎯 Features Roadmap

### ✅ Phase 1 (Done)
- Dashboard with key stats
- Account CRUD
- Transaction CRUD with balance updates
- Mobile-responsive design

### ⏳ Phase 2 (Next)
- [ ] Charts (income/expense trends, asset performance)
- [ ] Expense categories
- [ ] Asset valuations
- [ ] Search & filters
- [ ] Export data (CSV, PDF)

### 🔮 Phase 3 (Future)
- [ ] Multi-user authentication
- [ ] Budget tracking
- [ ] Financial goals
- [ ] Recurring transactions
- [ ] Multi-currency support

## 🔐 Authentication

Currently using mock user ID for development. Replace `00000000-0000-0000-0000-000000000000` with actual Supabase auth when ready.

## 🗄️ Database Schema

See `../finpassport-ios/SUPABASE_SCHEMA.md` for complete schema.

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

### Environment Variables on Vercel
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

**Status:** ✅ MVP Complete  
**Version:** 0.1.0  
**Last Updated:** 2026-02-14
