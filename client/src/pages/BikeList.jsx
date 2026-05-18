import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, useInView } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaBicycle,
  FaTag,
  FaMotorcycle
} from 'react-icons/fa';
import { staggerContainer, fadeInUp, scaleIn } from '../utils/animations';

const BikeList = () => {
  const [searchParams] = useSearchParams();
  const [bikes, setBikes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    brand: '',
    category: '',
    search: searchParams.get('search') || '',
    minPrice: '',
    maxPrice: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
    fetchCategories();
    // Set initial search from URL
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      setFilters(prev => ({ ...prev, search: urlSearch }));
    }
  }, []);

  useEffect(() => {
    fetchBikes();
  }, [filters]);

  const fetchBikes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

      const { data } = await axios.get(`/api/bikes?${params.toString()}`);
      setBikes(data);
    } catch (error) {
      toast.error('Failed to load bikes');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data } = await axios.get('/api/bikes/brands');
      setBrands(data);
    } catch (error) {
      console.error('Failed to load brands');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('/api/bikes/categories');
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      category: '',
      search: '',
      minPrice: '',
      maxPrice: ''
    });
  };

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-2 flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <FaBicycle className="text-primary-600 text-5xl" />
            </motion.div>
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              Browse Bikes
            </span>
          </h1>
          <p className="text-gray-600 text-lg">Discover your perfect ride from our collection</p>
        </motion.div>

        {/* Animated Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-xl mb-8 border-2 border-primary-500/20"
        >
          <div className="flex items-center space-x-2 mb-4">
            <FaFilter className="text-primary-600 text-xl" />
            <h2 className="text-xl font-bold text-gray-800">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Search bikes..."
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <select
              name="brand"
              value={filters.brand}
              onChange={handleFilterChange}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">रु</span>
              <input
                type="number"
                name="minPrice"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">रु</span>
              <input
                type="number"
                name="maxPrice"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-full pl-8 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters}
            className="mt-4 flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-bold transition-colors"
          >
            <FaTimes />
            <span>Clear Filters</span>
          </motion.button>
        </motion.div>

        {/* Animated Bike Grid */}
        <div ref={containerRef}>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size={250} text="Loading bikes..." />
            </div>
          ) : bikes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border-2 border-primary-500/20"
            >
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FaBicycle className="text-6xl text-gray-300 mx-auto mb-4" />
              </motion.div>
              <p className="text-xl font-bold text-gray-600 mb-2">No bikes found</p>
              <p className="text-gray-500">Try adjusting your filters</p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate={isInView ? "animate" : "initial"}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {bikes.map((bike, index) => (
                <motion.div
                  key={bike._id}
                  variants={scaleIn}
                  custom={index}
                  whileHover={{ y: -15, scale: 1.02 }}
                >
                  <Link
                    to={`/bikes/${bike._id}`}
                    className="group block"
                  >
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all border-2 border-transparent hover:border-primary-500">
                      <div className="relative overflow-hidden h-64">
                        {bike.images && bike.images.length > 0 ? (
                          <motion.img
                            src={`${bike.images[0].url}`}
                            alt={bike.name}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.15 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <FaMotorcycle className="text-6xl text-gray-300" />
                          </div>
                        )}
                        {bike.featured && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute top-4 right-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-2 rounded-full flex items-center space-x-1 text-sm font-bold shadow-lg"
                          >
                            <FaTag />
                            <span>Featured</span>
                          </motion.div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">
                          {bike.name}
                        </h3>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">
                            {bike.brand}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600 text-sm font-medium">{bike.category}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <p className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                            रु{bike.price.toLocaleString()}
                          </p>
                          <span className="text-sm text-gray-500 font-medium">Ex-showroom</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BikeList;

