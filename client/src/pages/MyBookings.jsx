import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ChatWindow from '../components/ChatWindow';
import PromotionBanner from '../components/PromotionBanner';
import {
  FaCalendarAlt,
  FaMotorcycle,
  FaStore,
  FaMapMarkerAlt,
  FaClock,
  FaBicycle,
  FaChevronRight,
  FaEllipsisV,
  FaEdit,
  FaTimes,
  FaComments,
  FaWhatsapp,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaRedo,
  FaBan,
  FaCheck,
  FaArrowRight,
  FaInfoCircle
} from 'react-icons/fa';
import { staggerContainer, fadeInUp, scaleIn } from '../utils/animations';
import { displayBookingTime, formatSlotLabel, normalizeTimeTo24 } from '../utils/bookingSlots';

const MyBookings = () => {
  const { user } = useContext(AuthContext);
  const { unreadCount } = useContext(SocketContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [menuOpen, setMenuOpen] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [editData, setEditData] = useState({ bookingDate: '', preferredTime: '' });
  const [editAvailableSlots, setEditAvailableSlots] = useState([]);
  const [editSlotsLoading, setEditSlotsLoading] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const handleClick = () => setMenuOpen(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (!editModal || !editData.bookingDate) {
      setEditAvailableSlots([]);
      return;
    }

    const dealerId = editModal.dealer?._id || editModal.dealer;
    const fetchEditSlots = async () => {
      try {
        setEditSlotsLoading(true);
        const { data } = await axios.get('/api/bookings/available-slots', {
          params: {
            dealer: dealerId,
            date: editData.bookingDate,
            excludeBookingId: editModal._id
          }
        });
        setEditAvailableSlots(data.availableSlots || []);
      } catch {
        setEditAvailableSlots([]);
      } finally {
        setEditSlotsLoading(false);
      }
    };

    fetchEditSlots();
  }, [editModal, editData.bookingDate]);

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get('/api/bookings');
      setBookings(data);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelModal) return;
    setSubmitting(true);
    try {
      await axios.put(`/api/bookings/${cancelModal._id}/cancel`, { reason: cancelReason });
      toast.success('Booking cancelled');
      setCancelModal(null);
      setCancelReason('');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editModal) return;
    setSubmitting(true);
    try {
      await axios.put(`/api/bookings/${editModal._id}/edit`, editData);
      toast.success('Booking updated');
      setEditModal(null);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to edit');
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsApp = (dealer) => {
    const phone = dealer?.phone;
    if (!phone) {
      toast.error('Dealer phone number not available');
      return;
    }
    const cleaned = phone.replace(/[^0-9+]/g, '');
    const whatsappNum = cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
    window.open(`https://wa.me/${whatsappNum}`, '_blank');
  };

  const openChat = (booking) => {
    if (!booking.dealer?._id) {
      toast.error('Dealer info not available');
      return;
    }
    axios.get(`/api/auth/user-by-dealer/${booking.dealer._id}`)
      .then(({ data }) => {
        setChatTarget({
          otherUserId: data._id,
          otherUserName: data.name || booking.dealer.name,
          dealerId: booking.dealer._id,
          dealerName: booking.dealer.name
        });
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Unable to connect to dealer chat');
      });
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending:     { icon: FaHourglassHalf, label: 'Pending',     gradient: 'from-amber-500 to-yellow-400',   bg: 'bg-amber-50',   border: 'border-amber-200', text: 'text-amber-700' },
      approved:    { icon: FaCheckCircle,   label: 'Approved',    gradient: 'from-emerald-500 to-green-400',  bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
      rejected:    { icon: FaTimesCircle,   label: 'Rejected',    gradient: 'from-rose-500 to-red-400',       bg: 'bg-rose-50',    border: 'border-rose-200', text: 'text-rose-700' },
      rescheduled: { icon: FaRedo,          label: 'Rescheduled', gradient: 'from-blue-500 to-cyan-400',      bg: 'bg-blue-50',    border: 'border-blue-200', text: 'text-blue-700' },
      completed:   { icon: FaCheck,         label: 'Completed',   gradient: 'from-gray-500 to-slate-400',     bg: 'bg-gray-50',    border: 'border-gray-200', text: 'text-gray-700' },
      cancelled:   { icon: FaBan,           label: 'Cancelled',   gradient: 'from-red-500 to-rose-400',       bg: 'bg-red-50',     border: 'border-red-200', text: 'text-red-600' }
    };
    return configs[status] || configs.pending;
  };

  const tabs = [
    { key: 'all',       label: 'All Bookings',  icon: FaCalendarAlt },
    { key: 'pending',   label: 'Pending',       icon: FaHourglassHalf },
    { key: 'approved',  label: 'Approved',      icon: FaCheckCircle },
    { key: 'completed', label: 'Completed',     icon: FaCheck },
    { key: 'cancelled', label: 'Cancelled',     icon: FaBan }
  ];

  const filteredBookings = activeTab === 'all'
    ? bookings
    : activeTab === 'cancelled'
      ? bookings.filter(b => ['cancelled', 'rejected'].includes(b.status))
      : bookings.filter(b => b.status === activeTab);

  const tabCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => ['cancelled', 'rejected'].includes(b.status)).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center items-center">
        <LoadingSpinner size={250} text="Loading bookings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ====== COMPACT HEADER ====== */}
      <div className="pt-8 pb-4 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg">
              <FaCalendarAlt className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">My Bookings</span>
              </h1>
              <p className="text-gray-500 text-sm font-light">Manage test rides, chat with dealers</p>
            </div>
          </div>
          <div className="flex gap-3">
            {[
              { label: 'Total', value: bookings.length, bg: 'bg-gray-100', text: 'text-gray-800' },
              { label: 'Pending', value: tabCounts.pending, bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700' },
              { label: 'Approved', value: tabCounts.approved, bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700' }
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05, y: -1 }}
                className={`${stat.bg} rounded-xl px-4 py-2 shadow-sm`}
              >
                <p className={`text-xl font-bold ${stat.text}`}>{stat.value}</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Promotion Banner / Ads */}
        <div className="mt-6">
          <PromotionBanner />
        </div>
      </div>

      {/* ====== CONTENT ====== */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.1 }}
        variants={staggerContainer}
        className="py-8 relative"
      >

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          {/* Status Tabs */}
          <motion.div variants={fadeInUp} className="flex justify-center flex-wrap gap-3 mb-10">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const count = tabCounts[tab.key];
              return (
                <motion.button
                  key={tab.key}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm transition-all capitalize rounded-full shadow-md ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <TabIcon className="text-xs" />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center ${
                      activeTab === tab.key
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Empty State */}
          {filteredBookings.length === 0 ? (
            <motion.div
              variants={scaleIn}
              className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-12 shadow-2xl border-2 border-gray-100 text-center max-w-lg mx-auto"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <FaCalendarAlt className="text-7xl text-gray-200 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {activeTab === 'all' ? 'No Bookings Yet' : `No ${tabs.find(t => t.key === activeTab)?.label} Bookings`}
              </h3>
              <p className="text-gray-400 mb-6 font-light">
                Start exploring bikes and book your next test ride
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/bikes"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-xl font-bold hover:from-primary-700 hover:to-accent-600 transition-all shadow-lg"
                >
                  <FaBicycle /> Browse Bikes <FaArrowRight className="text-xs" />
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {filteredBookings.map((booking, index) => {
                const status = getStatusConfig(booking.status);
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={booking._id}
                    variants={fadeInUp}
                    custom={index}
                    whileHover={{ y: -4, scale: 1.005 }}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 overflow-hidden group"
                  >
                    {/* Status gradient bar at top */}
                    <div className={`h-1 bg-gradient-to-r ${status.gradient}`} />

                    <div className="p-6">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Bike image */}
                          <motion.div
                            whileHover={{ scale: 1.08, rotate: 2 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            className="flex-shrink-0"
                          >
                            {booking.bike?.images?.[0] ? (
                              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100 group-hover:border-primary-300 transition-colors">
                                <img
                                  src={booking.bike.images[0].url}
                                  alt={booking.bike.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-lg border-2 border-gray-100">
                                <FaMotorcycle className="text-gray-300 text-2xl" />
                              </div>
                            )}
                          </motion.div>

                          {/* Bike info */}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                              {booking.bike?.name}
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">{booking.bike?.brand}</p>
                            {booking.bike?.price && (
                              <p className="text-sm font-bold text-primary-600 mt-0.5">रु{booking.bike.price.toLocaleString()}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Status badge */}
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm bg-gradient-to-r ${status.gradient} text-white`}
                          >
                            <StatusIcon className="text-[10px]" />
                            {status.label}
                          </motion.span>

                          {/* 3-dot menu */}
                          <div className="relative">
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.85 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(menuOpen === booking._id ? null : booking._id);
                              }}
                              className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-all"
                            >
                              <FaEllipsisV className="text-gray-400 text-sm" />
                            </motion.button>

                            <AnimatePresence>
                              {menuOpen === booking._id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.85, y: -8 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.85, y: -8 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                  className="absolute right-0 top-11 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 w-56 overflow-hidden"
                                  onClick={e => e.stopPropagation()}
                                >
                                  {booking.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditModal(booking);
                                          setEditData({
                                            bookingDate: new Date(booking.bookingDate).toISOString().split('T')[0],
                                            preferredTime: normalizeTimeTo24(booking.preferredTime)
                                          });
                                          setMenuOpen(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-primary-50 flex items-center gap-3 transition-colors font-medium"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center"><FaEdit className="text-primary-600 text-xs" /></div>
                                        Edit Booking
                                      </button>
                                      <button
                                        onClick={() => { setCancelModal(booking); setMenuOpen(null); }}
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 flex items-center gap-3 transition-colors font-medium text-red-600"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><FaBan className="text-red-500 text-xs" /></div>
                                        Cancel Booking
                                      </button>
                                    </>
                                  )}
                                  {!['cancelled', 'rejected'].includes(booking.status) && (
                                    <>
                                      <button
                                        onClick={() => { openChat(booking); setMenuOpen(null); }}
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors font-medium"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><FaComments className="text-blue-500 text-xs" /></div>
                                        Chat with Dealer
                                      </button>
                                      <button
                                        onClick={() => { openWhatsApp(booking.dealer); setMenuOpen(null); }}
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-green-50 flex items-center gap-3 transition-colors font-medium"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"><FaWhatsapp className="text-green-600 text-xs" /></div>
                                        WhatsApp Dealer
                                      </button>
                                    </>
                                  )}
                                  <div className="border-t border-gray-100 my-1" />
                                  <Link
                                    to={`/bikes/${booking.bike?._id}`}
                                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors font-medium text-gray-600"
                                    onClick={() => setMenuOpen(null)}
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><FaChevronRight className="text-gray-400 text-xs" /></div>
                                    View Bike Details
                                  </Link>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      {/* ---- Details Grid ---- */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                        {/* Dealer */}
                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-md">
                            <FaStore className="text-white text-xs" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Dealer</p>
                            <p className="font-bold text-gray-800 text-sm truncate">{booking.dealer?.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <FaMapMarkerAlt className="text-[10px] text-primary-400" />
                              <span className="truncate">{booking.dealer?.address?.city}{booking.dealer?.address?.state ? `, ${booking.dealer.address.state}` : ''}</span>
                            </p>
                          </div>
                        </div>

                        {/* Date/Time */}
                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-md">
                            <FaClock className="text-white text-xs" />
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Test Ride</p>
                            <p className="font-bold text-gray-800 text-sm">
                              {new Date(booking.bookingDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-500">{displayBookingTime(booking.preferredTime)}</p>
                          </div>
                        </div>

                        {/* Booked On */}
                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center flex-shrink-0 shadow-md">
                            <FaInfoCircle className="text-white text-xs" />
                          </div>
                          <div>
                            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Booked On</p>
                            <p className="font-bold text-gray-800 text-sm">
                              {new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Rescheduled notice */}
                      {booking.rescheduledDate && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 p-3.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <FaRedo className="text-blue-500 text-xs" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-blue-700">Rescheduled to</p>
                            <p className="text-sm font-semibold text-blue-800">
                              {new Date(booking.rescheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {booking.rescheduledTime}
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Dealer response */}
                      {booking.dealerResponse && (
                        <div className="mt-4 p-3.5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Dealer Response</p>
                          <p className="text-sm text-gray-700">{booking.dealerResponse}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      {!['cancelled', 'rejected'].includes(booking.status) && (
                        <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
                          <motion.button
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => openChat(booking)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 rounded-xl text-sm font-bold hover:from-primary-100 hover:to-accent-100 transition-all border border-primary-200 shadow-sm"
                          >
                            <FaComments /> Chat with Dealer
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => openWhatsApp(booking.dealer)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl text-sm font-bold hover:from-green-100 hover:to-emerald-100 transition-all border border-green-200 shadow-sm"
                          >
                            <FaWhatsapp className="text-base" /> WhatsApp
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.section>

      {/* ====== EDIT MODAL ====== */}
      <AnimatePresence>
        {editModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditModal(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
                  <FaEdit className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Edit Booking</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    type="date"
                    value={editData.bookingDate}
                    onChange={e => setEditData(prev => ({ ...prev, bookingDate: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Time Slot (15 min)</label>
                  {editSlotsLoading ? (
                    <div className="flex justify-center py-3">
                      <LoadingSpinner size={28} inline={true} />
                    </div>
                  ) : (
                    <select
                      value={editData.preferredTime}
                      onChange={e => setEditData(prev => ({ ...prev, preferredTime: e.target.value }))}
                      disabled={editAvailableSlots.length === 0}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none bg-white disabled:bg-gray-100"
                    >
                      <option value="">
                        {editAvailableSlots.length === 0 ? 'No slots available' : 'Select a 15-minute slot'}
                      </option>
                      {editAvailableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {formatSlotLabel(slot)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditModal(null)}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEdit}
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-xl font-bold disabled:opacity-50 shadow-lg hover:from-primary-700 hover:to-accent-600 transition-all"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== CANCEL MODAL ====== */}
      <AnimatePresence>
        {cancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setCancelModal(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
                  <FaBan className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Cancel Booking</h3>
              </div>
              <p className="text-gray-500 text-sm mb-5">
                Are you sure you want to cancel your test ride for <strong className="text-gray-700">{cancelModal.bike?.name}</strong>?
              </p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (optional)..."
                rows={3}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none transition-all"
              />
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setCancelModal(null); setCancelReason(''); }}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  Keep Booking
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-xl font-bold disabled:opacity-50 hover:from-red-700 hover:to-rose-600 transition-all shadow-lg"
                >
                  {submitting ? 'Cancelling...' : 'Cancel Booking'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <ChatWindow
        isOpen={!!chatTarget}
        onClose={() => setChatTarget(null)}
        otherUserId={chatTarget?.otherUserId}
        otherUserName={chatTarget?.otherUserName}
        dealerId={chatTarget?.dealerId}
        dealerName={chatTarget?.dealerName}
      />
    </div>
  );
};

export default MyBookings;
