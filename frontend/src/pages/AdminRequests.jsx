import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getRequests, updateRequestStatus } from '../services/requestService';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  accepted: 'bg-blue-50 text-blue-700 border-blue-100',
  fulfilled: 'bg-green-50 text-green-700 border-green-100',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadRequests = async (status) => {
    setLoading(true);
    try {
      const { requests: results } = await getRequests({ status: status || undefined });
      setRequests(results);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleAction = async (id, action) => {
    setActionLoadingId(id);
    try {
      const { message } = await updateRequestStatus(id, action);
      toast.success(message);
      loadRequests(statusFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-primary">🛠️ Manage Blood Requests</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No requests match this filter.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="p-3 font-medium">Patient</th>
                  <th className="p-3 font-medium">Blood Group</th>
                  <th className="p-3 font-medium">Requester</th>
                  <th className="p-3 font-medium">Donor</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id} className="border-b border-gray-50 last:border-0">
                    <td className="p-3 text-gray-800">{req.patientName}</td>
                    <td className="p-3 font-bold text-primary">{req.bloodGroup}</td>
                    <td className="p-3 text-gray-600">{req.requester?.name || '—'}</td>
                    <td className="p-3 text-gray-600">{req.donor?.name || '—'}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[req.status]}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 flex-wrap">
                        {req.status !== 'fulfilled' && req.status !== 'cancelled' && (
                          <button
                            onClick={() => handleAction(req._id, 'reject')}
                            disabled={actionLoadingId === req._id}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-60"
                          >
                            {actionLoadingId === req._id ? '...' : 'Reject'}
                          </button>
                        )}
                        {req.status === 'accepted' && (
                          <button
                            onClick={() => handleAction(req._id, 'fulfill')}
                            disabled={actionLoadingId === req._id}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            {actionLoadingId === req._id ? '...' : 'Mark Fulfilled'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRequests;
