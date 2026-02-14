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
