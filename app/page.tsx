'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Account, Transaction } from '@/lib/types';
import { Plus, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setAccounts(data);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        from_account:from_account_id(name),
        to_account:to_account_id(name)
      `)
      .order('date', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setTransactions(data);
    }
  };

  // Calculate stats
  const totalBalance = accounts
    .filter(a => ['Storage', 'Income'].includes(a.type))
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const totalAssets = accounts
    .filter(a => a.type === 'Asset' && a.asset_status === 'Active')
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const thisMonthIncome = transactions
    .filter(t => {
      const txDate = new Date(t.date);
      const now = new Date();
      return txDate.getMonth() === now.getMonth() && 
             txDate.getFullYear() === now.getFullYear() &&
             t.to_account_id && accounts.find(a => a.id === t.to_account_id && a.type === 'Income');
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const thisMonthExpenses = transactions
    .filter(t => {
      const txDate = new Date(t.date);
      const now = new Date();
      return txDate.getMonth() === now.getMonth() && 
             txDate.getFullYear() === now.getFullYear() &&
             t.from_account_id && accounts.find(a => a.id === t.from_account_id && a.type === 'Expense');
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">💼 FinPassport</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Net Worth"
            value={`$${(totalBalance + totalAssets).toFixed(2)}`}
            icon={<DollarSign className="w-6 h-6 text-blue-600" />}
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Liquid Balance"
            value={`$${totalBalance.toFixed(2)}`}
            icon={<Wallet className="w-6 h-6 text-green-600" />}
            bgColor="bg-green-50"
          />
          <StatCard
            title="This Month Income"
            value={`$${thisMonthIncome.toFixed(2)}`}
            icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
            bgColor="bg-emerald-50"
          />
          <StatCard
            title="This Month Expenses"
            value={`$${thisMonthExpenses.toFixed(2)}`}
            icon={<TrendingDown className="w-6 h-6 text-red-600" />}
            bgColor="bg-red-50"
          />
        </div>

        {/* Accounts Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Accounts</h2>
            <button
              onClick={() => setShowAddAccount(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map(account => (
                <AccountCard key={account.id} account={account} onUpdate={fetchAccounts} />
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
            <button
              onClick={() => setShowAddTransaction(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {transactions.slice(0, 10).map(transaction => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAddAccount && (
        <AddAccountModal
          onClose={() => setShowAddAccount(false)}
          onSuccess={() => {
            setShowAddAccount(false);
            fetchAccounts();
          }}
        />
      )}
      {showAddTransaction && (
        <AddTransactionModal
          accounts={accounts}
          onClose={() => setShowAddTransaction(false)}
          onSuccess={() => {
            setShowAddTransaction(false);
            fetchTransactions();
            fetchAccounts(); // Refresh balances
          }}
        />
      )}
    </div>
  );
}

// Components
function StatCard({ title, value, icon, bgColor }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function AccountCard({ account, onUpdate }: { account: Account; onUpdate: () => void }) {
  const typeColors: Record<string, string> = {
    Income: 'bg-green-100 text-green-800',
    Storage: 'bg-blue-100 text-blue-800',
    Investment: 'bg-purple-100 text-purple-800',
    Asset: 'bg-orange-100 text-orange-800',
    Clone: 'bg-yellow-100 text-yellow-800',
    Expense: 'bg-red-100 text-red-800',
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">{account.name}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[account.type]}`}>
          {account.type}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2">
        {account.currency} {Number(account.balance).toFixed(2)}
      </p>
      {account.subtype && (
        <p className="text-sm text-gray-600">{account.subtype}</p>
      )}
      {account.asset_type && (
        <p className="text-sm text-gray-600">{account.asset_type}</p>
      )}
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium text-gray-900">
            {transaction.from_account?.name || 'Unknown'} → {transaction.to_account?.name || 'Unknown'}
          </p>
          <p className="text-sm text-gray-600">{formatDate(transaction.date)}</p>
          {transaction.notes && (
            <p className="text-sm text-gray-500 mt-1">{transaction.notes}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">
            {transaction.currency} {Number(transaction.amount).toFixed(2)}
          </p>
          {transaction.fee && Number(transaction.fee) > 0 && (
            <p className="text-sm text-gray-500">Fee: {Number(transaction.fee).toFixed(2)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AddAccountModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Storage' as Account['type'],
    currency: 'USD',
    balance: '0',
    subtype: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('accounts')
      .insert({
        ...formData,
        balance: parseFloat(formData.balance),
        user_id: '00000000-0000-0000-0000-000000000000', // Mock user - replace with actual auth
      });

    if (!error) {
      onSuccess();
    } else {
      alert('Error creating account: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Add Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Account['type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Storage">Storage</option>
              <option value="Income">Income</option>
              <option value="Investment">Investment</option>
              <option value="Asset">Asset</option>
              <option value="Clone">Clone</option>
              <option value="Expense">Expense</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtype (optional)</label>
            <input
              type="text"
              value={formData.subtype}
              onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
              placeholder="e.g., Card, Cash, Stock"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddTransactionModal({ accounts, onClose, onSuccess }: { accounts: Account[]; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    from_account_id: '',
    to_account_id: '',
    amount: '',
    currency: 'USD',
    fee: '0',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('transactions')
      .insert({
        ...formData,
        amount: parseFloat(formData.amount),
        fee: parseFloat(formData.fee),
        user_id: '00000000-0000-0000-0000-000000000000', // Mock user
      });

    if (!error) {
      // Update account balances
      if (formData.from_account_id) {
        const fromAccount = accounts.find(a => a.id === formData.from_account_id);
        if (fromAccount) {
          await supabase
            .from('accounts')
            .update({ balance: Number(fromAccount.balance) - parseFloat(formData.amount) })
            .eq('id', formData.from_account_id);
        }
      }
      
      if (formData.to_account_id) {
        const toAccount = accounts.find(a => a.id === formData.to_account_id);
        if (toAccount) {
          await supabase
            .from('accounts')
            .update({ balance: Number(toAccount.balance) + parseFloat(formData.amount) })
            .eq('id', formData.to_account_id);
        }
      }
      
      onSuccess();
    } else {
      alert('Error creating transaction: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
            <select
              value={formData.from_account_id}
              onChange={(e) => setFormData({ ...formData, from_account_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None (Income)</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency} {Number(account.balance).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
            <select
              required
              value={formData.to_account_id}
              onChange={(e) => setFormData({ ...formData, to_account_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency} {Number(account.balance).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fee (optional)</label>
            <input
              type="number"
              step="0.01"
              value={formData.fee}
              onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
