export type AccountType = 'Income' | 'Storage' | 'Clone' | 'Investment' | 'Expense' | 'Asset';
export type AssetStatus = 'Active' | 'Sold';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  subtype?: string;
  currency: string;
  balance: number;
  
  // Type-specific
  location?: string;
  bank_name?: string;
  due_date?: string;
  interest_rate?: number;
  dividend_yield?: number;
  asset_growth_rate?: number;
  risk_level?: string;
  
  // Asset-specific
  asset_type?: string;
  purchase_price?: number;
  purchase_date?: string;
  sale_price?: number;
  sale_date?: string;
  asset_status?: AssetStatus;
  
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  from_account_id?: string;
  to_account_id?: string;
  amount: number;
  currency: string;
  exchange_rate?: number;
  usd_amount?: number;
  fee?: number;
  related_asset_id?: string;
  asset_expense_type?: string;
  notes?: string;
  source: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  from_account?: Account;
  to_account?: Account;
}

export interface ExpenseCategory {
  id: string;
  user_id: string;
  name: string;
  system_tag?: string;
  color?: string;
  icon?: string;
  parent_category_id?: string;
  created_at: string;
}

export interface AssetValuation {
  id: string;
  user_id: string;
  account_id: string;
  value: number;
  date: string;
  notes?: string;
  created_at: string;
}

// Trip & Shared Expenses Types
export type TripStatus = 'active' | 'archived' | 'settled';
export type ParticipantStatus = 'pending' | 'accepted' | 'declined';
export type SettlementStatus = 'pending' | 'paid' | 'confirmed';
export type SplitMethod = 'equal' | 'custom' | 'shares' | 'percentage';

export interface Trip {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  image_url?: string;
  currency: string;
  start_date?: string;
  end_date?: string;
  status: TripStatus;
  created_at: string;
  updated_at: string;
  
  // Joined data
  participants?: TripParticipant[];
  expenses?: TripExpense[];
  total_spent?: number;
}

export interface TripParticipant {
  id: string;
  trip_id: string;
  user_id?: string;
  email: string;
  name?: string;
  status: ParticipantStatus;
  invited_at: string;
  responded_at?: string;
  created_at: string;
  
  // Calculated fields
  total_paid?: number;
  total_owed?: number;
  net_balance?: number;
}

export interface TripExpense {
  id: string;
  trip_id: string;
  transaction_id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  category?: string;
  paid_by_participant_id: string;
  split_method: SplitMethod;
  created_at: string;
  updated_at: string;
  
  // Joined data
  paid_by?: TripParticipant;
  splits?: TripExpenseSplit[];
}

export interface TripExpenseSplit {
  id: string;
  trip_expense_id: string;
  participant_id: string;
  amount: number;
  share?: number;
  created_at: string;
  
  // Joined data
  participant?: TripParticipant;
}

export interface TripSettlement {
  id: string;
  trip_id: string;
  from_participant_id: string;
  to_participant_id: string;
  amount: number;
  currency: string;
  status: SettlementStatus;
  payment_method?: string;
  payment_proof_url?: string;
  settled_at?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  from_participant?: TripParticipant;
  to_participant?: TripParticipant;
}

export interface TripBalance {
  participant_id: string;
  participant_name: string;
  participant_email: string;
  total_paid: number;
  total_owed: number;
  net_balance: number;
}

export interface SuggestedSettlement {
  from_participant_id: string;
  from_participant_name: string;
  to_participant_id: string;
  to_participant_name: string;
  amount: number;
}
