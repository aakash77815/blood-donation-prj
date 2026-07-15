import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import toast from 'react-hot-toast';

import StatCard from '../components/StatCard';
import {
  getOverview,
  getRequestsByStatus,
  getRequestsByBloodGroup,
  getDonorsByBloodGroup,
  getRequestsTrend,
  getTopLocations,
} from '../services/adminService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const STATUS_COLORS = {
  pending: '#F59E0B',
  accepted: '#3B82F6',
  fulfilled: '#10B981',
  cancelled: '#9CA3AF',
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [requestsByBG, setRequestsByBG] = useState([]);
  const [donorsByBG, setDonorsByBG] = useState([]);
  const [trend, setTrend] = useState([]);
  const [topLocations, setTopLocations] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Fire all requests in parallel — independent data, no reason to wait on each other
        const [ov, status, reqBG, donBG, trendData, locations] = await Promise.all([
          getOverview(),
          getRequestsByStatus(),
          getRequestsByBloodGroup(),
          getDonorsByBloodGroup(),
          getRequestsTrend(30),
          getTopLocations(5),
        ]);
        setOverview(ov);
        setStatusData(status);
        setRequestsByBG(reqBG);
        setDonorsByBG(donBG);
        setTrend(trendData);
        setTopLocations(locations);
      } catch (err) {
        toast.error(
          err.response?.data?.message || 'Failed to load dashboard analytics'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  const doughnutData = {
    labels: statusData.map((s) => s.status),
    datasets: [
      {
        data: statusData.map((s) => s.count),
        backgroundColor: statusData.map((s) => STATUS_COLORS[s.status]),
        borderWidth: 0,
      },
    ],
  };

  const bloodGroupBarData = {
    labels: requestsByBG.map((r) => r.bloodGroup),
    datasets: [
      {
        label: 'Requests',
        data: requestsByBG.map((r) => r.count),
        backgroundColor: '#DC2626',
        borderRadius: 4,
      },
      {
        label: 'Available Donors',
        data: donorsByBG.map((d) => d.count),
        backgroundColor: '#FCA5A5',
        borderRadius: 4,
      },
    ],
  };

  const trendLineData = {
    labels: trend.map((t) =>
      new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Requests per day',
        data: trend.map((t) => t.count),
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-6">📊 Admin Dashboard</h1>

        {/* Top summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Donors" value={overview.totalDonors} />
          <StatCard label="Available Now" value={overview.availableDonors} accent />
          <StatCard label="Total Requests" value={overview.totalRequests} />
          <StatCard label="Fulfillment Rate" value={`${overview.fulfillmentRate}%`} accent />
          <StatCard label="Pending" value={overview.pendingRequests} />
          <StatCard label="Accepted" value={overview.acceptedRequests} />
          <StatCard label="Fulfilled" value={overview.fulfilledRequests} />
          <StatCard label="Cancelled" value={overview.cancelledRequests} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Requests by Status
            </h2>
            <div className="max-w-xs mx-auto">
              <Doughnut data={doughnutData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Requests vs. Available Donors by Blood Group
            </h2>
            <Bar data={bloodGroupBarData} options={chartOptions} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Request Volume — Last 30 Days
            </h2>
            <Line data={trendLineData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Report table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Top Locations by Donor Count
          </h2>
          {topLocations.length === 0 ? (
            <p className="text-sm text-gray-400">No donor location data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">City</th>
                    <th className="pb-2 font-medium">State</th>
                    <th className="pb-2 font-medium text-right">Donors</th>
                  </tr>
                </thead>
                <tbody>
                  {topLocations.map((loc, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-gray-800">{loc.city || '—'}</td>
                      <td className="py-2 text-gray-600">{loc.state || '—'}</td>
                      <td className="py-2 text-right font-medium text-gray-800">
                        {loc.donorCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
