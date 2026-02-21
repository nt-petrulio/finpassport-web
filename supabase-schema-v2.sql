-- FinPassport Schema V2: Shared Expenses & Trips
-- Extends the base schema with trip splitting functionality

-- 1. Add account_type enum to existing accounts table
-- (This is a soft update - we'll use the existing 'type' column but document the new types)
-- New types: 'income', 'expense', 'storage', 'invest', 'taxes', 'donation'
-- The existing table already supports these as TEXT

-- 2. Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Creator
  
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- active, archived, settled
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- 3. Create trip_participants table
CREATE TABLE IF NOT EXISTS trip_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL if not yet registered
  email TEXT NOT NULL,
  name TEXT,
  
  status TEXT DEFAULT 'pending', -- pending, accepted, declined
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_participants_trip_id ON trip_participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_user_id ON trip_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_participants_email ON trip_participants(email);

-- 4. Create trip_expenses table (links transactions to trips)
CREATE TABLE IF NOT EXISTS trip_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  
  description TEXT NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT NOT NULL,
  date DATE NOT NULL,
  
  category TEXT, -- food, accommodation, transport, entertainment, etc.
  
  -- Who paid
  paid_by_participant_id UUID REFERENCES trip_participants(id) ON DELETE CASCADE NOT NULL,
  
  -- Split method: equal, custom, shares, percentage
  split_method TEXT DEFAULT 'equal',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_transaction_id ON trip_expenses(transaction_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_date ON trip_expenses(date DESC);

-- 5. Create trip_expense_splits table (who owes what for each expense)
CREATE TABLE IF NOT EXISTS trip_expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_expense_id UUID REFERENCES trip_expenses(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES trip_participants(id) ON DELETE CASCADE NOT NULL,
  
  amount DECIMAL(20, 2) NOT NULL, -- How much this participant owes
  share DECIMAL(10, 2), -- For shares/percentage split
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_expense_splits_expense_id ON trip_expense_splits(trip_expense_id);
CREATE INDEX IF NOT EXISTS idx_trip_expense_splits_participant_id ON trip_expense_splits(participant_id);

-- 6. Create trip_settlements table (who pays whom)
CREATE TABLE IF NOT EXISTS trip_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  
  from_participant_id UUID REFERENCES trip_participants(id) ON DELETE CASCADE NOT NULL,
  to_participant_id UUID REFERENCES trip_participants(id) ON DELETE CASCADE NOT NULL,
  
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT NOT NULL,
  
  status TEXT DEFAULT 'pending', -- pending, paid, confirmed
  payment_method TEXT, -- cash, paypal, venmo, etc.
  payment_proof_url TEXT,
  
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_settlements_trip_id ON trip_settlements(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_settlements_from_participant ON trip_settlements(from_participant_id);
CREATE INDEX IF NOT EXISTS idx_trip_settlements_to_participant ON trip_settlements(to_participant_id);

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_settlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Trips: Users can see trips they created or participate in
DROP POLICY IF EXISTS trips_access_policy ON trips;
CREATE POLICY trips_access_policy ON trips
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM trip_participants
      WHERE trip_participants.trip_id = trips.id
      AND trip_participants.user_id = auth.uid()
    )
  );

-- Trip Participants: Can view participants in trips they're part of
DROP POLICY IF EXISTS trip_participants_access_policy ON trip_participants;
CREATE POLICY trip_participants_access_policy ON trip_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_participants.trip_id
      AND (
        trips.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_participants tp
          WHERE tp.trip_id = trips.id
          AND tp.user_id = auth.uid()
        )
      )
    )
  );

-- Trip Expenses: Can view expenses in trips they're part of
DROP POLICY IF EXISTS trip_expenses_access_policy ON trip_expenses;
CREATE POLICY trip_expenses_access_policy ON trip_expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_expenses.trip_id
      AND (
        trips.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_participants
          WHERE trip_participants.trip_id = trips.id
          AND trip_participants.user_id = auth.uid()
        )
      )
    )
  );

-- Trip Expense Splits: Can view splits in trips they're part of
DROP POLICY IF EXISTS trip_expense_splits_access_policy ON trip_expense_splits;
CREATE POLICY trip_expense_splits_access_policy ON trip_expense_splits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trip_expenses te
      JOIN trips t ON t.id = te.trip_id
      WHERE te.id = trip_expense_splits.trip_expense_id
      AND (
        t.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_participants
          WHERE trip_participants.trip_id = t.id
          AND trip_participants.user_id = auth.uid()
        )
      )
    )
  );

-- Trip Settlements: Can view settlements in trips they're part of
DROP POLICY IF EXISTS trip_settlements_access_policy ON trip_settlements;
CREATE POLICY trip_settlements_access_policy ON trip_settlements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_settlements.trip_id
      AND (
        trips.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_participants
          WHERE trip_participants.trip_id = trips.id
          AND trip_participants.user_id = auth.uid()
        )
      )
    )
  );

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at 
  BEFORE UPDATE ON trips 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_expenses_updated_at ON trip_expenses;
CREATE TRIGGER update_trip_expenses_updated_at 
  BEFORE UPDATE ON trip_expenses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_settlements_updated_at ON trip_settlements;
CREATE TRIGGER update_trip_settlements_updated_at 
  BEFORE UPDATE ON trip_settlements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to calculate trip balances
-- Returns who owes whom in a trip
CREATE OR REPLACE FUNCTION calculate_trip_balances(p_trip_id UUID)
RETURNS TABLE (
  participant_id UUID,
  participant_name TEXT,
  participant_email TEXT,
  total_paid DECIMAL(20, 2),
  total_owed DECIMAL(20, 2),
  net_balance DECIMAL(20, 2)
) AS $$
BEGIN
  RETURN QUERY
  WITH participant_payments AS (
    -- How much each participant paid
    SELECT 
      te.paid_by_participant_id AS participant_id,
      SUM(te.amount) AS total_paid
    FROM trip_expenses te
    WHERE te.trip_id = p_trip_id
    GROUP BY te.paid_by_participant_id
  ),
  participant_debts AS (
    -- How much each participant owes
    SELECT 
      tes.participant_id,
      SUM(tes.amount) AS total_owed
    FROM trip_expense_splits tes
    JOIN trip_expenses te ON te.id = tes.trip_expense_id
    WHERE te.trip_id = p_trip_id
    GROUP BY tes.participant_id
  )
  SELECT 
    tp.id AS participant_id,
    COALESCE(tp.name, tp.email) AS participant_name,
    tp.email AS participant_email,
    COALESCE(pp.total_paid, 0) AS total_paid,
    COALESCE(pd.total_owed, 0) AS total_owed,
    COALESCE(pp.total_paid, 0) - COALESCE(pd.total_owed, 0) AS net_balance
  FROM trip_participants tp
  LEFT JOIN participant_payments pp ON pp.participant_id = tp.id
  LEFT JOIN participant_debts pd ON pd.participant_id = tp.id
  WHERE tp.trip_id = p_trip_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to suggest optimal settlements
-- Minimizes the number of transactions needed
CREATE OR REPLACE FUNCTION suggest_trip_settlements(p_trip_id UUID)
RETURNS TABLE (
  from_participant_id UUID,
  from_participant_name TEXT,
  to_participant_id UUID,
  to_participant_name TEXT,
  amount DECIMAL(20, 2)
) AS $$
DECLARE
  v_currency TEXT;
BEGIN
  -- Get trip currency
  SELECT currency INTO v_currency FROM trips WHERE id = p_trip_id;
  
  RETURN QUERY
  WITH balances AS (
    SELECT * FROM calculate_trip_balances(p_trip_id)
    WHERE net_balance != 0
  ),
  debtors AS (
    SELECT participant_id, participant_name, ABS(net_balance) AS amount
    FROM balances
    WHERE net_balance < 0
    ORDER BY amount DESC
  ),
  creditors AS (
    SELECT participant_id, participant_name, net_balance AS amount
    FROM balances
    WHERE net_balance > 0
    ORDER BY amount DESC
  )
  -- Simplified greedy algorithm: match largest debtor with largest creditor
  SELECT 
    d.participant_id AS from_participant_id,
    d.participant_name AS from_participant_name,
    c.participant_id AS to_participant_id,
    c.participant_name AS to_participant_name,
    LEAST(d.amount, c.amount) AS amount
  FROM debtors d, creditors c
  WHERE d.amount > 0 AND c.amount > 0
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;
