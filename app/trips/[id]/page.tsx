'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Users, DollarSign, TrendingUp, TrendingDown, Calendar, Check, X } from 'lucide-react';
import Link from 'next/link';
import { Trip, TripExpense, TripBalance, SuggestedSettlement } from '@/lib/types';

// Mock data
const MOCK_TRIP: Trip = {
  id: '1',
  user_id: 'user-1',
  name: 'Trip to Kyiv',
  description: 'Weekend getaway with friends',
  currency: 'UAH',
  start_date: '2026-03-15',
  end_date: '2026-03-17',
  status: 'active',
  created_at: '2026-02-20T10:00:00Z',
  updated_at: '2026-02-20T10:00:00Z',
  total_spent: 12450,
  participants: [
    { id: 'p1', trip_id: '1', email: 'alice@example.com', name: 'Alice', status: 'accepted', invited_at: '2026-02-20T10:00:00Z', created_at: '2026-02-20T10:00:00Z', total_paid: 6200, total_owed: 4150, net_balance: 2050 },
    { id: 'p2', trip_id: '1', email: 'bob@example.com', name: 'Bob', status: 'accepted', invited_at: '2026-02-20T10:00:00Z', created_at: '2026-02-20T10:00:00Z', total_paid: 4250, total_owed: 4150, net_balance: 100 },
    { id: 'p3', trip_id: '1', email: 'carol@example.com', name: 'Carol', status: 'accepted', invited_at: '2026-02-20T10:00:00Z', created_at: '2026-02-20T10:00:00Z', total_paid: 2000, total_owed: 4150, net_balance: -2150 },
  ],
};

const MOCK_EXPENSES: TripExpense[] = [
  {
    id: 'e1',
    trip_id: '1',
    transaction_id: 't1',
    description: 'Hotel booking',
    amount: 6000,
    currency: 'UAH',
    date: '2026-03-15',
    category: 'accommodation',
    paid_by_participant_id: 'p1',
    split_method: 'equal',
    created_at: '2026-02-21T10:00:00Z',
    updated_at: '2026-02-21T10:00:00Z',
  },
  {
    id: 'e2',
    trip_id: '1',
    transaction_id: 't2',
    description: 'Dinner at restaurant',
    amount: 2250,
    currency: 'UAH',
    date: '2026-03-15',
    category: 'food',
    paid_by_participant_id: 'p2',
    split_method: 'equal',
    created_at: '2026-02-21T14:00:00Z',
    updated_at: '2026-02-21T14:00:00Z',
  },
  {
    id: 'e3',
    trip_id: '1',
    transaction_id: 't3',
    description: 'Taxi to city center',
    amount: 450,
    currency: 'UAH',
    date: '2026-03-15',
    category: 'transport',
    paid_by_participant_id: 'p2',
    split_method: 'equal',
    created_at: '2026-02-21T16:00:00Z',
    updated_at: '2026-02-21T16:00:00Z',
  },
  {
    id: 'e4',
    trip_id: '1',
    transaction_id: 't4',
    description: 'Museum tickets',
    amount: 1550,
    currency: 'UAH',
    date: '2026-03-16',
    category: 'entertainment',
    paid_by_participant_id: 'p2',
    split_method: 'equal',
    created_at: '2026-02-22T10:00:00Z',
    updated_at: '2026-02-22T10:00:00Z',
  },
  {
    id: 'e5',
    trip_id: '1',
    transaction_id: 't5',
    description: 'Groceries',
    amount: 2200,
    currency: 'UAH',
    date: '2026-03-16',
    category: 'food',
    paid_by_participant_id: 'p3',
    split_method: 'equal',
    created_at: '2026-02-22T12:00:00Z',
    updated_at: '2026-02-22T12:00:00Z',
  },
];

const MOCK_SETTLEMENTS: SuggestedSettlement[] = [
  {
    from_participant_id: 'p3',
    from_participant_name: 'Carol',
    to_participant_id: 'p1',
    to_participant_name: 'Alice',
    amount: 2050,
  },
  {
    from_participant_id: 'p3',
    from_participant_name: 'Carol',
    to_participant_id: 'p2',
    to_participant_name: 'Bob',
    amount: 100,
  },
];

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [settlements, setSettlements] = useState<SuggestedSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlements'>('expenses');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setTrip(MOCK_TRIP);
      setExpenses(MOCK_EXPENSES);
      setSettlements(MOCK_SETTLEMENTS);
      setLoading(false);
    }, 300);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-900 mb-4">Trip not found</p>
          <Link href="/trips" className="text-blue-600 hover:underline">
            ← Back to trips
          </Link>
        </div>
      </div>
    );
  }

  const categoryIcons: Record<string, string> = {
    accommodation: '🏠',
    food: '🍴',
    transport: '🚗',
    entertainment: '🎉',
    shopping: '🛒',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/trips"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{trip.name}</h1>
                {trip.description && (
                  <p className="text-sm text-gray-600 mt-1">{trip.description}</p>
                )}
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Spent"
            value={`${trip.currency} ${trip.total_spent?.toFixed(2)}`}
            icon={<DollarSign className="w-6 h-6 text-blue-600" />}
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Participants"
            value={trip.participants?.length.toString() || '0'}
            icon={<Users className="w-6 h-6 text-green-600" />}
            bgColor="bg-green-50"
          />
          <StatCard
            title="Expenses"
            value={expenses.length.toString()}
            icon={<TrendingDown className="w-6 h-6 text-orange-600" />}
            bgColor="bg-orange-50"
          />
          <StatCard
            title="Per Person"
            value={`${trip.currency} ${((trip.total_spent || 0) / (trip.participants?.length || 1)).toFixed(2)}`}
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            bgColor="bg-purple-50"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'expenses'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'balances'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Balances
            </button>
            <button
              onClick={() => setActiveTab('settlements')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'settlements'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Settlements ({settlements.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'expenses' && (
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {expenses.map(expense => {
                const payer = trip.participants?.find(p => p.id === expense.paid_by_participant_id);
                return (
                  <div key={expense.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{categoryIcons[expense.category || ''] || '💰'}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                            <p className="text-sm text-gray-600">
                              Paid by {payer?.name || payer?.email} • {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">
                          {expense.currency} {expense.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {expense.split_method === 'equal' ? 'Split equally' : expense.split_method}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trip.participants?.map(participant => (
              <div key={participant.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-semibold">
                    {(participant.name || participant.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{participant.name || participant.email}</h3>
                    {participant.name && (
                      <p className="text-sm text-gray-600">{participant.email}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total paid:</span>
                    <span className="font-semibold text-green-600">
                      {trip.currency} {participant.total_paid?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total owed:</span>
                    <span className="font-semibold text-orange-600">
                      {trip.currency} {participant.total_owed?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Balance:</span>
                      <span className={`font-bold text-lg ${
                        (participant.net_balance || 0) > 0 ? 'text-green-600' : 
                        (participant.net_balance || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {(participant.net_balance || 0) > 0 ? '+' : ''}
                        {trip.currency} {participant.net_balance?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(participant.net_balance || 0) > 0 ? 'Will receive' : 
                       (participant.net_balance || 0) < 0 ? 'Needs to pay' : 'Settled'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settlements' && (
          <div className="space-y-4">
            {settlements.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All settled!</h3>
                <p className="text-gray-600">Everyone is square. No payments needed.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Settlements</h3>
                <p className="text-sm text-gray-600 mb-6">
                  These {settlements.length} payment{settlements.length !== 1 ? 's' : ''} will settle all balances:
                </p>
                <div className="space-y-4">
                  {settlements.map((settlement, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold">
                          {settlement.from_participant_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{settlement.from_participant_name}</p>
                          <p className="text-sm text-gray-600">pays</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xl font-bold text-blue-600">
                            {trip.currency} {settlement.amount.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">to</p>
                            <p className="font-medium text-gray-900">{settlement.to_participant_name}</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold">
                            {settlement.to_participant_name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <button className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                        Mark as Paid
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

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
