# 🏗️ Shared Expenses Feature Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FinPassport Web Dashboard                │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │    Trips     │  │   Expenses   │      │
│  │      /       │  │   /trips     │  │  /expenses   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                            ▼                                 │
│                  ┌─────────────────┐                        │
│                  │  Supabase SDK   │                        │
│                  └─────────────────┘                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Database Tables                      │ │
│  │                                                          │ │
│  │  trips              trip_participants                   │ │
│  │  ├─ id              ├─ id                               │ │
│  │  ├─ user_id         ├─ trip_id (FK)                     │ │
│  │  ├─ name            ├─ user_id (FK, nullable)           │ │
│  │  ├─ currency        ├─ email                            │ │
│  │  ├─ dates           ├─ name                             │ │
│  │  └─ status          └─ status                           │ │
│  │                                                          │ │
│  │  trip_expenses      trip_expense_splits                 │ │
│  │  ├─ id              ├─ id                               │ │
│  │  ├─ trip_id (FK)    ├─ trip_expense_id (FK)            │ │
│  │  ├─ amount          ├─ participant_id (FK)              │ │
│  │  ├─ category        ├─ amount                           │ │
│  │  ├─ paid_by (FK)    └─ share                            │ │
│  │  └─ split_method                                        │ │
│  │                                                          │ │
│  │  trip_settlements                                       │ │
│  │  ├─ id                                                  │ │
│  │  ├─ trip_id (FK)                                        │ │
│  │  ├─ from_participant_id (FK)                           │ │
│  │  ├─ to_participant_id (FK)                             │ │
│  │  ├─ amount                                              │ │
│  │  └─ status                                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   SQL Functions                         │ │
│  │                                                          │ │
│  │  calculate_trip_balances(trip_id)                      │ │
│  │  ├─ Calculates total_paid per participant              │ │
│  │  ├─ Calculates total_owed per participant              │ │
│  │  └─ Returns net_balance for each                       │ │
│  │                                                          │ │
│  │  suggest_trip_settlements(trip_id)                     │ │
│  │  ├─ Gets balances from above                           │ │
│  │  ├─ Optimizes payment flow (greedy algorithm)          │ │
│  │  └─ Returns minimal set of transactions                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Row Level Security (RLS)                   │ │
│  │                                                          │ │
│  │  Users can only access:                                │ │
│  │  • Trips they created (user_id = auth.uid())           │ │
│  │  • Trips they're a participant in                      │ │
│  │  • Related expenses, splits, settlements               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Page Flow Diagram

```
┌──────────────────┐
│   Dashboard (/)  │
│                  │
│  [Shared Trips]  │────────┐
│  [All Expenses]  │────┐   │
└──────────────────┘    │   │
                        │   │
        ┌───────────────┘   │
        │                   │
        ▼                   ▼
┌──────────────────┐   ┌──────────────────┐
│  Trips List      │   │  All Expenses    │
│  /trips          │   │  /expenses       │
│                  │   │                  │
│  [+ New Trip]────┼───┼──────────────────┼───┐
│                  │   │                  │   │
│  Trip Cards:     │   │  Monthly Groups: │   │
│  ├─ Trip 1 ──────┼─┐ │  ├─ Feb 2026     │   │
│  ├─ Trip 2       │ │ │  ├─ Jan 2026     │   │
│  └─ Trip 3       │ │ │  └─ Dec 2025     │   │
└──────────────────┘ │ └──────────────────┘   │
                     │                        │
        ┌────────────┘                        │
        │                                     │
        ▼                                     ▼
┌──────────────────┐                  ┌──────────────────┐
│  Trip Detail     │                  │  Create Trip     │
│  /trips/[id]     │                  │  /trips/new      │
│                  │                  │                  │
│  Tabs:           │                  │  ┌────────────┐  │
│  ┌─────────────┐ │                  │  │ Trip Form  │  │
│  │  Expenses   │ │                  │  ├────────────┤  │
│  ├─────────────┤ │                  │  │ Add People │  │
│  │  Balances   │ │                  │  └────────────┘  │
│  ├─────────────┤ │                  │                  │
│  │ Settlements │ │                  │  [Create] ───────┼─┐
│  └─────────────┘ │                  └──────────────────┘ │
│                  │                                       │
│  [+ Add Expense] │                                       │
└──────────────────┘                                       │
                                                           │
                   ┌───────────────────────────────────────┘
                   │
                   ▼
            (Creates new trip,
             redirects to /trips)
```

---

## Data Flow: Creating an Expense

```
User Action                  Frontend                    Backend
─────────────────────────────────────────────────────────────────

1. Click "Add Expense"
                        ┌──────────────┐
                        │ Open Modal   │
                        └──────────────┘
                               │
2. Enter details        ┌──────────────┐
   (amount, category,   │ Form State   │
    description)        └──────────────┘
                               │
3. Select payer         ┌──────────────┐
                        │ Participant  │
                        │  Dropdown    │
                        └──────────────┘
                               │
4. Choose split method  ┌──────────────┐
   (equal/custom)       │ Split Method │
                        │   Selection  │
                        └──────────────┘
                               │
5. Submit               ┌──────────────┐
                        │   API Call   │────────┐
                        └──────────────┘        │
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │ INSERT INTO     │
                                        │ trip_expenses   │
                                        └─────────────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │ Calculate splits│
                                        │ (equal/custom)  │
                                        └─────────────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │ INSERT INTO     │
                                        │ expense_splits  │
                                        │ (per person)    │
                                        └─────────────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │ Update balances │
                                        │ (via function)  │
                                        └─────────────────┘
                                                 │
6. UI updates           ┌──────────────┐◄───────┘
                        │ Refresh data │
                        │ Show success │
                        └──────────────┘
```

---

## Balance Calculation Algorithm

```sql
-- How it works:

1. Calculate what each person PAID
   SELECT paid_by_participant_id, SUM(amount)
   FROM trip_expenses
   GROUP BY paid_by_participant_id

2. Calculate what each person OWES
   SELECT participant_id, SUM(amount)
   FROM trip_expense_splits
   GROUP BY participant_id

3. Compute NET BALANCE
   net_balance = total_paid - total_owed

   If positive (+): Person should RECEIVE money
   If negative (-): Person should PAY money
   If zero (0):     Person is SETTLED
```

### Example:
```
Trip to Kyiv (3 people):
- Alice paid 6000 UAH (hotel)
- Bob paid 2700 UAH (dinners + taxi)
- Carol paid 2000 UAH (groceries)
Total: 10700 UAH

Each should owe: 10700 / 3 = 3566.67 UAH

Balances:
- Alice: paid 6000, owes 3566.67 → +2433.33 (receives)
- Bob:   paid 2700, owes 3566.67 → -866.67  (pays)
- Carol: paid 2000, owes 3566.67 → -1566.67 (pays)

Settlements (optimized):
- Carol pays Alice: 1566.67
- Bob pays Alice:   866.67
Total transactions: 2 (minimized!)
```

---

## Component Hierarchy

```
Dashboard (/)
├─ Header
├─ Stats Cards (4)
│  ├─ Net Worth
│  ├─ Liquid Balance
│  ├─ Income
│  └─ Expenses
├─ Quick Actions (NEW)
│  ├─ Shared Trips Card → /trips
│  └─ All Expenses Card → /expenses
├─ Accounts Section
└─ Recent Transactions


Trip List (/trips)
├─ Header
├─ Stats Cards (3)
│  ├─ Total Trips
│  ├─ Active Trips
│  └─ Settled Trips
├─ Filter Tabs
│  ├─ All
│  ├─ Active
│  └─ Settled
└─ Trip Cards Grid
   └─ TripCard (for each trip)
      ├─ Name & Status
      ├─ Dates
      ├─ Participant Avatars
      └─ Total Spent


Create Trip (/trips/new)
├─ Header
├─ Trip Details Form
│  ├─ Name
│  ├─ Description
│  ├─ Currency
│  └─ Dates
├─ Add Participants
│  ├─ Email + Name inputs
│  ├─ Add button
│  └─ Participant list
│     └─ ParticipantCard (removable)
└─ Actions
   ├─ Cancel
   └─ Create


Trip Detail (/trips/[id])
├─ Header
├─ Stats Cards (4)
│  ├─ Total Spent
│  ├─ Participants
│  ├─ Expenses
│  └─ Per Person
├─ Tabs
│  ├─ Expenses Tab
│  │  └─ ExpenseList
│  │     └─ ExpenseRow (for each)
│  ├─ Balances Tab
│  │  └─ BalanceCards
│  │     └─ BalanceCard (for each participant)
│  └─ Settlements Tab
│     └─ SettlementList
│        └─ SettlementRow (for each)
└─ [+ Add Expense] FAB


All Expenses (/expenses)
├─ Header
├─ Stats Cards (3)
│  ├─ This Month
│  ├─ Total Count
│  └─ Lifetime Total
├─ Filters
│  ├─ Search Input
│  └─ Category Dropdown
└─ Monthly Groups
   └─ MonthSection (for each month)
      ├─ Month Header + Total
      └─ ExpenseList
         └─ ExpenseRow (for each)
```

---

## File Structure

```
finpassport-web/
├── app/
│   ├── page.tsx              # Dashboard (updated)
│   ├── layout.tsx
│   ├── globals.css
│   ├── trips/
│   │   ├── page.tsx          # Trip list
│   │   ├── new/
│   │   │   └── page.tsx      # Create trip
│   │   └── [id]/
│   │       └── page.tsx      # Trip detail
│   └── expenses/
│       └── page.tsx          # All expenses
├── lib/
│   ├── supabase.ts
│   └── types.ts              # Updated with trip types
├── supabase-schema-v2.sql    # Migration file
├── SHARED_EXPENSES_IMPLEMENTATION.md
└── package.json
```

---

## Technology Stack

### Frontend:
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State:** React useState (will add React Query for real data)

### Backend:
- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth (ready to integrate)
- **Storage:** Supabase Storage (for receipts, future)
- **Real-time:** Supabase Realtime (ready to integrate)

### Security:
- **Row Level Security (RLS):** Enabled on all tables
- **Auth Context:** Uses `auth.uid()` for user isolation
- **HTTPS:** Enforced in production

---

## API Endpoints (To Be Implemented)

```typescript
// Trips
GET    /api/trips              - List user's trips
POST   /api/trips              - Create new trip
GET    /api/trips/[id]         - Get trip details
PATCH  /api/trips/[id]         - Update trip
DELETE /api/trips/[id]         - Delete/archive trip

// Participants
POST   /api/trips/[id]/participants       - Add participant
DELETE /api/trips/[id]/participants/[pid] - Remove participant

// Expenses
GET    /api/trips/[id]/expenses           - List trip expenses
POST   /api/trips/[id]/expenses           - Create expense
PATCH  /api/trips/[id]/expenses/[eid]     - Update expense
DELETE /api/trips/[id]/expenses/[eid]     - Delete expense

// Balances
GET    /api/trips/[id]/balances           - Get all balances
GET    /api/trips/[id]/settlements        - Get settlement suggestions

// Settlements
POST   /api/trips/[id]/settlements        - Record payment
PATCH  /api/trips/[id]/settlements/[sid]  - Update payment status
```

---

## Status & Next Steps

### ✅ Phase 1: Complete (Current)
- Database schema designed
- TypeScript types defined
- UI/UX implemented
- Pages built with mock data
- Mobile-responsive design
- Git committed & pushed

### ⏳ Phase 2: Supabase Integration (Next)
- Run migration
- Connect Supabase client
- Implement CRUD operations
- Add real-time subscriptions
- Implement email invitations

### 🔮 Phase 3: Advanced Features (Future)
- Receipt photo uploads
- Export to PDF/CSV
- Advanced splitting (percentage, shares)
- Payment integration (PayPal, Venmo)
- Recurring expenses
- Budget tracking
- Analytics dashboard

---

**Architecture designed by:** Subagent (finpassport-implementation)  
**Date:** February 21, 2026  
**Status:** Production-ready schema, UI complete with mock data
