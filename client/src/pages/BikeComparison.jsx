import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, useInView } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FaBalanceScale,
  FaTimes,
  FaMotorcycle,
  FaBicycle,
  FaTag
} from 'react-icons/fa';
import { fadeInUp, scaleIn, staggerContainer } from '../utils/animations';
import PromotionBanner from '../components/PromotionBanner';

const BikeComparison = () => {
  const [compareList, setCompareList] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 [BikeComparison] Component mounted, loading compare list');
    const saved = JSON.parse(localStorage.getItem('compareList') || '[]');
    console.log('📋 [BikeComparison] Saved compare list from localStorage:', saved);
    setCompareList(saved);
    fetchBikes(saved);
  }, []);

  const fetchBikes = async (ids) => {
    console.log('🔍 [BikeComparison] Fetching bikes, IDs:', ids);

    if (ids.length === 0) {
      console.log('⚠️ [BikeComparison] No bikes in compare list');
      setLoading(false);
      return;
    }

    try {
      console.log('📤 [BikeComparison] Making API calls for bikes...');
      const bikePromises = ids.map((id, index) => {
        const bikeId = id._id || id; // Handle both object and string formats
        console.log(`📡 [BikeComparison] Fetching bike ${index + 1}/${ids.length}: ${bikeId}`);
        return axios.get(`/api/bikes/${bikeId}`).catch(err => {
          console.error(`❌ [BikeComparison] Failed to fetch bike ${bikeId}:`, err.response?.data || err.message);
          return null; // Return null for failed requests
        });
      });

      const responses = await Promise.all(bikePromises);

      // Filter out null responses (failed requests)
      const successfulResponses = responses.filter(res => res !== null);
      const failedCount = responses.length - successfulResponses.length;

      if (failedCount > 0) {
        console.warn(`⚠️ [BikeComparison] ${failedCount} bike(s) failed to load`);
        toast.error(`${failedCount} bike(s) failed to load`);
      }

      if (successfulResponses.length === 0) {
        console.error('❌ [BikeComparison] No bikes loaded successfully');
        toast.error('Failed to load any bikes for comparison');
        setBikes([]);
        return;
      }

      console.log('✅ [BikeComparison] Bikes fetched successfully:', successfulResponses.map(r => ({
        id: r.data._id,
        name: r.data.name
      })));

      const fetchedBikes = successfulResponses.map(res => res.data);
      setBikes(fetchedBikes);
      console.log('🎉 [BikeComparison] Bikes state updated:', fetchedBikes.length, 'bikes');

      // Update localStorage to remove failed bike IDs
      if (failedCount > 0) {
        const validIds = fetchedBikes.map(b => ({ _id: b._id, name: b.name, brand: b.brand }));
        localStorage.setItem('compareList', JSON.stringify(validIds));
        setCompareList(validIds);
      }
    } catch (error) {
      console.error('❌ [BikeComparison] Unexpected error fetching bikes:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        failedIds: ids
      });
      toast.error('Failed to load bikes for comparison');
      setBikes([]); // Clear bikes on error
    } finally {
      console.log('🏁 [BikeComparison] Fetch completed');
      setLoading(false);
    }
  };

  const removeFromCompare = (bikeId) => {
    const updated = compareList.filter(b => b._id !== bikeId);
    localStorage.setItem('compareList', JSON.stringify(updated));
    setCompareList(updated);
    setBikes(bikes.filter(b => b._id !== bikeId));
    toast.success('Removed from comparison');
  };

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center items-center">
        <LoadingSpinner size={300} text="Loading..." />
      </div>
    );
  }

  console.log('📊 [BikeComparison] Render state:', {
    loading,
    bikesCount: bikes.length,
    compareListCount: compareList.length,
    bikes: bikes.map(b => ({ id: b._id, name: b.name }))
  });

  if (bikes.length === 0) {
    console.log('⚠️ [BikeComparison] No bikes to display, showing empty state');
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center justify-center space-x-3 mb-4"
          >
            <FaBalanceScale className="text-5xl text-primary-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              Bike Comparison
            </h1>
          </motion.div>
          <p className="text-gray-600 mb-6 text-lg">No bikes selected for comparison.</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/bikes"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-accent-500 text-white px-6 py-3 rounded-xl font-bold hover:from-primary-700 hover:to-accent-600 transition-all shadow-lg"
            >
              <FaBicycle />
              <span>Browse Bikes</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const specs = ['engine', 'performance', 'dimensions', 'brakes', 'suspension'];

  console.log('🎨 [BikeComparison] Rendering comparison table with', bikes.length, 'bikes');
  console.log('👁️ [BikeComparison] isInView:', isInView);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8" ref={containerRef}>
        {/* Promotion Ad Popup */}
        <PromotionBanner />

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 mb-8"
        >
          <FaBalanceScale className="text-5xl text-primary-600" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
            Bike Comparison
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="overflow-x-auto bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border-2 border-primary-500/20 p-6"
        >
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-primary-600 to-accent-500 text-white">
                <th className="px-6 py-4 text-left font-bold">Specification</th>
                {bikes.map((bike, index) => {
                  console.log(`🚲 [BikeComparison] Rendering bike ${index + 1}:`, bike.name, bike._id);
                  return (
                    <motion.th
                      key={bike._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="px-6 py-4 text-left relative"
                    >
                      <motion.button
                        whileHover={{ scale: 1.2, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeFromCompare(bike._id)}
                        className="absolute top-2 right-2 text-white hover:text-red-300 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <FaTimes />
                      </motion.button>
                      <Link to={`/bikes/${bike._id}`} className="block">
                        {bike.images && bike.images.length > 0 && (
                          <motion.img
                            src={`${bike.images[0].url}`}
                            alt={bike.name}
                            className="w-32 h-32 object-contain mx-auto mb-3 rounded-xl bg-white/20 p-2"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          />
                        )}
                        <div className="font-bold flex items-center justify-center space-x-1 text-white">
                          <FaMotorcycle />
                          <span>{bike.name}</span>
                        </div>
                        <div className="text-sm text-white/80 flex items-center justify-center space-x-1 mt-1">
                          <FaTag />
                          <span>{bike.brand}</span>
                        </div>
                        <div className="text-white font-bold flex items-center justify-center space-x-1 mt-2">
                          <span>रु</span>
                          <span>{bike.price.toLocaleString()}</span>
                        </div>
                      </Link>
                    </motion.th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Price', value: (bike) => `रु${bike.price.toLocaleString()}` },
                { label: 'Category', value: (bike) => bike.category },
              ].map((row, rowIndex) => (
                <motion.tr
                  key={row.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + rowIndex * 0.1 }}
                  className="border-b border-gray-200 hover:bg-primary-50 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-gray-800">{row.label}</td>
                  {bikes.map((bike) => (
                    <td key={bike._id} className="px-6 py-4 text-gray-700 font-medium">
                      {row.value(bike)}
                    </td>
                  ))}
                </motion.tr>
              ))}
              {specs.map((spec, specIndex) => {
                // Check if any bike has this specification
                const hasSpec = bikes.some(bike => bike.specifications?.[spec]);

                if (!hasSpec) return null;

                return (
                  <motion.tr
                    key={spec}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + specIndex * 0.1 }}
                    className="border-b border-gray-200 hover:bg-primary-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-gray-800 capitalize">{spec}</td>
                    {bikes.map((bike) => (
                      <td key={bike._id} className="px-6 py-4">
                        <ul className="text-sm space-y-2">
                          {Object.entries(bike.specifications?.[spec] || {}).map(([key, value]) => (
                            <li key={key} className="flex justify-between">
                              <span className="capitalize font-semibold text-gray-700">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="text-gray-600 font-medium">{String(value)}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
};

export default BikeComparison;

