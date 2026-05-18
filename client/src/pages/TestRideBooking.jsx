import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FaMotorcycle,
  FaStore,
  FaCalendarAlt,
  FaClock,
  FaComment,
  FaCheckCircle
} from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatSlotLabel, generateBookingSlots } from '../utils/bookingSlots';

const TestRideBooking = () => {
  const { bikeId } = useParams();
  const navigate = useNavigate();
  const [bike, setBike] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [formData, setFormData] = useState({
    dealer: '',
    bookingDate: '',
    preferredTime: '',
    message: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    fetchBike();
    fetchDealers();
  }, []);

  useEffect(() => {
    if (!formData.dealer || !formData.bookingDate) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      try {
        setSlotsLoading(true);
        const { data } = await axios.get('/api/bookings/available-slots', {
          params: { dealer: formData.dealer, date: formData.bookingDate }
        });
        setAvailableSlots(data.availableSlots || []);
        if (formData.preferredTime && !data.availableSlots?.includes(formData.preferredTime)) {
          setFormData((prev) => ({ ...prev, preferredTime: '' }));
        }
      } catch {
        setAvailableSlots(generateBookingSlots());
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [formData.dealer, formData.bookingDate]);

  const fetchBike = async () => {
    try {
      const { data } = await axios.get(`/api/bikes/${bikeId}`);
      setBike(data);
    } catch (error) {
      toast.error('Failed to load bike details');
      navigate('/bikes');
    } finally {
      setLoading(false);
    }
  };

  const fetchDealers = async () => {
    try {
      const { data } = await axios.get('/api/dealers?type=showroom');
      setDealers(data);
    } catch (error) {
      toast.error('Failed to load dealers');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post('/api/bookings', {
        bike: bikeId,
        dealer: formData.dealer,
        bookingDate: formData.bookingDate,
        preferredTime: formData.preferredTime,
        message: formData.message
      });
      toast.success('Test ride booking requested successfully!');
      navigate('/my-bookings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book test ride');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <LoadingSpinner size={250} text="Loading..." />
      </div>
    );
  }

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center space-x-3 mb-6">
        <FaCalendarAlt className="text-4xl text-primary-600" />
        <h1 className="text-3xl font-bold">Book Test Ride</h1>
      </div>

      {bike && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center space-x-3">
          <FaMotorcycle className="text-3xl text-primary-600" />
          <div>
            <h2 className="text-xl font-bold mb-1">{bike.name}</h2>
            <p className="text-gray-600">{bike.brand} • {bike.category}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
              <FaStore className="text-primary-600" />
              <span>Select Dealer *</span>
            </label>
            <select
              name="dealer"
              required
              value={formData.dealer}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
            >
              <option value="">Choose a dealer</option>
              {dealers.map((dealer) => (
                <option key={dealer._id} value={dealer._id}>
                  {dealer.name} - {dealer.address?.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
              <FaCalendarAlt className="text-primary-600" />
              <span>Preferred Date *</span>
            </label>
            <input
              type="date"
              name="bookingDate"
              required
              min={minDate}
              value={formData.bookingDate}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
              <FaClock className="text-primary-600" />
              <span>Time Slot (15 min) *</span>
            </label>
            {slotsLoading ? (
              <div className="flex justify-center py-2">
                <LoadingSpinner size={24} inline={true} />
              </div>
            ) : (
              <select
                name="preferredTime"
                required
                disabled={!formData.dealer || !formData.bookingDate || availableSlots.length === 0}
                value={formData.preferredTime}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 disabled:bg-gray-100"
              >
                <option value="">
                  {!formData.dealer || !formData.bookingDate
                    ? 'Select dealer and date first'
                    : availableSlots.length === 0
                      ? 'No slots available'
                      : 'Select a 15-minute slot'}
                </option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {formatSlotLabel(slot)}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              One booking per dealership per 15-minute slot.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
              <FaComment className="text-primary-600" />
              <span>Additional Message</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
              placeholder="Any special requests or notes..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !formData.preferredTime}
            className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all"
          >
            {submitting ? (
              <>
                <LoadingSpinner size={20} inline={true} />
                <span>Booking...</span>
              </>
            ) : (
              <>
                <FaCheckCircle />
                <span>Book Test Ride</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestRideBooking;
