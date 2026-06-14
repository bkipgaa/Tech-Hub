import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, CheckCircle, XCircle, Clock, 
  Eye, ChevronLeft, ChevronRight, Calendar,
  DollarSign, MapPin
} from 'lucide-react';
import api from '../../services/api';

const TechnicianList = ({ initialFilter = 'all' }) => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 1,
    limit: 20
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchTechnicians();
  }, [filter, pagination.page, subscriptionFilter, searchTerm]);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/technicians', {
        params: {
          status: filter,
          subscriptionPlan: subscriptionFilter,
          search: searchTerm,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      
      setTechnicians(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'verified':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 inline mr-1" />Verified</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 inline mr-1" />Pending</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3 inline mr-1" />Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getSubscriptionBadge = (plan, isActive) => {
    const colors = {
      trial: 'bg-purple-100 text-purple-700',
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      basicPlus: 'bg-cyan-100 text-cyan-700',
      premium: 'bg-green-100 text-green-700',
      business: 'bg-orange-100 text-orange-700',
      enterprise: 'bg-red-100 text-red-700',
      unlimited: 'bg-yellow-100 text-yellow-700'
    };
    
    const planName = plan === 'basicPlus' ? 'Basic-Plus' : 
                     plan?.charAt(0).toUpperCase() + plan?.slice(1);
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[plan] || colors.free}`}>
        {isActive ? '🟢' : '🔴'} {planName || 'Free'}
      </span>
    );
  };

  const handleViewDetails = (id) => {
    navigate(`/admin/technicians/${id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Verification</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={subscriptionFilter}
            onChange={(e) => setSubscriptionFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Plans</option>
            <option value="trial">Trial</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="basicPlus">Basic-Plus</option>
            <option value="premium">Premium</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
            <option value="unlimited">Unlimited</option>
          </select>
          
          <button
            onClick={fetchTechnicians}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visibility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : technicians.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No technicians found</td>
              </tr>
            ) : (
              technicians.map((tech) => (
                <tr key={tech._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {tech.userId?.profileImage ? (
                          <img src={tech.userId.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold">
                            {tech.userId?.firstName?.[0]}{tech.userId?.lastName?.[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tech.userId?.firstName} {tech.userId?.lastName}</p>
                        <p className="text-xs text-gray-500">ID: {tech._id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{tech.userId?.email}</p>
                    <p className="text-xs text-gray-500">{tech.userId?.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(tech.verificationStatus)}
                    {tech.verifiedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(tech.verifiedAt).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getSubscriptionBadge(tech.subscription?.plan, tech.isSubscriptionActive)}
                    {tech.daysRemaining > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {tech.daysRemaining} days left
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{tech.serviceRadius || tech.visibilityRadius}km</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {tech.subscription?.plan === 'free' ? 'Free plan' : 
                       tech.subscription?.isTrial ? 'Trial' : 'Paid'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleViewDetails(tech._id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TechnicianList;