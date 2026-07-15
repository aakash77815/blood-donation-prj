import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { createRequest, getRequests, updateRequestStatus } from '../services/requestService';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['normal', 'urgent', 'critical'];

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  accepted: 'bg-blue-50 text-blue-700 border-blue-100',
  fulfilled: 'bg-green-50 text-green-700 border-green-100',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const initialForm = {
  patientName: '',
  bloodGroup: '',
  unitsNeeded: 1,
  hospitalName: '',
  city: '',
  state: '',
  urgency: 'normal',
  notes: '',
};

const BloodRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null); // tracks which request's button is mid-action

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { requests: results } = await getRequests();
      setRequests(results);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});
    setIsSubmitting(true);

    const payload = {
      patientName: formData.patientName,
      bloodGroup: formData.bloodGroup,
      unitsNeeded: Number(formData.unitsNeeded) || 1,
      hospital: {
        name: formData.hospitalName,
        city: formData.city,
        state: formData.state,
      },
      urgency: formData.urgency,
      notes: formData.notes || undefined,
    };

    try {
      await createRequest(payload);
      toast.success('Blood request submitted');
      setFormData(initialForm);
      setShowForm(false);
      loadRequests();
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        const mapped = {};
        backendErrors.forEach((fe) => { mapped[fe.field] = fe.message; });
        setFieldErrors(mapped);
      }
      setFormError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (id, action) => {
    setActionLoadingId(id);
    try {
      const { message } = await updateRequestStatus(id, action);
      toast.success(message);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-primary">🩸 Blood Requests</h1>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            {showForm ? 'Cancel' : '+ New Request'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateRequest} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 space-y-4">
            {formError && (
              <div className="px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input
                  type="text" name="patientName" value={formData.patientName} onChange={handleFormChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {fieldErrors.patientName && <p className="text-xs text-red-600 mt-1">{fieldErrors.patientName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <select
                  name="bloodGroup" value={formData.bloodGroup} onChange={handleFormChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="" disabled>Select</option>
                  {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
                {fieldErrors.bloodGroup && <p className="text-xs text-red-600 mt-1">{fieldErrors.bloodGroup}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units Needed</label>
                <input
                  type="number" name="unitsNeeded" min="1" max="20" value={formData.unitsNeeded} onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <select
                  name="urgency" value={formData.urgency} onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  {URGENCY_LEVELS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
              <input
                type="text" name="hospitalName" value={formData.hospitalName} onChange={handleFormChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {fieldErrors['hospital.name'] && <p className="text-xs text-red-600 mt-1">{fieldErrors['hospital.name']}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital City</label>
                <input
                  type="text" name="city" value={formData.city} onChange={handleFormChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital State</label>
                <input
                  type="text" name="state" value={formData.state} onChange={handleFormChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                name="notes" value={formData.notes} onChange={handleFormChange} rows={2} maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No requests to show yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const isOwnRequest = req.requester?._id === user?._id;
              const isAssignedDonor = req.donor?._id === user?._id;
              const canAccept = user?.role === 'donor' && req.status === 'pending' && !isOwnRequest;
              const canCancel = (isOwnRequest || user?.role === 'admin') && req.status !== 'fulfilled';
              const canFulfill = (isAssignedDonor || isOwnRequest || user?.role === 'admin') && req.status === 'accepted';

              return (
                <div key={req._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {req.patientName} <span className="text-primary font-bold">({req.bloodGroup})</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        {req.hospital?.name}, {req.hospital?.city} — {req.unitsNeeded} unit(s), {req.urgency}
                      </p>
                      {isOwnRequest && (
                        <p className="text-xs text-gray-400 mt-1">You created this request</p>
                      )}
                      {req.donor && (
                        <p className="text-xs text-gray-400 mt-1">Donor: {req.donor.name} · {req.donor.phone}</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[req.status]}`}>
                      {req.status}
                    </span>
                  </div>

                  {(canAccept || canCancel || canFulfill) && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {canAccept && (
                        <button
                          onClick={() => handleAction(req._id, 'accept')}
                          disabled={actionLoadingId === req._id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {actionLoadingId === req._id ? '...' : 'Accept'}
                        </button>
                      )}
                      {canFulfill && (
                        <button
                          onClick={() => handleAction(req._id, 'fulfill')}
                          disabled={actionLoadingId === req._id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          {actionLoadingId === req._id ? '...' : 'Mark Fulfilled'}
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleAction(req._id, 'cancel')}
                          disabled={actionLoadingId === req._id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-60"
                        >
                          {actionLoadingId === req._id ? '...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodRequests;
