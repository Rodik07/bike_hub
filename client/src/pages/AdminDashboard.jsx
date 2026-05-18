import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FaUsers,
  FaMotorcycle,
  FaCalendarCheck,
  FaStore,
  FaCog,
  FaChartBar,
  FaBullhorn,
  FaCogs,
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/admin/stats');
      setStats(data);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <LoadingSpinner size={250} text="Loading..." />
      </div>
    );
  }

  const chartData = stats?.mostViewedBikes?.map(bike => ({
    name: bike.name.substring(0, 15),
    views: bike.views
  })) || [];

  const comparisonData = stats?.mostComparedBikes?.map(bike => ({
    name: bike.name.substring(0, 15),
    comparisons: bike.comparisons
  })) || [];

  const COLORS = ['#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-3 mb-6">
        <FaCog className="text-4xl text-primary-600" />
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="flex items-center space-x-3 mb-2">
            <FaUsers className="text-2xl text-primary-600" />
            <div className="text-3xl font-bold text-primary-600">{stats?.totalUsers || 0}</div>
          </div>
          <div className="text-gray-600">Total Users</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="flex items-center space-x-3 mb-2">
            <FaMotorcycle className="text-2xl text-primary-600" />
            <div className="text-3xl font-bold text-primary-600">{stats?.totalBikes || 0}</div>
          </div>
          <div className="text-gray-600">Total Bikes</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="flex items-center space-x-3 mb-2">
            <FaCalendarCheck className="text-2xl text-primary-600" />
            <div className="text-3xl font-bold text-primary-600">{stats?.totalBookings || 0}</div>
          </div>
          <div className="text-gray-600">Total Bookings</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <div className="flex items-center space-x-3 mb-2">
            <FaStore className="text-2xl text-primary-600" />
            <div className="text-3xl font-bold text-primary-600">{stats?.totalDealers || 0}</div>
          </div>
          <div className="text-gray-600">Total Dealers</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/admin/bikes"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4 mx-auto">
            <FaMotorcycle className="text-3xl text-primary-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Manage Bikes</h3>
          <p className="text-gray-600">Add, edit, or delete bikes</p>
        </Link>

        <Link
          to="/admin/dealers"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4 mx-auto">
            <FaStore className="text-3xl text-primary-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Manage Dealers</h3>
          <p className="text-gray-600">Manage dealer and service centers</p>
        </Link>

        <Link
          to="/admin/promotions"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4 mx-auto">
            <FaBullhorn className="text-3xl text-primary-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Promotions</h3>
          <p className="text-gray-600">Manage promotional banners</p>
        </Link>

        <Link
          to="/admin/spare-parts"
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4 mx-auto">
            <FaCogs className="text-3xl text-primary-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Spare Parts</h3>
          <p className="text-gray-600">Manage bike spare parts</p>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-4">
            <FaChartBar className="text-xl text-primary-600" />
            <h2 className="text-xl font-bold">Most Viewed Bikes</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-4">
            <FaChartBar className="text-xl text-primary-600" />
            <h2 className="text-xl font-bold">Most Compared Bikes</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="comparisons" fill="#0284c7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-2 mb-4">
          <FaCalendarCheck className="text-xl text-primary-600" />
          <h2 className="text-xl font-bold">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Bike</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentBookings?.map((booking) => (
                <tr key={booking._id} className="border-t">
                  <td className="px-4 py-2">{booking.bike?.name}</td>
                  <td className="px-4 py-2">{booking.user?.name}</td>
                  <td className="px-4 py-2">
                    {new Date(booking.bookingDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${booking.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

