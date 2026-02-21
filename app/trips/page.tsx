'use client';

import { useEffect, useState } from 'react';
import { Plus, Users, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Trip } from '@/lib/types';

// Mock data for development
const MOCK_TRIPS: Trip[] = [
  {
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
      { id: 'p1', trip_id: '1', email: 'alice@example.com', name: 'Alice', status: 'accepted', invited_at: '2026-02-20T10:00:00Z', created_at: '2026-02-20T10:00:00Z' },
      { id: 'p2', trip_id: '1', email: 'bob@example.com', name: 'Bob', status: 'accepted', invited_at: '2026-02-20T10:00:00Z', created_at: '2026-02-20T10:00:00Z' },
      { id: 'p3', trip_id: '1', email: 'carol@example.com', name: 'Carol', status: 'pending', invited_at: '2026-02-20T10:00:00Z', created_at: '2026-02-20T10:00:00Z' },
    ],
  },
  {
    id: '2',
    user_id: 'user-1',
    name: 'Berlin Conference',
    description: 'Tech conference trip',
    currency: 'EUR',
    start_date: '2026-04-10',
    end_date: '2026-04-14',
    status: 'active',
    created_at: '2026-02-18T14:00:00Z',
    updated_at: '2026-02-18T14:00:00Z',
    total_spent: 850,
    participants: [
      { id: 'p4', trip_id: '2', email: 'dave@example.com', name: 'Dave', status: 'accepted', invited_at: '2026-02-18T14:00:00Z', created_at: '2026-02-18T14:00:00Z' },
      { id: 'p5', trip_id: '2', email: 'eve@example.com', name: 'Eve', status: 'accepted', invited_at: '2026-02-18T14:00:00Z', created_at: '2026-02-18T14:00:00Z' },
    ],
  },
  {
    id: '3',
    user_id: 'user-1',
    name: 'Lviv Weekend',
    description: 'Quick trip to Lviv',
    currency: 'UAH',
    start_date: '2026-02-01',
    end_date: '2026-02-03',
    status: 'settled',
    created_at: '2026-01-25T10:00:00Z',
    updated_at: '2026-02-10T16:00:00Z',
    total_spent: 8200,
    participants: [
      { id: 'p6', trip_id: '3', email: 'frank@example.com', name: 'Frank', status: 'accepted', invited_at: '2026-01-25T10:00:00Z', created_at: '2026-01-25T10:00:00Z' },
      { id: 'p7', trip_id: '3', email: 'grace@example.com', name: 'Grace', status: 'accepted', invited_at: '2026-01-25T10:00:00Z', created_at: '2026-01-25T10:00:00Z' },
    ],
  },
];

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('all');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setTrips(MOCK_TRIPS);
      setLoading(false);
    }, 300);
  }, []);

  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    return trip.status === filter;
  });

  const activeTrips = trips.filter(t => t.status === 'active').length;
  const settledTrips = trips.filter(t => t.status === 'settled').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trips...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">🌍 Shared Trips</h1>
            </div>
            <Link
              href="/trips/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Trip
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Trips"
            value={trips.length.toString()}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Active Trips"
            value={activeTrips.toString()}
            icon={<Calendar className="w-6 h-6 text-green-600" />}
            bgColor="bg-green-50"
          />
          <StatCard
            title="Settled Trips"
            value={settledTrips.toString()}
            icon={<DollarSign className="w-6 h-6 text-gray-600" />}
            bgColor="bg-gray-50"
          />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                filter === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Trips ({trips.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                filter === 'active'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active ({activeTrips})
            </button>
            <button
              onClick={() => setFilter('settled')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                filter === 'settled'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Settled ({settledTrips})
            </button>
          </div>
        </div>

        {/* Trips Grid */}
        {filteredTrips.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips yet</h3>
            <p className="text-gray-600 mb-6">Create your first trip to split expenses with friends!</p>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
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

function TripCard({ trip }: { trip: Trip }) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    archived: 'bg-yellow-100 text-yellow-800',
    settled: 'bg-gray-100 text-gray-800',
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const acceptedParticipants = trip.participants?.filter(p => p.status === 'accepted') || [];
  const pendingParticipants = trip.participants?.filter(p => p.status === 'pending') || [];

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border border-gray-200 hover:border-blue-300">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex-1">{trip.name}</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[trip.status]}`}>
            {trip.status}
          </span>
        </div>

        {trip.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{trip.description}</p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>
              {acceptedParticipants.length} participant{acceptedParticipants.length !== 1 ? 's' : ''}
              {pendingParticipants.length > 0 && ` (+${pendingParticipants.length} pending)`}
            </span>
          </div>

          {trip.total_spent !== undefined && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">
                {trip.currency} {trip.total_spent.toFixed(2)} spent
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex -space-x-2">
            {acceptedParticipants.slice(0, 4).map((participant, idx) => (
              <div
                key={participant.id}
                className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold border-2 border-white"
                title={participant.name || participant.email}
              >
                {(participant.name || participant.email).charAt(0).toUpperCase()}
              </div>
            ))}
            {acceptedParticipants.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-semibold border-2 border-white">
                +{acceptedParticipants.length - 4}
              </div>
            )}
          </div>

          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </Link>
  );
}
