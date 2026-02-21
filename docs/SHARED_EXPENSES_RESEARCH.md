# Shared Expense Tracking Apps: Research & Best Practices

**Research Date:** February 21, 2026  
**Purpose:** Guide implementation of shared expense features in FinPassport  
**Apps Analyzed:** Splitwise, Tricount, Settle Up

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Market Overview](#market-overview)
3. [How Splitwise Works](#how-splitwise-works)
4. [Database Schema Design](#database-schema-design)
5. [Expense Splitting Algorithms](#expense-splitting-algorithms)
6. [Settlement Flow & Debt Simplification](#settlement-flow--debt-simplification)
7. [Multi-Currency Handling](#multi-currency-handling)
8. [UX Patterns & Best Practices](#ux-patterns--best-practices)
9. [Recommended Schema for FinPassport](#recommended-schema-for-finpassport)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

Shared expense tracking apps solve a critical problem: managing group finances without the friction of manual calculations and tracking who owes whom. The market leaders (Splitwise, Tricount, Settle Up) have refined their approaches over years of real-world usage.

**Key Findings:**
- **Algorithm Choice:** Debt simplification is NP-Complete; successful apps use greedy algorithms with O(V²) complexity
- **UX Priority:** Minimize friction in expense entry; defer complex tasks (like inviting users)
- **Multi-Currency:** Essential for travel; requires base currency + conversion tracking
- **Settlement Flow:** Simple "Settle Up" button with partial payment support
- **Database Design:** Core entities are Users, Groups, Expenses, and Splits (many-to-many relationships)

---

## Market Overview

### Splitwise (Market Leader)
- **Founded:** 2011
- **Valuation:** ~$100 million
- **Team Size:** 10-50 employees
- **Business Model:** Freemium (Pro features include receipt scanning, charts, in-app payments)
- **Core Philosophy:** "Keep it simple, make it fair"

### Tricount
- **Owned by:** bunq (acquired)
- **Unique Feature:** Splitwise importer (easy migration)
- **Strength:** Multi-currency support, detailed expense breakdowns
- **Target:** European travelers

### Settle Up
- **Focus:** Simplicity over features
- **Strength:** Clean UI, quick settlement suggestions
- **Limitation:** Fewer integrations than competitors

---

## How Splitwise Works

### Core Workflow

1. **Sign Up** → Create account with email/phone
2. **Create Group** → Define who's in the group (roommates, trip buddies, etc.)
3. **Add Expenses** → Log bills with details:
   - Total cost
   - Who paid
   - How to split (equal, percentage, exact amounts, shares)
   - Category, date, notes, receipt photo
4. **View Balances** → See who owes what at a glance
5. **Settle Up** → Record payments (cash, PayPal, Venmo, bank transfer)

### Key Features

#### 1. **Expense Splitting Methods**
- **Equal Split:** Divide total by number of people (e.g., $100 ÷ 4 = $25 each)
- **Exact Amounts:** Manually assign specific amounts per person
- **Percentage:** Split by proportions (e.g., 60/40 split)
- **Shares:** Split by weighted shares (e.g., 2:1:1 ratio)

#### 2. **Simplify Debts**
Splitwise's killer feature that minimizes transactions. Example:
- Before: A owes B $20, B owes C $20 (2 transactions)
- After: A owes C $20 (1 transaction)

**Rules for debt simplification:**
1. Everyone owes the same net amount at the end
2. No one owes a person they didn't owe before (in basic mode)
3. No one owes more money than before simplification

#### 3. **Non-Group Expenses**
Not everything needs a group. Splitwise allows one-off expenses between individuals without creating a formal group.

#### 4. **Activity Feed**
Every action (add expense, edit, settle up, join group) is logged and visible to all participants.

---

## Database Schema Design

### Core Entities

#### Users Table
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(100) NOT NULL,
    profile_image_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Groups Table
```sql
CREATE TABLE groups (
    group_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    currency_code VARCHAR(3) DEFAULT 'USD',
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### Group Members (Join Table)
```sql
CREATE TABLE group_members (
    group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id),
    role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
);
```

#### Expenses Table
```sql
CREATE TABLE expenses (
    expense_id UUID PRIMARY KEY,
    group_id UUID REFERENCES groups(group_id), -- NULL for non-group expenses
    description VARCHAR(255) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'USD',
    category VARCHAR(50), -- 'food', 'transport', 'utilities', etc.
    expense_date DATE NOT NULL,
    created_by UUID REFERENCES users(user_id),
    receipt_url TEXT,
    notes TEXT,
    is_settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Expense Payers (Who Paid)
```sql
CREATE TABLE expense_payers (
    expense_id UUID REFERENCES expenses(expense_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id),
    amount_paid DECIMAL(15, 2) NOT NULL,
    PRIMARY KEY (expense_id, user_id)
);
```

#### Expense Splits (Who Owes What)
```sql
CREATE TABLE expense_splits (
    split_id UUID PRIMARY KEY,
    expense_id UUID REFERENCES expenses(expense_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id),
    amount_owed DECIMAL(15, 2) NOT NULL,
    split_type VARCHAR(20) DEFAULT 'equal', -- 'equal', 'exact', 'percentage', 'share'
    split_value DECIMAL(10, 4), -- For percentage (0.5 = 50%) or share (2.0 = 2 shares)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Settlements (Payment Records)
```sql
CREATE TABLE settlements (
    settlement_id UUID PRIMARY KEY,
    from_user_id UUID REFERENCES users(user_id),
    to_user_id UUID REFERENCES users(user_id),
    amount DECIMAL(15, 2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50), -- 'cash', 'venmo', 'paypal', 'bank_transfer'
    group_id UUID REFERENCES groups(group_id), -- Optional
    notes TEXT,
    settlement_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes for Performance
```sql
CREATE INDEX idx_expenses_group ON expenses(group_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_splits_user ON expense_splits(user_id);
CREATE INDEX idx_settlements_users ON settlements(from_user_id, to_user_id);
```

---

## Expense Splitting Algorithms

### 1. Equal Split (Simplest)
**Use Case:** Splitting rent, shared groceries  
**Complexity:** O(n) where n = number of people

```javascript
function equalSplit(totalAmount, participants) {
    const amountPerPerson = totalAmount / participants.length;
    return participants.map(user => ({
        userId: user.id,
        amountOwed: amountPerPerson
    }));
}
```

### 2. Exact Split
**Use Case:** Restaurant where each person ordered different items  
**Complexity:** O(n)

```javascript
function exactSplit(totalAmount, exactAmounts) {
    // Validate that exact amounts sum to total
    const sum = exactAmounts.reduce((acc, amt) => acc + amt, 0);
    if (Math.abs(sum - totalAmount) > 0.01) {
        throw new Error('Exact amounts must sum to total');
    }
    return exactAmounts.map((amount, idx) => ({
        userId: participants[idx].id,
        amountOwed: amount
    }));
}
```

### 3. Percentage Split
**Use Case:** Business expenses split by ownership percentage  
**Complexity:** O(n)

```javascript
function percentageSplit(totalAmount, participants, percentages) {
    return participants.map((user, idx) => ({
        userId: user.id,
        amountOwed: totalAmount * (percentages[idx] / 100)
    }));
}
```

### 4. Share-Based Split
**Use Case:** Couples where one person eats more (2:1 ratio)  
**Complexity:** O(n)

```javascript
function shareSplit(totalAmount, participants, shares) {
    const totalShares = shares.reduce((acc, share) => acc + share, 0);
    return participants.map((user, idx) => ({
        userId: user.id,
        amountOwed: totalAmount * (shares[idx] / totalShares)
    }));
}
```

---

## Settlement Flow & Debt Simplification

### The Debt Simplification Problem

**Mathematical Formulation:**  
Given a directed graph G = (V, E) where:
- V = users (vertices)
- E = debts (edges with weights)

Find an equivalent graph G' with minimum edges such that:
- Net balance of each vertex remains the same
- Total debt is preserved

**Complexity:** NP-Complete (equivalent to Subset Sum Problem)

### Practical Solutions

#### Approach 1: Greedy Algorithm (Used by Splitwise)
**Time Complexity:** O(V²)  
**Space Complexity:** O(V)

```javascript
function simplifyDebts(users, expenses) {
    // Step 1: Calculate net balance for each user
    const balances = new Map();
    users.forEach(user => balances.set(user.id, 0));
    
    expenses.forEach(expense => {
        expense.payers.forEach(payer => {
            balances.set(payer.userId, 
                balances.get(payer.userId) + payer.amountPaid);
        });
        
        expense.splits.forEach(split => {
            balances.set(split.userId,
                balances.get(split.userId) - split.amountOwed);
        });
    });
    
    // Step 2: Separate into creditors (positive balance) and debtors (negative)
    const creditors = [];
    const debtors = [];
    
    balances.forEach((balance, userId) => {
        if (balance > 0.01) {
            creditors.push({ userId, amount: balance });
        } else if (balance < -0.01) {
            debtors.push({ userId, amount: Math.abs(balance) });
        }
    });
    
    // Step 3: Greedily match largest creditor with largest debtor
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);
    
    const transactions = [];
    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
        const transferAmount = Math.min(creditors[i].amount, debtors[j].amount);
        
        transactions.push({
            from: debtors[j].userId,
            to: creditors[i].userId,
            amount: transferAmount
        });
        
        creditors[i].amount -= transferAmount;
        debtors[j].amount -= transferAmount;
        
        if (creditors[i].amount < 0.01) i++;
        if (debtors[j].amount < 0.01) j++;
    }
    
    return transactions;
}
```

#### Approach 2: Maximum Flow (Preserves Original Edges)
**Time Complexity:** O(V²E²) with Dinic's algorithm  
**Used When:** Must preserve "no new creditors" rule

```javascript
// Pseudocode - uses Dinic's maxflow algorithm
function simplifyDebtsWithConstraints(graph) {
    const simplifiedGraph = [];
    
    // For each edge (u, v) in original graph
    graph.edges.forEach(edge => {
        // Find max flow from u to v (direct + indirect paths)
        const maxFlow = dinicMaxFlow(graph, edge.from, edge.to);
        
        if (maxFlow > 0) {
            simplifiedGraph.push({
                from: edge.from,
                to: edge.to,
                amount: maxFlow
            });
        }
        
        // Update residual graph
        graph = updateResidualGraph(graph, edge, maxFlow);
    });
    
    return simplifiedGraph;
}
```

### Settle Up UX Flow

1. **Entry Point:** Tap balance line or "Settle Up" button
2. **Choose Amount:**
   - Default: Full balance
   - Allow partial payments (editable amount field)
3. **Select Payment Method:**
   - Cash (offline record)
   - Venmo / PayPal (integrated payment)
   - Bank Transfer (manual)
   - "Later" (IOU)
4. **Confirmation:** Show updated balances immediately
5. **Notification:** Alert recipient about payment

**Key UX Principles:**
- Default to most common case (full settlement)
- Allow partial payments without extra clicks
- Support undo (delete settlement like any expense)
- Show immediate feedback (balance updates)

---

## Multi-Currency Handling

### Strategy 1: Base Currency Conversion
**How It Works:**
- User sets base currency (e.g., USD)
- All expenses stored in original currency
- Display converted to base currency using exchange rates
- Settlements can be in any currency

**Database Schema Addition:**
```sql
CREATE TABLE exchange_rates (
    rate_id UUID PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(12, 6) NOT NULL,
    effective_date DATE NOT NULL,
    source VARCHAR(50), -- 'ecb', 'fixer.io', 'user_manual'
    UNIQUE(from_currency, to_currency, effective_date)
);

-- Add to expenses table
ALTER TABLE expenses ADD COLUMN exchange_rate DECIMAL(12, 6);
ALTER TABLE expenses ADD COLUMN base_currency_amount DECIMAL(15, 2);
```

**Algorithm:**
```javascript
async function recordExpenseWithCurrency(expense) {
    // Store original currency
    const expenseRecord = {
        totalAmount: expense.amount,
        currencyCode: expense.currency,
        baseCurrencyAmount: null,
        exchangeRate: null
    };
    
    // Convert to base currency if different
    if (expense.currency !== user.baseCurrency) {
        const rate = await getExchangeRate(
            expense.currency,
            user.baseCurrency,
            expense.date
        );
        
        expenseRecord.exchangeRate = rate;
        expenseRecord.baseCurrencyAmount = expense.amount * rate;
    } else {
        expenseRecord.baseCurrencyAmount = expense.amount;
        expenseRecord.exchangeRate = 1.0;
    }
    
    return expenseRecord;
}
```

### Strategy 2: Multi-Currency Balance Tracking
**How It Works:**
- Track balances separately per currency
- Display breakdown: "You owe $50 USD + €30 EUR"
- Settlement prioritizes same currency

**UX Pattern:**
- Carousel to switch between currencies (Splitwise approach)
- Expandable section showing all currencies (Tricount approach)
- "Convert all to USD" option for simplicity

**Exchange Rate Sources:**
- European Central Bank (ECB) - free, daily rates
- Fixer.io / ExchangeRate-API - real-time, requires API key
- User manual override (for gift currencies, crypto)

---

## UX Patterns & Best Practices

### 1. Add Expense Flow

**Optimal Order (Based on Splitwise UX Research):**
1. **Description** → What was it? (e.g., "Dinner at Mario's")
2. **Amount & Currency** → How much? Include smart calculator
3. **Category** → (Optional) Food, Transport, Utilities, etc.
4. **Payers** → Who paid? Allow multiple payers with amounts
5. **Participants** → Who should split this?
6. **Split Method** → Equal, Exact, Percentage, Shares
7. **Date & Receipt** → When? Upload photo (optional)

**Why This Order:**
- Start with easiest info (description)
- Defer complex tasks (inviting new users) to end
- Allow "Save as Draft" at any step

**Smart Calculator:**
```
Input: "100 + 45.50 + 23"
Output: $168.50
```
Supports: +, -, *, /, % operations

**Key UX Enhancements:**
- **Auto-categorize** based on description keywords
  - "Uber" → Transport
  - "Pizza" → Food
  - "Netflix" → Entertainment
- **Receipt scanning** (Pro feature) → OCR to extract total
- **Recurring expenses** → Auto-create monthly (rent, subscriptions)

### 2. Split Configuration UX

**Progressive Disclosure:**
```
[Equal Split] ← Default, selected
    ↓ Tap to expand
    
Everyone owes $25.00

[Advanced Options]
    → Exact amounts
    → Percentage
    → Shares
    → Multiple splits (complex)
```

**Multiple Splits (Advanced):**
For complex scenarios (e.g., dinner with vegetarians/non-vegetarians + drinks):

```
Split 1: $105 (Veg food) → Equal among A, B, C
Split 2: $89 (Non-veg) → Equal among D, E
Split 3: $60 (Drinks) → Equal among A, B, D
Total: $254
```

**UX Flow:**
1. Tap "Add split"
2. Enter amount for this split
3. Choose participants
4. Choose method (equal/exact/etc.)
5. See running total and remaining amount

### 3. Group Management

**Create Group:**
- Name + optional description
- Upload group photo
- Choose default currency
- Add members (email/phone)

**Invite Members:**
- **Already on app:** Instant add
- **In contacts, not on app:** Send invite SMS/email
- **Not in contacts:** Enter email/phone manually

**Member States:**
- Active (accepted invite)
- Pending (invited, not responded)
- Removed (left group)

**Permissions:**
- Admin: Edit group, remove members, delete group
- Member: Add expenses, view balances, settle up

### 4. Dashboard & Navigation

**Main Views:**
1. **Friends Tab:** List of all people you split with
   - Show net balance per person
   - Swipe left → Settle Up
   - Swipe right → Remind to pay
2. **Groups Tab:** All your groups
   - Show group balance
   - Recent expenses
3. **Activity Tab:** Timeline of all actions
   - Filterable by type (expenses, payments, edits)
4. **Account Tab:** Settings, export data, Pro upgrade

**Balance Display:**
```
┌─────────────────────────────┐
│  Total Balance              │
│  You are owed: $234.50      │  ← Green
│  You owe: $87.00            │  ← Red
│  Net: +$147.50              │  ← Green (or red if negative)
└─────────────────────────────┘
```

### 5. Notifications

**Event-Driven Notifications:**
- **Expense added:** "Alice added 'Groceries' $45.00 – you owe $15.00"
- **Payment received:** "Bob paid you $50.00"
- **Reminder:** "You owe Charlie $30.00 for 'Gas'"
- **Due date:** "Payment due in 2 days: $75.00 to Dana"
- **Monthly summary:** "This month: You spent $234, owe $87"

**Notification Preferences:**
- Per-group settings (mute noisy groups)
- Digest mode (daily summary vs. instant)
- Channels: Push, Email, SMS

### 6. Accessibility & Delight

**Empty States:**
- First time: "Add your first expense! 🎉"
- No debts: "You're all settled up! 💚"
- No activity: "No recent activity"

**Illustrations & Personality:**
- Colorful category icons
- Celebratory animations on settling up
- Friendly error messages

**Dark Mode:**
- Essential for night-time expense logging
- OLED-friendly pure blacks

---

## Recommended Schema for FinPassport

### Optimized for Travel Use Case

```sql
-- FinPassport Trips (Similar to Groups)
CREATE TABLE trips (
    trip_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- "Bali 2026"
    description TEXT,
    destination VARCHAR(255), -- "Bali, Indonesia"
    start_date DATE,
    end_date DATE,
    base_currency VARCHAR(3) DEFAULT 'USD',
    image_url TEXT,
    created_by UUID REFERENCES users(user_id),
    status VARCHAR(20) DEFAULT 'active', -- 'planning', 'active', 'completed', 'archived'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trip Participants
CREATE TABLE trip_participants (
    trip_id UUID REFERENCES trips(trip_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    email VARCHAR(255), -- For non-users invited by email
    name VARCHAR(100) NOT NULL, -- Display name
    role VARCHAR(20) DEFAULT 'member', -- 'organizer', 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (trip_id, user_id, email)
);

-- Trip Expenses
CREATE TABLE trip_expenses (
    expense_id UUID PRIMARY KEY,
    trip_id UUID REFERENCES trips(trip_id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    category VARCHAR(50), -- 'accommodation', 'food', 'transport', 'activities', 'shopping'
    expense_date DATE NOT NULL,
    location VARCHAR(255), -- "Ubud, Bali"
    receipt_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(user_id),
    is_settled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Who Paid (Can be multiple people)
CREATE TABLE trip_expense_payers (
    expense_id UUID REFERENCES trip_expenses(expense_id) ON DELETE CASCADE,
    participant_id UUID, -- References trip_participants
    amount_paid DECIMAL(15, 2) NOT NULL,
    PRIMARY KEY (expense_id, participant_id)
);

-- How to Split
CREATE TABLE trip_expense_splits (
    split_id UUID PRIMARY KEY,
    expense_id UUID REFERENCES trip_expenses(expense_id) ON DELETE CASCADE,
    participant_id UUID, -- References trip_participants
    amount_owed DECIMAL(15, 2) NOT NULL,
    split_type VARCHAR(20) DEFAULT 'equal', -- 'equal', 'exact', 'percentage', 'share'
    percentage DECIMAL(5, 2), -- NULL unless split_type = 'percentage'
    shares DECIMAL(10, 2), -- NULL unless split_type = 'share'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settlement Records
CREATE TABLE trip_settlements (
    settlement_id UUID PRIMARY KEY,
    trip_id UUID REFERENCES trips(trip_id),
    from_participant_id UUID,
    to_participant_id UUID,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    payment_method VARCHAR(50),
    settlement_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exchange Rates (Cached)
CREATE TABLE exchange_rates (
    rate_id UUID PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(12, 6) NOT NULL,
    effective_date DATE NOT NULL,
    source VARCHAR(50) DEFAULT 'ecb',
    UNIQUE(from_currency, to_currency, effective_date)
);

-- Indexes
CREATE INDEX idx_trips_user ON trip_participants(user_id);
CREATE INDEX idx_expenses_trip ON trip_expenses(trip_id);
CREATE INDEX idx_expenses_date ON trip_expenses(expense_date);
CREATE INDEX idx_splits_expense ON trip_expense_splits(expense_id);
CREATE INDEX idx_settlements_trip ON trip_settlements(trip_id);
```

### FinPassport-Specific Enhancements

1. **Trip Timeline Integration:**
   - Link expenses to trip itinerary days
   - Show spending per day/location

2. **Budget Tracking:**
```sql
ALTER TABLE trips ADD COLUMN budget DECIMAL(15, 2);
ALTER TABLE trips ADD COLUMN budget_currency VARCHAR(3);
```

3. **Category-Specific Budgets:**
```sql
CREATE TABLE trip_category_budgets (
    trip_id UUID REFERENCES trips(trip_id),
    category VARCHAR(50),
    budget_amount DECIMAL(15, 2),
    PRIMARY KEY (trip_id, category)
);
```

4. **Offline Support:**
```sql
ALTER TABLE trip_expenses ADD COLUMN synced BOOLEAN DEFAULT FALSE;
ALTER TABLE trip_expenses ADD COLUMN local_id VARCHAR(100);
```

---

## Implementation Roadmap

### Phase 1: MVP (4-6 weeks)
**Goal:** Basic shared expense tracking

**Features:**
- ✅ Create trips with participants
- ✅ Add expenses with equal split only
- ✅ View balances (who owes whom)
- ✅ Basic settlement recording
- ✅ Simple activity feed

**Technical:**
- Database schema setup
- REST API endpoints
- Basic React components
- PostgreSQL backend

### Phase 2: Enhanced Splitting (2-3 weeks)
**Goal:** Support complex split scenarios

**Features:**
- ✅ Exact amount split
- ✅ Percentage split
- ✅ Share-based split
- ✅ Multiple payers
- ✅ Save as draft

**Technical:**
- Implement split algorithms
- Enhanced expense form UI
- Validation logic

### Phase 3: Debt Simplification (2 weeks)
**Goal:** Minimize transactions

**Features:**
- ✅ "Simplify debts" algorithm
- ✅ Suggested payments view
- ✅ Net balance calculation
- ✅ Settlement optimization

**Technical:**
- Greedy algorithm implementation
- Graph-based balance calculation
- Unit tests for edge cases

### Phase 4: Multi-Currency (2-3 weeks)
**Goal:** Support international travel

**Features:**
- ✅ Multiple currencies per trip
- ✅ Exchange rate integration (ECB API)
- ✅ Base currency conversion
- ✅ Currency breakdown in balances

**Technical:**
- Exchange rate caching
- Currency conversion service
- Multi-currency UI components

### Phase 5: UX Polish (3-4 weeks)
**Goal:** Delightful user experience

**Features:**
- ✅ Receipt upload & OCR
- ✅ Smart calculator
- ✅ Swipe gestures (settle up, remind)
- ✅ Push notifications
- ✅ Dark mode
- ✅ Offline support

**Technical:**
- Image upload to S3/CloudFlare
- OCR integration (Tesseract or cloud service)
- Service worker for offline
- Firebase Cloud Messaging

### Phase 6: Advanced Features (Future)
- Recurring expenses
- Budget alerts
- Export to CSV/PDF
- In-app payments (Stripe/PayPal)
- Analytics & charts
- AI-powered categorization

---

## Key Takeaways for FinPassport

### 1. **Simplicity First**
- Start with equal split (80% use case)
- Progressive disclosure for advanced features
- Don't overwhelm users with options upfront

### 2. **Mobile-First UX**
- Large touch targets for expense entry
- Swipe gestures for common actions
- Offline-first architecture (sync when online)

### 3. **Trust Through Transparency**
- Show all calculations clearly
- Allow undo for everything
- Detailed activity log

### 4. **Optimize for Travel**
- Multi-currency is non-negotiable
- Location tagging (GPS or manual)
- Trip-based organization (not just generic groups)

### 5. **Performance Matters**
- Cache exchange rates (don't fetch every time)
- Optimize balance calculations (compute once, cache)
- Lazy load expense history (paginate)

### 6. **Social Dynamics**
- Make settling up low-friction
- Gentle reminders (not pushy)
- Celebrate being settled up

---

## Technical Debt to Avoid

1. **Floating Point Math:**
   - Always use `DECIMAL` for money, never `FLOAT`
   - Store cents as integers if possible (avoid rounding errors)

2. **Currency Conversion:**
   - Always store original currency + conversion rate
   - Never lose original transaction data
   - Allow manual rate override

3. **Deletion:**
   - Soft delete expenses (mark inactive, don't actually delete)
   - Keep audit trail for disputes
   - CASCADE deletes carefully

4. **Concurrency:**
   - Use optimistic locking for expense edits
   - Handle "expense edited while viewing" gracefully
   - Transaction isolation for settlements

5. **Scalability:**
   - Index foreign keys
   - Partition large tables by trip_id
   - Cache balance calculations

---

## API Design Examples

### Create Expense
```http
POST /api/trips/{tripId}/expenses
Content-Type: application/json

{
  "description": "Dinner at Warung Ibu Oka",
  "amount": 450000,
  "currency": "IDR",
  "category": "food",
  "expenseDate": "2026-03-15",
  "location": "Ubud, Bali",
  "payers": [
    { "participantId": "uuid-123", "amountPaid": 450000 }
  ],
  "splits": [
    { "participantId": "uuid-123", "splitType": "equal" },
    { "participantId": "uuid-456", "splitType": "equal" },
    { "participantId": "uuid-789", "splitType": "equal" }
  ]
}
```

### Get Balances
```http
GET /api/trips/{tripId}/balances

Response:
{
  "tripId": "uuid-trip",
  "baseCurrency": "USD",
  "balances": [
    {
      "participantId": "uuid-123",
      "name": "Alice",
      "netBalance": 125.50,
      "currency": "USD",
      "owes": [],
      "owedBy": [
        { "participantId": "uuid-456", "amount": 125.50 }
      ]
    }
  ],
  "simplifiedTransactions": [
    {
      "from": "uuid-456",
      "to": "uuid-123",
      "amount": 125.50,
      "currency": "USD"
    }
  ]
}
```

### Record Settlement
```http
POST /api/trips/{tripId}/settlements

{
  "fromParticipantId": "uuid-456",
  "toParticipantId": "uuid-123",
  "amount": 125.50,
  "currency": "USD",
  "paymentMethod": "bank_transfer",
  "settlementDate": "2026-03-20",
  "notes": "Transferred via Wise"
}
```

---

## Resources & References

### Articles & Case Studies
- [Algorithm Behind Splitwise's Debt Simplification](https://medium.com/@mithunmk93/algorithm-behind-splitwises-debt-simplification-feature-8ac485e97688)
- [How Does the Splitwise Algorithm Work](https://medium.com/@howoftech/how-does-the-splitwise-algorithm-work-dc1de5eaa371)
- [Splitwise UX Redesign Case Study](https://uxplanet.org/splitwiser-the-all-new-splitwise-mobile-app-redesign-ui-ux-case-study-4d3c0313ae6f)
- [System Design of Splitwise Backend](https://www.geeksforgeeks.org/system-design/system-design-of-backend-for-expense-sharing-apps-like-splitwise/)

### Academic/Technical
- NP-Completeness of debt minimization (Subset Sum Problem)
- Dinic's Maximum Flow Algorithm
- Greedy algorithms for cashflow minimization

### Exchange Rate APIs
- European Central Bank: https://www.ecb.europa.eu/stats/policy_and_exchange_rates/
- Fixer.io: https://fixer.io/ (freemium)
- ExchangeRate-API: https://www.exchangerate-api.com/ (free tier available)

### Competitor Analysis
- Splitwise: https://www.splitwise.com/
- Tricount: https://tricount.com/
- Settle Up: https://settleup.io/
- Splid: https://splid.app/

---

## Conclusion

Building a shared expense feature for FinPassport requires balancing algorithmic complexity with user simplicity. The research shows that:

1. **Algorithms don't need to be perfect** – Greedy O(V²) beats optimal O(2^n)
2. **UX trumps features** – Make the common case (equal split) effortless
3. **Multi-currency is essential** – But base currency simplifies mental model
4. **Trust is paramount** – Show your work, allow corrections

By following the patterns established by market leaders and adapting them for the travel use case, FinPassport can deliver a best-in-class shared expense experience.

**Next Steps:**
1. Review and approve schema design
2. Set up database migrations
3. Implement Phase 1 MVP endpoints
4. Build React components for expense entry
5. Test with real trip scenario (3-4 users, 10-15 expenses)

---

**Document Version:** 1.0  
**Last Updated:** February 21, 2026  
**Author:** Research Agent  
**Estimated Reading Time:** 25-30 minutes
