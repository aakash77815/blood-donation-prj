const StatCard = ({ label, value, accent = false }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${accent ? 'text-primary' : 'text-gray-800'}`}>
      {value}
    </p>
  </div>
);

export default StatCard;
