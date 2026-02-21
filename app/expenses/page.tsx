'use client';

import { useEffect, useState } from 'react';
import { Plus, TrendingDown, Calendar, Search, Filter } from 'lucide-react';
import Link from 'next/link';

type Expense = {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category?: string;
  trip_name?: string;
  account_name: string;
};

// Mock data
const MOCK_EXPENSES: Expense[] = [
  { id: '1', date: '2026-02-20', description: 'Groceries - Silpo', amount: 85.50, currency: 'USD', category: 'food', account_name: 'Groceries' },
  { id: '2', date: '2026-02-19', description: 'Coffee & lunch', amount: 25.00, currency: 'USD', category: 'food', account_name: 'Groceries' },
  { id: '3', date: '2026-02-15', description: 'February rent', amount: 1200, currency: 'USD', category: 'accommodation', account_name: 'Rent' },
  { id: '4', date: '2026-02-12', description: 'Weekly groceries', amount: 120.30, currency: 'USD', category: 'food', account_name: 'Groceries' },
  { id: '5', date: '2026-02-10', description: 'Uber rides', amount: 45.00, currency: 'USD', category: 'transport', account_name: 'Transport' },
  { id: '6', date: '2026-02-08', description: 'Gym membership', amount: 50.00, currency: 'USD', category: 'health', account_name: 'Fitness' },
  { id: '7', date: '2026-02-05', description: 'Netflix subscription', amount: 15.99, currency: 'USD', category: 'entertainment', account_name: 'Subscriptions' },
  { id: '8', date: '2026-02-03', description: 'Dinner with friends', amount: 75.00, currency: 'USD', category: 'food', account_name: 'Groceries' },
  { id: '9', date: '2026-01-28', description: 'Electric bill', amount: 95.00, currency: 'USD', category: 'utilities', account_name: 'Utilities' },
  { id: '10', date: '2026-01-25', description: 'Groceries', amount: 140.00, currency: 'USD', category: 'food', account_name: 'Groceries' },
  { id: '11', date: '2026-01-20', description: 'Pharmacy', amount: 32.50, currency: 'USD', category: 'health', account_name: 'Healthcare' },
  { id: '12', date: '2026-01-15', description: 'January rent', amount: 1200, currency: 'USD', category: 'accommodation', account_name: 'Rent' },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setExpenses(MOCK_EXPENSES);
      setLoading(false);
    }, 300);
  }, []);

  // Group expenses by month
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  // Filter expenses
  const filteredGroups = Object.entries(groupedExpenses).reduce((acc, [month, monthExpenses]) => {
    const filtered = monthExpenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          expense.account_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    
    if (filtered.length > 0) {
      acc[month] = filtered;
    }
    return acc;
  }, {} as Record<string, Expense[]>);

  // Calculate stats
  const thisMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const thisMonthExpenses = groupedExpenses[thisMonth] || [];
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const allExpensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categories = Array.from(new Set(expenses.map(e => e.category).filter(Boolean)));

  const categoryIcons: Record<string, string> = {
    food: '🍴',
    accommodation: '🏠',
    transport: '🚗',
    entertainment: '🎉',
    health: '💊',
    utilities: '💡',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/" className="text-sm text-blue-600 hover:underline mb-2 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">💸 Expenses</h1>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="This Month"
            value={`$${thisMonthTotal.toFixed(2)}`}
            icon={<TrendingDown className="w-6 h-6 text-red-600" />}
            bgColor="bg-red-50"
            subtitle={`${thisMonthExpenses.length} expenses`}
          />
          <StatCard
            title="Total Expenses"
            value={expenses.length.toString()}
            icon={<Calendar className="w-6 h-6 text-blue-600" />}
            bgColor="bg-blue-50"
            subtitle="All time"
          />
          <StatCard
            title="Lifetime Total"
            value={`$${allExpensesTotal.toFixed(2)}`}
            icon={<TrendingDown className="w-6 h-6 text-orange-600" />}
            bgColor="bg-orange-50"
            subtitle="All expenses"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat?.charAt(0).toUpperCase() + (cat?.slice(1) || '')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grouped Expenses */}
        <div className="space-y-6">
          {Object.entries(filteredGroups).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <TrendingDown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or add a new expense.</p>
            </div>
          ) : (
            Object.entries(filteredGroups).map(([month, monthExpenses]) => {
              const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
              
              return (
                <div key={month} className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-900">{month}</h2>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">${monthTotal.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{monthExpenses.length} expenses</p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {monthExpenses.map(expense => (
                      <div
                        key={expense.id}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="text-2xl">
                              {categoryIcons[expense.category || ''] || '💰'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{expense.description}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <span>
                                  {new Date(expense.date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                                <span>•</span>
                                <span>{expense.account_name}</span>
                                {expense.category && (
                                  <>
                                    <span>•</span>
                                    <span className="capitalize">{expense.category}</span>
                                  </>
                                )}
                                {expense.trip_name && (
                                  <>
                                    <span>•</span>
                                    <span className="text-blue-600">🌍 {expense.trip_name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              ${expense.amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">{expense.currency}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor, subtitle }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
