import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Modal from './Modal';
import {
  FaMotorcycle,
  FaStore,
  FaCalendarAlt,
  FaClock,
  FaComment,
  FaCheckCircle
} from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import { formatSlotLabel, generateBookingSlots } from '../utils/bookingSlots';

const TestRideBookingModal = ({ isOpen, onClose, bikeId, bike }) => {
  const [dealers, setDealers] = useState([]);
  const [formData, setFormData] = useState({
    dealer: '',
    bookingDate: '',
    preferredTime: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDealers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!formData.dealer || !formData.bookingDate) {
      setAvailableSlots([]);
      if (formData.preferredTime) {
        setFormData((prev) => ({ ...prev, preferredTime: '' }));
      }
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
        toast.error('Could not load available time slots');
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [formData.dealer, formData.bookingDate]);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/dealers?type=showroom');
      setDealers(data);
    } catch (error) {
      toast.error('Failed to load dealers');
    } finally {
      setLoading(false);
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
      onClose();
      setFormData({
        dealer: '',
        bookingDate: '',
        preferredTime: '',
        message: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book test ride');
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Test Ride" size="md">
      <div className="space-y-6">
        {bike && (
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-4 rounded-lg flex items-center space-x-3 border border-primary-200">
            {bike.images?.[0] && (
              <img
                src={`${bike.images[0].url}`}
                alt={bike.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="font-bold text-lg text-gray-900">{bike.name}</h3>
              <p className="text-gray-600 text-sm">{bike.brand} • {bike.category}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
              <FaStore className="text-primary-600" />
              <span>Select Dealer *</span>
            </label>
            {loading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size={40} inline={true} />
              </div>
            ) : (
              <select
                name="dealer"
                required
                value={formData.dealer}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none bg-white cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
              >
                <option value="">Choose a dealer</option>
                {dealers.map((dealer) => (
                  <option key={dealer._id} value={dealer._id}>
                    {dealer.name} - {dealer.address?.city}
                  </option>
                ))}
              </select>
            )}
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
              <FaClock className="text-primary-600" />
              <span>Time Slot (15 min) *</span>
            </label>
            {slotsLoading ? (
              <div className="flex justify-center py-3">
                <LoadingSpinner size={32} inline={true} />
              </div>
            ) : (
              <select
                name="preferredTime"
                required
                disabled={!formData.dealer || !formData.bookingDate || availableSlots.length === 0}
                value={formData.preferredTime}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none bg-white cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
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
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
              placeholder="Any special requests or notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.preferredTime}
              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-accent-500 text-white px-4 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-accent-600 disabled:opacity-50 transition-all"
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
    </Modal>
  );
};

export default TestRideBookingModal;
