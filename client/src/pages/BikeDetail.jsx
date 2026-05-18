import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, useInView, AnimatePresence } from 'framer-motion';
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
  FaFire,
  FaCogs,
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaRegStar,
  FaThumbsUp,
  FaCommentDots,
  FaEdit
} from 'react-icons/fa';
import { fadeInUp, scaleIn, staggerContainer } from '../utils/animations';
import PromotionBanner from '../components/PromotionBanner';

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
  const [spareParts, setSpareParts] = useState([]);
  const [showSpareParts, setShowSpareParts] = useState(false);

  // Review preview state
  const [previewReview, setPreviewReview] = useState(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewKey, setReviewKey] = useState(0);

  useEffect(() => {
    console.log('🔄 [BikeDetail] Component mounted/updated, ID:', id);
    fetchBike();
  }, [id]);

  useEffect(() => {
    if (id) {
      axios.get(`/api/spare-parts/${id}?limit=10`)
        .then(({ data }) => setSpareParts(data.parts || []))
        .catch(() => { });
    }
  }, [id]);

  // Fetch random review preview
  const fetchReviewPreview = useCallback(() => {
    if (id) {
      axios.get(`/api/reviews/${id}/preview`)
        .then(({ data }) => {
          setPreviewReview(data.review);
          setTotalReviews(data.totalReviews);
          setAvgRating(data.avgRating);
          setReviewKey(prev => prev + 1);
        })
        .catch(() => { });
    }
  }, [id]);

  useEffect(() => {
    fetchReviewPreview();
  }, [fetchReviewPreview]);

  // Auto-cycle review every 5 seconds
  useEffect(() => {
    if (totalReviews > 1) {
      const interval = setInterval(fetchReviewPreview, 5000);
      return () => clearInterval(interval);
    }
  }, [totalReviews, fetchReviewPreview]);

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
        {/* Promotion Ad Popup */}
        <PromotionBanner />

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
                          src={`${bike.images[0].url}`}
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
                                src={`${img.url}`}
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

        {/* View Spare Parts Section — Horizontal Scroll */}
        {spareParts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <FaCogs className="text-primary-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Spare Parts</h2>
                  <p className="text-gray-500 text-sm">{spareParts.length} parts available</p>
                </div>
              </div>
              {/* Scroll arrows */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const el = document.getElementById('spare-parts-scroll');
                    if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
                  }}
                  className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <FaChevronLeft className="text-sm text-gray-600" />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('spare-parts-scroll');
                    if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
                  }}
                  className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <FaChevronRight className="text-sm text-gray-600" />
                </button>
              </div>
            </div>

            {/* Horizontal scroll container */}
            <div
              id="spare-parts-scroll"
              className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {spareParts.slice(0, 8).map((part, index) => (
                <motion.div
                  key={part._id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  style={{ scrollSnapAlign: 'start' }}
                  className="flex-shrink-0 w-[calc(33.333%-12px)] min-w-[220px]"
                >
                  <Link
                    to={`/spare-parts/${part._id}`}
                    className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all border border-gray-100 group hover:-translate-y-1"
                  >
                    {part.image ? (
                      <div className="overflow-hidden">
                        <img
                          src={part.image}
                          alt={part.name}
                          className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-36 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                        <FaCogs className="text-3xl text-gray-200" />
                      </div>
                    )}
                    <div className="p-3">
                      <h4 className="font-bold text-sm mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">{part.name}</h4>
                      <span className="inline-block bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                        {part.category}
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="text-primary-600 font-bold text-sm">रु{part.price.toLocaleString()}</span>
                        <span className="text-green-600 text-[10px] font-medium flex items-center gap-1">
                          <FaCheckCircle className="text-[8px]" /> In Stock
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}

              {/* View More card */}
              {spareParts.length > 8 && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  style={{ scrollSnapAlign: 'start' }}
                  className="flex-shrink-0 w-[calc(33.333%-12px)] min-w-[220px]"
                >
                  <Link
                    to={`/bikes/${id}/spare-parts`}
                    className="block bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border-2 border-primary-200 border-dashed h-full min-h-[230px] flex items-center justify-center hover:from-primary-100 hover:to-primary-200 transition-all group"
                  >
                    <div className="text-center p-4">
                      <div className="w-14 h-14 bg-primary-200 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-300 transition-colors">
                        <FaArrowRight className="text-primary-700 text-xl" />
                      </div>
                      <p className="text-primary-700 font-bold">View All Parts</p>
                      <p className="text-primary-500 text-sm">{spareParts.length - 8}+ more</p>
                    </div>
                  </Link>
                </motion.div>
              )}
            </div>

            {/* View all link */}
            <div className="text-center mt-4">
              <Link
                to={`/bikes/${id}/spare-parts`}
                className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors group"
              >
                <span>View All Spare Parts</span>
                <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        )}

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

        {/* ===== REVIEW PREVIEW SECTION ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-2xl border-2 border-primary-500/20"
        >
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <FaStar className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {totalReviews > 0 ? (
                    <>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s}>
                            {s <= Math.round(avgRating)
                              ? <FaStar className="text-yellow-400 text-sm" />
                              : <FaRegStar className="text-gray-300 text-sm" />}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-600">{avgRating}</span>
                      <span className="text-sm text-gray-400">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">No reviews yet</span>
                  )}
                </div>
              </div>
            </div>
            <Link
              to={`/bikes/${id}/reviews`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-accent-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-primary-700 hover:to-accent-600 transition-all shadow-md hover:shadow-lg group"
            >
              <span>{totalReviews > 0 ? 'See All Reviews' : 'Write a Review'}</span>
              <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Preview card — one random review */}
          {previewReview ? (
            <Link to={`/bikes/${id}/reviews`} className="block">
              <AnimatePresence mode="wait">
                <motion.div
                  key={reviewKey}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="bg-gradient-to-r from-primary-50/60 to-accent-50/40 rounded-xl p-5 border border-primary-200 hover:border-primary-400 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                      {previewReview.user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800">{previewReview.user?.name}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s}>
                              {s <= previewReview.rating
                                ? <FaStar className="text-yellow-400 text-xs" />
                                : <FaRegStar className="text-gray-300 text-xs" />}
                            </span>
                          ))}
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-700 mt-1">{previewReview.title}</h4>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{previewReview.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><FaThumbsUp /> {previewReview.likes?.length || 0}</span>
                        <span className="flex items-center gap-1"><FaCommentDots /> {previewReview.comments?.length || 0}</span>
                      </div>
                    </div>
                    <FaArrowRight className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all mt-3 flex-shrink-0" />
                  </div>
                </motion.div>
              </AnimatePresence>
            </Link>
          ) : (
            <div className="text-center py-8">
              <FaCommentDots className="text-4xl text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No reviews yet. Be the first!</p>
              {user && (
                <Link
                  to={`/bikes/${id}/reviews`}
                  className="inline-flex items-center gap-2 mt-3 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                >
                  <FaEdit /> Write a Review
                </Link>
              )}
            </div>
          )}

          {/* Dots indicator for cycling */}
          {totalReviews > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {Array.from({ length: Math.min(totalReviews, 5) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === (reviewKey - 1) % Math.min(totalReviews, 5)
                      ? 'bg-primary-500 scale-125'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
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

