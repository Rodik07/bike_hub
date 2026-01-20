import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, useInView } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import BikeView360 from '../components/BikeView360';
import EMICalculator from '../components/EMICalculator';
import ExhaustSoundPlayer from '../components/ExhaustSoundPlayer';
import LoadingSpinner from '../components/LoadingSpinner';
import TestRideBookingModal from '../components/TestRideBookingModal';
import {
  FaEye,
  FaBalanceScale,
  FaCalendarCheck,
  FaCalculator,
  FaCog,
  FaTachometerAlt,
  FaRuler,
  FaStopCircle,
  FaTimes,
  FaCheckCircle,
  FaMotorcycle,
  FaFire
} from 'react-icons/fa';
import { fadeInUp, scaleIn, staggerContainer } from '../utils/animations';

const BikeDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bike, setBike] = useState(null);
  const [show360, setShow360] = useState(false);
  const [showEMI, setShowEMI] = useState(false);
  const [showTestRideModal, setShowTestRideModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [compareList, setCompareList] = useState(
    JSON.parse(localStorage.getItem('compareList') || '[]')
  );

  useEffect(() => {
    console.log('🔄 [BikeDetail] Component mounted/updated, ID:', id);
    fetchBike();
  }, [id]);

  const fetchBike = async () => {
    console.log('🔍 [BikeDetail] Starting to fetch bike with ID:', id);
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/bikes/${id}`);
      console.log('✅ [BikeDetail] Bike data loaded successfully:', {
        id: data._id,
        name: data.name,
        brand: data.brand,
        hasImages: !!data.images && data.images.length > 0,
        imageCount: data.images?.length || 0,
        hasDescription: !!data.description,
        hasSpecifications: !!data.specifications,
        price: data.price,
        category: data.category
      });
      console.log('📸 [BikeDetail] Images array:', data.images);
      console.log('📝 [BikeDetail] Description:', data.description);
      console.log('⚙️ [BikeDetail] Specifications:', data.specifications);
      setBike(data);
    } catch (error) {
      console.error('❌ [BikeDetail] Error fetching bike:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      toast.error('Failed to load bike details');
    } finally {
      console.log('🏁 [BikeDetail] Fetch completed, setting loading to false');
      setLoading(false);
    }
  };

  const handleBookTestRide = () => {
    if (!user) {
      toast.error('Please login to book a test ride');
      navigate('/login');
      return;
    }
    setShowTestRideModal(true);
  };

  const handleAddToCompare = () => {
    console.log('➕ [BikeDetail] Adding bike to comparison:', {
      bikeId: bike._id,
      bikeName: bike.name,
      currentCompareList: compareList
    });

    const updatedList = [...compareList];

    // Limit to 4 bikes for comparison
    if (updatedList.length >= 4) {
      toast.error('Maximum 4 bikes can be compared at once');
      console.warn('⚠️ [BikeDetail] Compare list limit reached (4 bikes)');
      return;
    }

    if (!updatedList.find(b => b._id === bike._id)) {
      updatedList.push({ _id: bike._id, name: bike.name, brand: bike.brand });
      localStorage.setItem('compareList', JSON.stringify(updatedList));
      setCompareList(updatedList);
      console.log('✅ [BikeDetail] Bike added to comparison:', updatedList);
      toast.success('Added to comparison');

      // Track comparison
      axios.post(`/api/bikes/${id}/compare`).catch(() => { });
    } else {
      console.log('⚠️ [BikeDetail] Bike already in comparison list');
      toast.error('Bike already in comparison');
    }
  };

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  if (loading) {
    console.log('⏳ [BikeDetail] Still loading, showing loading spinner');
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center items-center">
        <LoadingSpinner size={300} text="Loading bike details..." />
      </div>
    );
  }

  if (!bike) {
    console.warn('⚠️ [BikeDetail] Bike is null/undefined after loading');
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center items-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-2xl p-8 max-w-md mx-auto shadow-xl"
        >
          <p className="text-red-600 text-lg font-bold">Bike not found</p>
        </motion.div>
      </div>
    );
  }

  console.log('🎨 [BikeDetail] Rendering bike detail page:', {
    bikeName: bike.name,
    hasImages: !!bike.images && bike.images.length > 0,
    imageCount: bike.images?.length || 0,
    show360: show360,
    showEMI: showEMI
  });

  console.log('📊 [BikeDetail] Render state:', {
    bikeExists: !!bike,
    imagesExist: !!bike?.images,
    imagesLength: bike?.images?.length || 0,
    containerRefExists: !!containerRef.current,
    isInView: isInView
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8" ref={containerRef}>
        {/* Main Bike Info Section - Always visible */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Animated Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {(() => {
              const hasImages = !!bike.images && bike.images.length > 0;
              console.log('🖼️ [BikeDetail] Rendering images section:', {
                hasImages,
                imageCount: bike.images?.length || 0,
                firstImage: bike.images?.[0]?.url,
                allImages: bike.images
              });

              if (!hasImages) {
                console.log('⚠️ [BikeDetail] No images available, showing placeholder');
              }

              return (
                <>
                  {hasImages ? (
                    <>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="mb-4 rounded-2xl overflow-hidden shadow-2xl border-2 border-primary-500/20"
                      >
                        <motion.img
                          src={`http://localhost:5001${bike.images[0].url}`}
                          alt={bike.name}
                          className="w-full h-96 object-cover"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        />
                      </motion.div>
                      {bike.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-3 mb-6">
                          {bike.images.slice(1, 5).map((img, idx) => (
                            <motion.div
                              key={idx}
                              whileHover={{ scale: 1.1, y: -5 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <img
                                src={`http://localhost:5001${img.url}`}
                                alt={bike.name}
                                className="w-full h-24 object-cover rounded-xl cursor-pointer shadow-lg border-2 border-transparent hover:border-primary-500 transition-all"
                              />
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mb-4 rounded-2xl overflow-hidden shadow-2xl border-2 border-primary-500/20 bg-gray-100 flex items-center justify-center h-96">
                      <div className="text-center">
                        <FaMotorcycle className="text-6xl text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No images available</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-6 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShow360(!show360)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-accent-500 text-white px-6 py-4 rounded-xl font-bold hover:from-primary-700 hover:to-accent-600 transition-all shadow-lg"
                    >
                      <FaEye />
                      <span>{show360 ? 'Hide' : 'View'} 360°</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddToCompare}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-br from-gray-700 to-gray-800 text-white px-6 py-4 rounded-xl font-bold hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg"
                    >
                      <FaBalanceScale />
                      <span>Compare</span>
                    </motion.button>
                  </div>
                </>
              );
            })()}
          </motion.div>

          {/* Animated Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-2xl border-2 border-primary-500/20"
          >
            <div className="mb-6">
              <motion.h1
                whileHover={{ scale: 1.02 }}
                className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent"
              >
                {bike.name}
              </motion.h1>
              <div className="flex items-center space-x-3 mb-4">
                <motion.span
                  whileHover={{ scale: 1.1 }}
                  className="bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 px-4 py-2 rounded-full text-sm font-bold"
                >
                  {bike.brand}
                </motion.span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600 font-semibold">{bike.category}</span>
                {bike.featured && (
                  <motion.span
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                  >
                    <FaFire />
                    <span>Hot</span>
                  </motion.span>
                )}
              </div>
              <div className="mb-6">
                <motion.p
                  whileHover={{ scale: 1.05 }}
                  className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent"
                >
                  रु{bike.price.toLocaleString()}
                </motion.p>
                <p className="text-sm text-gray-600 font-medium">
                  Ex-showroom: रु{bike.exShowroomPrice.toLocaleString()}
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 font-medium">
                {bike.description || 'No description available for this bike.'}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBookTestRide}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-accent-500 text-white px-6 py-4 rounded-xl font-bold hover:from-primary-700 hover:to-accent-600 transition-all shadow-lg"
              >
                <FaCalendarCheck />
                <span>Book Test Ride</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEMI(!showEMI)}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-br from-gray-700 to-gray-800 text-white px-6 py-4 rounded-xl font-bold hover:from-gray-800 hover:to-gray-900 transition-all shadow-lg"
              >
                <FaCalculator />
                <span>{showEMI ? 'Hide' : 'Calculate'} EMI</span>
              </motion.button>
            </div>

            {showEMI && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <EMICalculator price={bike.price} />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Exhaust Sound Player */}
        {bike.exhaustSound && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <ExhaustSoundPlayer soundUrl={bike.exhaustSound} bikeName={bike.name} />
          </motion.div>
        )}

        {/* 360° View */}
        {show360 && (() => {
          console.log('🔄 [BikeDetail] Rendering 360° view');
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-2xl border-2 border-primary-500/20"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                  <FaEye className="text-primary-600" />
                  <span>360° Interactive View</span>
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShow360(false)}
                  className="text-gray-500 hover:text-primary-600 transition-colors"
                >
                  <FaTimes className="text-xl" />
                </motion.button>
              </div>
              <BikeView360 bike={bike} />
            </motion.div>
          );
        })()}

        {/* Animated Specifications */}
        {(() => {
          console.log('⚙️ [BikeDetail] Rendering specifications:', {
            hasSpecifications: !!bike.specifications,
            hasEngine: !!bike.specifications?.engine,
            hasPerformance: !!bike.specifications?.performance,
            hasDimensions: !!bike.specifications?.dimensions,
            hasBrakes: !!bike.specifications?.brakes,
            specificationsObject: bike.specifications
          });
          return (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-2xl border-2 border-primary-500/20"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <FaCog className="text-primary-600" />
                </motion.div>
                <span>Specifications</span>
              </h2>
              {bike.specifications ? (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {bike.specifications.engine && (
                    <motion.div
                      variants={scaleIn}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6 border-2 border-primary-200 shadow-lg"
                    >
                      <h3 className="font-bold text-xl mb-4 flex items-center space-x-2 text-gray-800">
                        <FaCog className="text-primary-600" />
                        <span>Engine</span>
                      </h3>
                      <ul className="space-y-2 text-gray-700">
                        {Object.entries(bike.specifications.engine).map(([key, value]) => (
                          <li key={key} className="flex justify-between border-b border-gray-200 pb-2">
                            <span className="capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="text-gray-600">{value}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                  {bike.specifications.performance && (
                    <motion.div
                      variants={scaleIn}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-xl p-6 border-2 border-accent-200 shadow-lg"
                    >
                      <h3 className="font-bold text-xl mb-4 flex items-center space-x-2 text-gray-800">
                        <FaTachometerAlt className="text-accent-600" />
                        <span>Performance</span>
                      </h3>
                      <ul className="space-y-2 text-gray-700">
                        {Object.entries(bike.specifications.performance).map(([key, value]) => (
                          <motion.li
                            key={key}
                            whileHover={{ x: 5 }}
                            className="flex justify-between border-b border-accent-200 pb-2"
                          >
                            <span className="capitalize font-semibold">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="text-gray-700 font-medium">{value}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                  {bike.specifications.dimensions && (
                    <motion.div
                      variants={scaleIn}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6 border-2 border-primary-200 shadow-lg"
                    >
                      <h3 className="font-bold text-xl mb-4 flex items-center space-x-2 text-gray-800">
                        <FaRuler className="text-primary-600" />
                        <span>Dimensions</span>
                      </h3>
                      <ul className="space-y-2 text-gray-700">
                        {Object.entries(bike.specifications.dimensions).map(([key, value]) => (
                          <motion.li
                            key={key}
                            whileHover={{ x: 5 }}
                            className="flex justify-between border-b border-primary-200 pb-2"
                          >
                            <span className="capitalize font-semibold">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="text-gray-700 font-medium">{value}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                  {bike.specifications.brakes && (
                    <motion.div
                      variants={scaleIn}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300 shadow-lg"
                    >
                      <h3 className="font-bold text-xl mb-4 flex items-center space-x-2 text-gray-800">
                        <FaStopCircle className="text-primary-600" />
                        <span>Brakes</span>
                      </h3>
                      <ul className="space-y-2 text-gray-700">
                        {Object.entries(bike.specifications.brakes).map(([key, value]) => (
                          <motion.li
                            key={key}
                            whileHover={{ x: 5 }}
                            className="flex justify-between border-b border-gray-300 pb-2"
                          >
                            <span className="capitalize font-semibold">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="text-gray-700 font-medium">{String(value)}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <FaCog className="text-5xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Specifications not available</p>
                </div>
              )}
            </motion.div>
          );
        })()}
      </div>

      {/* Test Ride Booking Modal */}
      <TestRideBookingModal
        isOpen={showTestRideModal}
        onClose={() => setShowTestRideModal(false)}
        bikeId={id}
        bike={bike}
      />
    </div>
  );
};

export default BikeDetail;

