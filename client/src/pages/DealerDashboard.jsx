import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import ChatWindow from '../components/ChatWindow';
import { displayBookingTime, formatSlotLabel, generateBookingSlots } from '../utils/bookingSlots';
import {
  FaStore,
  FaCalendarAlt,
  FaComments,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSpinner,
  FaReply,
  FaEnvelope,
  FaMotorcycle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaTag,
  FaEye,
  FaShoppingCart,
  FaSearch,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaLock,
  FaExclamationTriangle,
  FaCogs,
  FaComments as FaCommentsIcon,
  FaCircle
} from 'react-icons/fa';

const DealerDashboard = () => {
  const { user } = useContext(AuthContext);
  const { unreadCount, fetchUnreadCount, markRead } = useContext(SocketContext);
  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'bikes', 'bookings', 'spareParts', 'messages'
  const [bikes, setBikes] = useState([]);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chat/Messages state
  const [conversations, setConversations] = useState([]);
  const [chatTarget, setChatTarget] = useState(null);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  // Spare parts states
  const [spareParts, setSpareParts] = useState([]);
  const [mySpareParts, setMySpareParts] = useState([]);
  const [sparePartsView, setSparePartsView] = useState('browse'); // 'browse' or 'my'
  const [spSearch, setSpSearch] = useState('');
  const [spCategory, setSpCategory] = useState('');
  const [spCategories, setSpCategories] = useState([]);
  const [spPagination, setSpPagination] = useState({
    currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 12,
    hasNextPage: false, hasPrevPage: false
  });
  const [togglingPart, setTogglingPart] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [action, setAction] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [showListingForm, setShowListingForm] = useState(false);
  const [selectedBike, setSelectedBike] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [listingFormData, setListingFormData] = useState({
    availableForTestRide: true,
    availableForPurchase: true,
    onRoadPrice: '',
    stock: '',
    notes: ''
  });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [availableBrands, setAvailableBrands] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchBikes = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy: sortBy,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedBrand && { brand: selectedBrand })
      });

      const { data } = await axios.get(`/api/dealers/bikes?${params.toString()}`);
      setBikes(data.bikes || []);
      setPagination(data.pagination || pagination);
      setAvailableBrands(data.filters?.brands || []);
    } catch (error) {
      toast.error('Failed to load bikes');
      console.error('Error fetching bikes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search and filter
  useEffect(() => {
    if (activeTab === 'bikes') {
      const timeoutId = setTimeout(() => {
        fetchBikes(1); // Reset to page 1 on search/filter change
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, selectedBrand, sortBy, activeTab]);

  useEffect(() => {
    if (activeTab === 'listings') {
      fetchListings();
    } else if (activeTab === 'bookings') {
      fetchBookings();
      fetchInquiries();
    } else if (activeTab === 'spareParts') {
      if (sparePartsView === 'browse') {
        fetchSpareParts(1);
      } else {
        fetchMySpareParts();
      }
    } else if (activeTab === 'messages') {
      fetchConversations();
    }
  }, [activeTab, sparePartsView]);

  // Debounced spare parts search
  useEffect(() => {
    if (activeTab === 'spareParts' && sparePartsView === 'browse') {
      const timeoutId = setTimeout(() => {
        fetchSpareParts(1);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [spSearch, spCategory]);

  const fetchSpareParts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(spSearch && { search: spSearch }),
        ...(spCategory && { category: spCategory })
      });
      const { data } = await axios.get(`/api/dealers/spare-parts?${params.toString()}`);
      setSpareParts(data.parts || []);
      setSpPagination(data.pagination || spPagination);
      setSpCategories(data.filters?.categories || []);
    } catch (error) {
      toast.error('Failed to load spare parts');
    } finally {
      setLoading(false);
    }
  };

  const fetchMySpareParts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/dealers/my-spare-parts');
      setMySpareParts(data || []);
    } catch (error) {
      toast.error('Failed to load your spare parts');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSparePart = async (partId) => {
    try {
      setTogglingPart(partId);
      const { data } = await axios.post(`/api/dealers/spare-parts/${partId}/toggle`);
      toast.success(data.message);
      // Refresh the current view
      if (sparePartsView === 'browse') {
        await fetchSpareParts(spPagination.currentPage);
      } else {
        await fetchMySpareParts();
      }
    } catch (error) {
      toast.error('Failed to update spare part listing');
    } finally {
      setTogglingPart(null);
    }
  };

  // Auto-open password change modal if mustChangePassword is set
  useEffect(() => {
    if (user?.mustChangePassword) {
      setShowChangePassword(true);
    }
  }, [user?.mustChangePassword]);

  const fetchConversations = async () => {
    setConversationsLoading(true);
    try {
      const { data } = await axios.get('/api/chat/conversations');
      setConversations(data);
    } catch {
      // Silently fail
    } finally {
      setConversationsLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/dealers/my-listings');
      setListings(data);
    } catch (error) {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get('/api/dealers/bookings');
      setBookings(data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const { data } = await axios.get('/api/inquiries');
      setInquiries(data);
    } catch (error) {
      console.error('Failed to load inquiries');
    }
  };

  const handleBookingAction = async () => {
    if (!selectedBooking || !action) return;

    try {
      let endpoint = '';
      if (action === 'approve') {
        endpoint = `/api/bookings/${selectedBooking._id}/approve`;
      } else if (action === 'reject') {
        endpoint = `/api/bookings/${selectedBooking._id}/reject`;
      } else if (action === 'reschedule') {
        endpoint = `/api/bookings/${selectedBooking._id}/reschedule`;
      }

      await axios.put(endpoint, {
        message: responseMessage,
        rescheduledDate: action === 'reschedule' ? document.getElementById('rescheduleDate').value : undefined,
        rescheduledTime: action === 'reschedule' ? document.getElementById('rescheduleTime').value : undefined
      });

      toast.success('Booking updated successfully');
      setSelectedBooking(null);
      setAction('');
      setResponseMessage('');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update booking');
    }
  };

  const handleInquiryReply = async (inquiryId) => {
    const message = prompt('Enter your reply:');
    if (!message) return;

    try {
      await axios.put(`/api/inquiries/${inquiryId}/reply`, { message });
      toast.success('Reply sent successfully');
      fetchInquiries();
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleListBike = (bike) => {
    setSelectedBike(bike);
    setListingFormData({
      availableForTestRide: true,
      availableForPurchase: true,
      onRoadPrice: bike.price || '',
      stock: '',
      notes: ''
    });
    setShowListingForm(true);
  };

  const handleSubmitListing = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/dealers/list-bike', {
        bikeId: selectedBike._id,
        ...listingFormData
      });
      toast.success('Bike listed successfully');
      setShowListingForm(false);
      setSelectedBike(null);
      fetchListings();
      setActiveTab('listings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to list bike');
    }
  };

  const handleUpdateListing = async (listingId, updates) => {
    try {
      await axios.put(`/api/dealers/listings/${listingId}`, updates);
      toast.success('Listing updated');
      fetchListings();
    } catch (error) {
      toast.error('Failed to update listing');
    }
  };

  const handleRemoveListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    try {
      await axios.delete(`/api/dealers/listings/${listingId}`);
      toast.success('Listing removed');
      setListings((prev) => prev.filter((listing) => listing._id !== listingId));
      fetchListings();
    } catch (error) {
      toast.error('Failed to remove listing');
    }
  };

  const validateField = (name, value) => {
    if (name === 'onRoadPrice') {
      if (value && Number(value) < 0) {
        toast.error('On-Road Price must be a positive number');
        return false;
      }
    }
    if (name === 'stock') {
      if (value && Number(value) < 0) {
        toast.error('Stock cannot be negative');
        return false;
      }
    }
    return true;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      rescheduled: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <LoadingSpinner size={250} text="Loading..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Password Change Reminder */}
      {user?.mustChangePassword && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6 flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <FaExclamationTriangle className="text-yellow-600 text-2xl" />
            <div>
              <h3 className="font-bold text-yellow-800">Action Required: Change Your Password</h3>
              <p className="text-sm text-yellow-700">
                You are using a temporary password. Please change it to secure your account.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
          >
            <FaLock />
            <span>Change Password</span>
          </button>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FaStore className="text-4xl text-primary-600" />
          <h1 className="text-3xl font-bold">Dealer Dashboard</h1>
        </div>
        <button
          onClick={() => setShowChangePassword(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FaLock />
          <span>Change Password</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'listings'
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-gray-600 hover:text-primary-600'
            }`}
        >
          <FaMotorcycle className="inline mr-2" />
          My Listings
        </button>
        <button
          onClick={() => setActiveTab('bikes')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'bikes'
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-gray-600 hover:text-primary-600'
            }`}
        >
          <FaPlus className="inline mr-2" />
          List New Bike
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors relative ${activeTab === 'bookings'
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-gray-600 hover:text-primary-600'
            }`}
        >
          <FaCalendarAlt className="inline mr-2" />
          Bookings
          {bookings.filter(b => b.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md">
              {bookings.filter(b => b.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('spareParts')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === 'spareParts'
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-gray-600 hover:text-primary-600'
            }`}
        >
          <FaCogs className="inline mr-2" />
          Spare Parts
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors relative ${activeTab === 'messages'
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-gray-600 hover:text-primary-600'
            }`}
        >
          <FaCommentsIcon className="inline mr-2" />
          Messages
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'listings' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">My Bike Listings</h2>
          {listings.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <FaMotorcycle className="text-5xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No bikes listed yet</p>
              <button
                onClick={() => setActiveTab('bikes')}
                className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700"
              >
                List Your First Bike
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <motion.div
                  key={listing._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {listing.bike?.images?.[0] && (
                    <img
                      src={`${listing.bike.images[0].url}`}
                      alt={listing.bike.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{listing.bike?.name}</h3>
                    <p className="text-gray-600 mb-2">{listing.bike?.brand}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-primary-600 font-bold">
                        रु{listing.onRoadPrice?.toLocaleString() || listing.bike?.price?.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">Stock: {listing.stock || 0}</span>
                    </div>
                    <div className="flex items-center space-x-4 mb-3 text-sm">
                      {listing.availableForTestRide && (
                        <span className="flex items-center text-green-600">
                          <FaEye className="mr-1" />
                          Test Ride
                        </span>
                      )}
                      {listing.availableForPurchase && (
                        <span className="flex items-center text-blue-600">
                          <FaShoppingCart className="mr-1" />
                          Purchase
                        </span>
                      )}
                    </div>
                    {listing.notes && (
                      <p className="text-sm text-gray-600 mb-3">{listing.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateListing(listing._id, {
                          availableForTestRide: !listing.availableForTestRide
                        })}
                        className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        {listing.availableForTestRide ? 'Disable Test Ride' : 'Enable Test Ride'}
                      </button>
                      <button
                        onClick={() => handleRemoveListing(listing._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bikes' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Available Bikes to List</h2>
            <div className="text-sm text-gray-600">
              Showing {bikes.length} of {pagination.totalItems} bikes
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Bar */}
              <div className="md:col-span-2 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, brand, or category..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Brand Filter */}
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                >
                  <option value="">All Brands</option>
                  {availableBrands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="priceHigh">Price: High to Low</option>
                  <option value="priceLow">Price: Low to High</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || selectedBrand) && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                {searchQuery && (
                  <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {selectedBrand && (
                  <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    Brand: {selectedBrand}
                    <button
                      onClick={() => setSelectedBrand('')}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size={200} />
            </div>
          ) : bikes.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <FaMotorcycle className="text-5xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No bikes found</p>
              {(searchQuery || selectedBrand) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBrand('');
                  }}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {bikes.map((bike) => (
                  <motion.div
                    key={bike._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    {bike.images?.[0] && (
                      <img
                        src={`${bike.images[0].url}`}
                        alt={bike.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{bike.name}</h3>
                      <p className="text-gray-600 mb-2">{bike.brand} • {bike.category}</p>
                      <p className="text-primary-600 font-bold mb-4">रु{bike.price?.toLocaleString()}</p>
                      <button
                        onClick={() => handleListBike(bike)}
                        className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 flex items-center justify-center space-x-2"
                      >
                        <FaPlus />
                        <span>List This Bike</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4 mt-6">
                  <div className="text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                    ({pagination.totalItems} total bikes)
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fetchBikes(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${pagination.hasPrevPage
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <FaChevronLeft />
                      <span>Previous</span>
                    </motion.button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }

                        return (
                          <motion.button
                            key={pageNum}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => fetchBikes(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium transition-all ${pageNum === pagination.currentPage
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            {pageNum}
                          </motion.button>
                        );
                      })}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fetchBikes(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${pagination.hasNextPage
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      <span>Next</span>
                      <FaChevronRight />
                    </motion.button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookings */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FaCalendarAlt className="text-xl text-primary-600" />
              <h2 className="text-xl font-bold">Test Ride Bookings</h2>
            </div>
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-gray-600">No bookings yet</p>
              ) : (
                bookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-white p-4 rounded-lg shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold">{booking.bike?.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center space-x-1">
                          <FaEnvelope className="text-xs" />
                          <span>{booking.user?.name} • {booking.user?.email}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.bookingDate).toLocaleDateString()} at {displayBookingTime(booking.preferredTime)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    {booking.message && (
                      <p className="text-sm text-gray-600 mb-2">{booking.message}</p>
                    )}
                    {booking.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setAction('approve');
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
                        >
                          <FaCheckCircle />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setAction('reject');
                          }}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center space-x-1"
                        >
                          <FaTimesCircle />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setAction('reschedule');
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                        >
                          <FaClock />
                          <span>Reschedule</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Inquiries */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FaComments className="text-xl text-primary-600" />
              <h2 className="text-xl font-bold">Customer Inquiries</h2>
            </div>
            <div className="space-y-4">
              {inquiries.length === 0 ? (
                <p className="text-gray-600">No inquiries yet</p>
              ) : (
                inquiries.map((inquiry) => (
                  <div
                    key={inquiry._id}
                    className="bg-white p-4 rounded-lg shadow-md"
                  >
                    <h3 className="font-bold">{inquiry.subject}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      From: {inquiry.user?.name} • Bike: {inquiry.bike?.name}
                    </p>
                    <p className="text-sm mb-2">{inquiry.message}</p>
                    {inquiry.dealerReply ? (
                      <div className="bg-gray-50 p-2 rounded text-sm">
                        <p className="font-semibold">Your Reply:</p>
                        <p>{inquiry.dealerReply.message}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInquiryReply(inquiry._id)}
                        className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700 flex items-center space-x-1"
                      >
                        <FaReply />
                        <span>Reply</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spare Parts Tab */}
      {activeTab === 'spareParts' && (
        <div>
          {/* Sub-view toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setSparePartsView('browse')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  sparePartsView === 'browse'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Browse All Parts
              </button>
              <button
                onClick={() => setSparePartsView('my')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  sparePartsView === 'my'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                My Listed Parts ({mySpareParts.length})
              </button>
            </div>
          </div>

          {sparePartsView === 'browse' ? (
            <>
              {/* Search and Filter */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={spSearch}
                      onChange={(e) => setSpSearch(e.target.value)}
                      placeholder="Search by name or part number..."
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                    <select
                      value={spCategory}
                      onChange={(e) => setSpCategory(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
                    >
                      <option value="">All Categories</option>
                      {spCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {(spSearch || spCategory) && (
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                    {spSearch && (
                      <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        Search: "{spSearch}"
                        <button onClick={() => setSpSearch('')} className="text-primary-600 hover:text-primary-800">
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {spCategory && (
                      <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        Category: {spCategory}
                        <button onClick={() => setSpCategory('')} className="text-primary-600 hover:text-primary-800">
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Parts Grid */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner size={200} />
                </div>
              ) : spareParts.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <FaCogs className="text-5xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No spare parts found</p>
                  {(spSearch || spCategory) && (
                    <button
                      onClick={() => { setSpSearch(''); setSpCategory(''); }}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-600 mb-4">
                    Showing {spareParts.length} of {spPagination.totalItems} parts
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {spareParts.map(part => (
                      <motion.div
                        key={part._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow-md overflow-hidden"
                      >
                        {part.image && (
                          <img
                            src={part.image}
                            alt={part.name}
                            className="w-full h-40 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-lg">{part.name}</h3>
                            {part.isListedByDealer && (
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
                                Listed
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-1">{part.bike?.brand} — {part.bike?.name}</p>
                          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mb-2">{part.category}</span>
                          {part.partNumber && (
                            <p className="text-xs text-gray-500 mb-1">Part #: {part.partNumber}</p>
                          )}
                          <p className="text-primary-600 font-bold mb-3">रु{part.price?.toLocaleString()}</p>
                          <button
                            onClick={() => handleToggleSparePart(part._id)}
                            disabled={togglingPart === part._id}
                            className={`w-full px-4 py-2 rounded font-medium text-sm transition-all flex items-center justify-center space-x-2 ${
                              part.isListedByDealer
                                ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                                : 'bg-primary-600 text-white hover:bg-primary-700'
                            } disabled:opacity-50`}
                          >
                            {togglingPart === part._id ? (
                              <FaSpinner className="animate-spin" />
                            ) : part.isListedByDealer ? (
                              <><FaTimes /><span>Unlist</span></>
                            ) : (
                              <><FaPlus /><span>List This Part</span></>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {spPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4">
                      <div className="text-sm text-gray-600">
                        Page {spPagination.currentPage} of {spPagination.totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchSpareParts(spPagination.currentPage - 1)}
                          disabled={!spPagination.hasPrevPage}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            spPagination.hasPrevPage
                              ? 'bg-primary-600 text-white hover:bg-primary-700'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <FaChevronLeft /> Previous
                        </button>
                        <button
                          onClick={() => fetchSpareParts(spPagination.currentPage + 1)}
                          disabled={!spPagination.hasNextPage}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            spPagination.hasNextPage
                              ? 'bg-primary-600 text-white hover:bg-primary-700'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Next <FaChevronRight />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* My Spare Parts View */
            <>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner size={200} />
                </div>
              ) : mySpareParts.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <FaCogs className="text-5xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No spare parts listed yet</p>
                  <button
                    onClick={() => setSparePartsView('browse')}
                    className="bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700"
                  >
                    Browse Spare Parts
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mySpareParts.map(part => (
                    <motion.div
                      key={part._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg shadow-md overflow-hidden"
                    >
                      {part.image && (
                        <img src={part.image} alt={part.name} className="w-full h-40 object-cover" />
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-1">{part.name}</h3>
                        <p className="text-gray-600 text-sm mb-1">{part.bike?.brand} — {part.bike?.name}</p>
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mb-2">{part.category}</span>
                        {part.partNumber && (
                          <p className="text-xs text-gray-500 mb-1">Part #: {part.partNumber}</p>
                        )}
                        <p className="text-primary-600 font-bold mb-3">रु{part.price?.toLocaleString()}</p>
                        <button
                          onClick={() => handleToggleSparePart(part._id)}
                          disabled={togglingPart === part._id}
                          className="w-full bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 px-4 py-2 rounded font-medium text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          {togglingPart === part._id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <><FaTrash /><span>Unlist</span></>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Action Modal */}
      {selectedBooking && action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {action.charAt(0).toUpperCase() + action.slice(1)} Booking
            </h3>
            {action === 'reschedule' && (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">New Date</label>
                  <input
                    id="rescheduleDate"
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New Time</label>
                  <select
                    id="rescheduleTime"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select 15-minute slot</option>
                    {generateBookingSlots().map((slot) => (
                      <option key={slot} value={slot}>
                        {formatSlotLabel(slot)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Message (Optional)</label>
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Add a message..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBookingAction}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setAction('');
                  setResponseMessage('');
                }}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listing Form Modal */}
      {showListingForm && selectedBike && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">List Bike: {selectedBike.name}</h3>
                <button
                  onClick={() => {
                    setShowListingForm(false);
                    setSelectedBike(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <form onSubmit={handleSubmitListing} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={listingFormData.availableForTestRide}
                      onChange={(e) => setListingFormData({
                        ...listingFormData,
                        availableForTestRide: e.target.checked
                      })}
                      className="w-5 h-5 text-primary-600"
                    />
                    <span>Available for Test Ride</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={listingFormData.availableForPurchase}
                      onChange={(e) => setListingFormData({
                        ...listingFormData,
                        availableForPurchase: e.target.checked
                      })}
                      className="w-5 h-5 text-primary-600"
                    />
                    <span>Available for Purchase</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    On-Road Price (रु)
                  </label>
                  <input
                    type="number"
                    value={listingFormData.onRoadPrice}
                    onChange={(e) => setListingFormData({
                      ...listingFormData,
                      onRoadPrice: e.target.value
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter on-road price"
                    onBlur={(e) => validateField('onRoadPrice', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Stock Available
                  </label>
                  <input
                    type="number"
                    value={listingFormData.stock}
                    onChange={(e) => setListingFormData({
                      ...listingFormData,
                      stock: e.target.value
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter stock quantity"
                    min="0"
                    onBlur={(e) => validateField('stock', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={listingFormData.notes}
                    onChange={(e) => setListingFormData({
                      ...listingFormData,
                      notes: e.target.value
                    })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                    placeholder="Add any additional notes..."
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 flex items-center justify-center space-x-2"
                  >
                    <FaCheck />
                    <span>List Bike</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowListingForm(false);
                      setSelectedBike(null);
                    }}
                    className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      {/* Messages Tab Content */}
      {activeTab === 'messages' && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <FaCommentsIcon className="text-xl text-primary-600" />
            <h2 className="text-xl font-bold">Messages</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {unreadCount} unread
              </span>
            )}
          </div>

          {conversationsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size={200} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <FaCommentsIcon className="text-5xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Customer messages will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    setChatTarget({
                      otherUserId: conv.otherUser?._id,
                      otherUserName: conv.otherUser?.name || 'User',
                      dealerId: conv.dealer?._id,
                      dealerName: conv.dealer?.name || 'Dealer'
                    });
                    // Mark as read
                    if (conv.otherUser?._id) {
                      markRead(conv.otherUser._id);
                    }
                  }}
                  className={`bg-white p-4 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all flex items-center gap-4 border-2 ${
                    conv.unreadCount > 0 ? 'border-primary-300 bg-primary-50/30' : 'border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {conv.otherUser?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Conversation info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-gray-800 ${conv.unreadCount > 0 ? 'text-primary-700' : ''}`}>
                        {conv.otherUser?.name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {conv.lastMessageAt && new Date(conv.lastMessageAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-sm truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                      {conv.lastSender?.toString() !== conv.otherUser?._id ? 'You: ' : ''}{conv.lastMessage}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Window */}
      <ChatWindow
        isOpen={!!chatTarget}
        onClose={() => {
          setChatTarget(null);
          fetchUnreadCount();
          if (activeTab === 'messages') fetchConversations();
        }}
        otherUserId={chatTarget?.otherUserId}
        otherUserName={chatTarget?.otherUserName}
        dealerId={chatTarget?.dealerId}
        dealerName={chatTarget?.dealerName}
      />
    </div>
  );
};

export default DealerDashboard;

