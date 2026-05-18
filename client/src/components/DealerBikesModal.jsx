import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import {
  FaMotorcycle,
  FaStore,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCalendarCheck,
  FaShoppingCart,
  FaSpinner
} from 'react-icons/fa';

const DealerBikesModal = ({ isOpen, onClose, dealer }) => {
  const [dealerData, setDealerData] = useState(null);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && dealer) {
      fetchDealerBikes();
    }
  }, [isOpen, dealer]);

  const fetchDealerBikes = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/dealers/${dealer._id}/bikes`);
      setDealerData(data.dealer);
      setBikes(data.bikes);
    } catch (error) {
      toast.error('Failed to load dealer bikes');
      console.error('Error fetching dealer bikes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={dealer?.name || 'Dealer Bikes'} size="lg">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size={200} text="Loading bikes..." />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dealer Info */}
          {dealerData && (
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-4 rounded-lg border border-primary-200">
              <div className="flex items-start space-x-4">
                <div className="bg-primary-600 p-3 rounded-lg">
                  <FaStore className="text-white text-2xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{dealerData.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    {dealerData.address && (
                      <p className="flex items-center space-x-2">
                        <FaMapMarkerAlt className="text-primary-600" />
                        <span>
                          {dealerData.address.street && `${dealerData.address.street}, `}
                          {dealerData.address.city}
                          {dealerData.address.state && `, ${dealerData.address.state}`}
                        </span>
                      </p>
                    )}
                    <p className="flex items-center space-x-2">
                      <FaPhone className="text-primary-600" />
                      <span>{dealerData.phone}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <FaEnvelope className="text-primary-600" />
                      <span>{dealerData.email}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bikes List */}
          {bikes.length === 0 ? (
            <div className="text-center py-12">
              <FaMotorcycle className="text-5xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No bikes listed by this dealer yet</p>
              <p className="text-gray-500 text-sm mt-2">Check back later for available bikes</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Available Bikes ({bikes.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {bikes.map((item) => (
                  <motion.div
                    key={item.listingId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-primary-500 transition-all shadow-sm hover:shadow-md"
                  >
                    {item.bike?.images?.[0] && (
                      <Link to={`/bikes/${item.bike._id}`} onClick={onClose}>
                        <img
                          src={`${item.bike.images[0].url}`}
                          alt={item.bike.name}
                          className="w-full h-40 object-cover"
                        />
                      </Link>
                    )}
                    <div className="p-4">
                      <Link to={`/bikes/${item.bike._id}`} onClick={onClose}>
                        <h4 className="font-bold text-lg text-gray-900 mb-1 hover:text-primary-600 transition-colors">
                          {item.bike.name}
                        </h4>
                      </Link>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.bike.brand} • {item.bike.category}
                      </p>

                      <div className="space-y-2 mb-3">
                        {item.onRoadPrice && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">On-Road Price:</span>
                            <span className="font-bold text-primary-600 flex items-center space-x-1">
                              <span className="font-bold">रु</span>
                              <span>{item.onRoadPrice.toLocaleString()}</span>
                            </span>
                          </div>
                        )}
                        {item.stock !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Stock:</span>
                            <span className={`font-semibold ${item.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.stock > 0 ? `${item.stock} Available` : 'Out of Stock'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3">
                        {item.availableForTestRide && (
                          <span className="flex items-center space-x-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            <FaCalendarCheck />
                            <span>Test Ride</span>
                          </span>
                        )}
                        {item.availableForPurchase && (
                          <span className="flex items-center space-x-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            <FaShoppingCart />
                            <span>For Sale</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Link
                          to={`/bikes/${item.bike._id}`}
                          onClick={onClose}
                          className="flex-1 text-center text-sm bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

export default DealerBikesModal;

