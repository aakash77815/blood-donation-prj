import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRequests } from '../services/requestService';
import StatCard from '../components/StatCard';

const Dashboard = () => {
  const { user } = useAuth();
  const [requestStats, setRequestStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // "mine=true" scopes this to requests the logged-in user created themselves —
        // a lightweight personal summary, distinct from the admin-wide analytics dashboard.
        const { requests } = await getRequests({ mine: true });
        setRequestStats({
          total: requests.length,
          pending: requests.filter((r) => r.status === 'pending').length,
          accepted: requests.filter((r) => r.status === 'accepted').length,
          fulfilled: requests.filter((r) => r.status === 'fulfilled').length,
        });
      } catch {
        setRequestStats(null); // fail quietly — stats are a nice-to-have, not critical to the page
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-primary mb-1">
          Welcome, {user?.name} 👋
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          This is your profile overview.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Role</p>
            <p className="font-medium text-gray-800 capitalize">{user?.role}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Blood Group</p>
            <p className="font-medium text-gray-800">{user?.bloodGroup}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
            <p className="font-medium text-gray-800">{user?.email}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Location</p>
            <p className="font-medium text-gray-800">
              {user?.location?.city}, {user?.location?.state}
            </p>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-gray-700 mb-3">My Blood Requests</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Loading your request stats...</p>
        ) : requestStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total" value={requestStats.total} />
            <StatCard label="Pending" value={requestStats.pending} />
            <StatCard label="Accepted" value={requestStats.accepted} />
            <StatCard label="Fulfilled" value={requestStats.fulfilled} accent />
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-6">Could not load request stats.</p>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            to="/search"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Search Donors
          </Link>
          <Link
            to="/requests"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            View My Requests
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
