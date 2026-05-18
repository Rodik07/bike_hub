import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  FaSearch,
  FaChartBar,
  FaMapMarkerAlt,
  FaStar,
  FaMotorcycle,
  FaBicycle,
  FaFire,
  FaChevronRight,
  FaArrowDown,
} from "react-icons/fa";
import {
  staggerContainer,
  fadeInUp,
  scaleIn,
  hoverScale,
} from "../utils/animations";

// Separate component for Featured Bike Section to fix hooks issue
const FeaturedBikeSection = ({ bike, index }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <motion.section
      ref={sectionRef}
      className={`min-h-screen flex items-center justify-center relative overflow-hidden ${index % 2 === 0
        ? "bg-gradient-to-br from-white via-gray-50 to-white"
        : "bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white"
        }`}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`${index % 2 === 0 ? "lg:order-1" : "lg:order-2"}`}
        >
          {bike.images && bike.images.length > 0 && (
            <motion.div
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="relative"
            >
              <motion.img
                src={`${bike.images[0].url}`}
                alt={bike.name}
                className="w-full h-auto object-contain drop-shadow-2xl"
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 blur-3xl -z-10" />
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: index % 2 === 0 ? 100 : -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className={`${index % 2 === 0 ? "lg:order-2" : "lg:order-1"
            } space-y-6`}
        >
          <motion.h2
            whileHover={{ scale: 1.02 }}
            className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent"
          >
            {bike.name}
          </motion.h2>
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400">
            {bike.brand} • {bike.category}
          </p>
          <div className="flex items-baseline gap-4">
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-accent-400"
            >
              रु{bike.price.toLocaleString()}
            </motion.span>
            <span className="text-gray-500 dark:text-gray-400">onwards</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to={`/bikes/${bike._id}`}
                className="block px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold hover:from-primary-700 hover:to-primary-800 transition-all text-center shadow-lg"
              >
                View Details
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to={`/bikes/${bike._id}`}
                className="block px-8 py-3 bg-transparent border-2 border-primary-600 text-primary-600 dark:text-accent-400 rounded-xl font-bold hover:bg-primary-600 hover:text-white transition-all text-center"
              >
                Book Test Ride
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [featuredBikes, setFeaturedBikes] = useState([]);
  const [latestBikes, setLatestBikes] = useState([]);
  const [bikesByCategory, setBikesByCategory] = useState({});
  const [brands, setBrands] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBudget, setSelectedBudget] = useState("all");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [featuredRes, latestRes, brandsRes, promotionsRes] =
        await Promise.all([
          axios.get("/api/bikes?featured=true"),
          axios.get("/api/bikes"),
          axios.get("/api/bikes/brands"),
          axios.get("/api/admin/promotions").catch(() => ({ data: [] })),
        ]);

      // Randomize featured bikes if we have more than 3–4, so the homepage
      // doesn't always show the same ones
      const allFeatured = Array.isArray(featuredRes.data)
        ? featuredRes.data
        : [];

      let featuredToShow = allFeatured;

      if (allFeatured.length > 4) {
        // Shuffle and take up to 8 bikes
        const shuffled = [...allFeatured].sort(() => Math.random() - 0.5);
        featuredToShow = shuffled.slice(0, 8);
      }

      setFeaturedBikes(featuredToShow);
      setLatestBikes(latestRes.data.slice(0, 10));
      setBrands(brandsRes.data);

      // Group bikes by category
      const byCategory = {};
      latestRes.data.forEach((bike) => {
        if (!byCategory[bike.category]) {
          byCategory[bike.category] = [];
        }
        byCategory[bike.category].push(bike);
      });
      setBikesByCategory(byCategory);

      setPromotions(promotionsRes.data.filter((p) => p.isActive).slice(0, 3));
    } catch (error) {
      // Avoid stacking multiple identical error snackbars
      toast.dismiss();
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/bikes?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/bikes");
    }
  };

  const categories = [
    "all",
    "Sports",
    "Cruiser",
    "Touring",
    "Adventure",
    "Naked",
    "Scooter",
    "Electric",
  ];
  const budgetRanges = [
    { label: "All", value: "all" },
    { label: "Under रु1 Lakh", value: "0-100000" },
    { label: "रु1-2 Lakh", value: "100000-200000" },
    { label: "रु2-5 Lakh", value: "200000-500000" },
    { label: "Above रु5 Lakh", value: "500000-999999999" },
  ];

  const filteredBikes =
    selectedCategory === "all"
      ? latestBikes
      : latestBikes.filter((bike) => bike.category === selectedCategory);

  const { scrollY } = useScroll();
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });

  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      {/* Animated Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ opacity }}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-accent-500 to-primary-700">
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(249, 115, 22, 0.3) 0%, transparent 50%)",
              backgroundSize: "200% 200%",
            }}
          />

          {/* Floating Particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          className="relative z-10 w-full max-w-7xl mx-auto px-6 text-center"
          style={{ y }}
        >
          {/* Lottie Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={heroInView ? { scale: 1, rotate: 0 } : {}}
            transition={{ duration: 1, type: "spring" }}
            className="mb-8 flex justify-center"
          >
            <div className="w-32 h-32 md:w-48 md:h-48">
              <FaMotorcycle className="w-full h-full text-white animate-float" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-9xl font-bold mb-6 tracking-tight text-white drop-shadow-2xl"
          >
            Find Your Perfect
            <span className="block bg-gradient-to-r from-white via-accent-200 to-white bg-clip-text text-transparent animate-glow">
              Ride
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl lg:text-3xl font-light text-white/90 mb-12 max-w-3xl mx-auto"
          >
            Explore premium motorcycles in Nepal with interactive 360° views
          </motion.p>

          {/* Animated Search */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row gap-4"
            >
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bikes, brands, models..."
                className="flex-1 px-6 py-4 bg-white/20 backdrop-blur-lg border-2 border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:border-white/60 focus:bg-white/30 text-lg transition-all shadow-2xl"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-8 py-4 bg-white text-primary-600 rounded-xl font-bold hover:bg-accent-100 transition-all text-lg shadow-2xl flex items-center justify-center gap-2"
              >
                <FaSearch />
                <span>Search</span>
              </motion.button>
            </form>
          </motion.div>
        </motion.div>

        {/* Animated Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex flex-col items-center gap-2 text-white/70">
            <span className="text-sm font-light">Scroll</span>
            <FaArrowDown className="text-2xl" />
          </div>
        </motion.div>
      </motion.section>

      {/* Featured Bikes Showcase - Full Width Sections with Animations */}
      {featuredBikes.length > 0 && (
        <>
          {featuredBikes.slice(0, 3).map((bike, index) => (
            <FeaturedBikeSection key={bike._id} bike={bike} index={index} />
          ))}
        </>
      )}

      {/* Bikes in Spotlight - Animated Grid */}
      {featuredBikes.length > 0 && (
        <motion.section
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="py-20 bg-gradient-to-b from-white to-gray-50"
        >
          <div className="max-w-7xl mx-auto px-6">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Bikes in Spotlight
              </h2>
              <p className="text-xl text-gray-600 font-light">
                Handpicked selection of premium motorcycles
              </p>
            </motion.div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size={200} />
              </div>
            ) : (
              <div className="overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                <div className="flex gap-6 min-w-max">
                  {featuredBikes.slice(0, 8).map((bike, index) => (
                    <motion.div
                      key={bike._id}
                      variants={scaleIn}
                      custom={index}
                      whileHover={{ y: -10, scale: 1.02 }}
                      className="flex-shrink-0 w-72 md:w-80"
                    >
                      <Link to={`/bikes/${bike._id}`} className="group block">
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden mb-4 aspect-square flex items-center justify-center p-8 relative shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-primary-500">
                          {bike.images && bike.images.length > 0 ? (
                            <motion.img
                              src={`${bike.images[0].url}`}
                              alt={bike.name}
                              className="w-full h-full object-contain"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            />
                          ) : (
                            <FaMotorcycle className="text-6xl text-gray-300" />
                          )}
                          {bike.featured && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5 + index * 0.1 }}
                              className="absolute top-4 right-4 bg-gradient-to-r from-primary-600 to-accent-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"
                            >
                              <FaFire className="animate-pulse" />
                              <span>Hot</span>
                            </motion.div>
                          )}
                          {/* Hover Glow */}
                          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 to-accent-500/0 group-hover:from-primary-500/20 group-hover:to-accent-500/20 transition-all duration-500 rounded-2xl" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">
                          {bike.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {bike.brand} • {bike.category}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-primary-600">
                            रु{bike.price.toLocaleString()}
                          </p>
                          <span className="text-sm text-gray-500">onwards</span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <motion.div variants={fadeInUp} className="text-center mt-12">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/bikes?featured=true"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-xl font-bold hover:from-primary-700 hover:to-accent-600 transition-all shadow-lg"
                >
                  View All Featured Bikes
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Latest Bikes - Dark Section with Animations */}
      {latestBikes.length > 0 && (
        <motion.section
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="py-20 bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 text-white relative overflow-hidden"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-10">
            <motion.div
              className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500 rounded-full blur-3xl"
              animate={{
                x: [0, -100, 0],
                y: [0, -50, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-r from-white via-accent-200 to-white bg-clip-text text-transparent">
                Latest Bikes & Scooters
              </h2>
              <p className="text-xl text-gray-300 font-light">
                Recently launched models in Nepal
              </p>
            </motion.div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size={200} />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {latestBikes.slice(0, 8).map((bike, index) => (
                  <motion.div
                    key={bike._id}
                    variants={scaleIn}
                    custom={index}
                    whileHover={{ y: -10, scale: 1.05 }}
                  >
                    <Link to={`/bikes/${bike._id}`} className="group block">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden mb-4 aspect-square flex items-center justify-center p-6 relative shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-primary-500">
                        {bike.images && bike.images.length > 0 ? (
                          <motion.img
                            src={`${bike.images[0].url}`}
                            alt={bike.name}
                            className="w-full h-full object-contain"
                            whileHover={{ scale: 1.15, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          />
                        ) : (
                          <FaBicycle className="text-6xl text-gray-600" />
                        )}
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            delay: 0.3 + index * 0.1,
                            type: "spring",
                          }}
                          className="absolute top-3 left-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                        >
                          New
                        </motion.div>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 to-accent-500/0 group-hover:from-primary-500/30 group-hover:to-accent-500/30 transition-all duration-500 rounded-2xl" />
                      </div>
                      <h3 className="text-lg font-bold mb-1 text-white group-hover:text-accent-400 transition-colors">
                        {bike.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">{bike.brand}</p>
                      <p className="text-xl font-bold text-primary-400">
                        रु{bike.price.toLocaleString()}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            <motion.div variants={fadeInUp} className="text-center mt-12">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/bikes"
                  className="inline-block px-8 py-4 bg-white text-dark-900 rounded-xl font-bold hover:bg-accent-100 transition-all shadow-lg"
                >
                  View All Latest Bikes
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Upcoming Bikes - Animated Cards */}
      {latestBikes.filter(bike => bike.isAvailable === false).length > 0 && (
        <motion.section
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="py-20 bg-gradient-to-b from-gray-50 to-white"
        >
          <div className="max-w-7xl mx-auto px-6">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Upcoming Bikes
              </h2>
              <p className="text-xl text-gray-600 font-light">
                Coming soon to Nepal
              </p>
            </motion.div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner size={200} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {latestBikes.filter(bike => bike.isAvailable === false).slice(0, 6).map((bike, index) => (
                  <motion.div
                    key={bike._id}
                    variants={fadeInUp}
                    custom={index}
                    whileHover={{ y: -15, scale: 1.02 }}
                    className="group"
                  >
                    <Link to={`/bikes/${bike._id}`} className="block">
                      <div className="bg-gradient-to-br from-white to-gray-100 rounded-2xl overflow-hidden mb-4 aspect-video flex items-center justify-center p-8 relative shadow-lg hover:shadow-2xl transition-all border-2 border-transparent hover:border-accent-500">
                        {bike.images && bike.images.length > 0 ? (
                          <motion.img
                            src={`${bike.images[0].url}`}
                            alt={bike.name}
                            className="w-full h-full object-contain"
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          />
                        ) : (
                          <FaMotorcycle className="text-6xl text-gray-300" />
                        )}
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute top-4 left-4 bg-gradient-to-r from-accent-500 to-primary-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg"
                        >
                          Coming Soon
                        </motion.div>
                        <div className="absolute inset-0 bg-gradient-to-r from-accent-500/0 to-primary-500/0 group-hover:from-accent-500/20 group-hover:to-primary-500/20 transition-all duration-500 rounded-2xl" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-accent-600 transition-colors">
                        {bike.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {bike.brand} • {bike.category}
                      </p>
                      <p className="text-2xl font-bold text-primary-600">
                        Expected: रु{bike.price.toLocaleString()}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            <motion.div variants={fadeInUp} className="text-center mt-12">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/bikes"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-xl font-bold hover:from-primary-700 hover:to-accent-600 transition-all shadow-lg"
                >
                  View All Upcoming Bikes
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Browse All Bikes - Interactive Grid */}
      <motion.section
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.1 }}
        variants={staggerContainer}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              Browse All Bikes
            </h2>
            <p className="text-xl text-gray-600 font-light">
              Explore our complete collection
            </p>
          </motion.div>

          {/* Animated Category Filter */}
          <motion.div
            variants={fadeInUp}
            className="flex justify-center flex-wrap gap-3 mb-12"
          >
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 font-bold text-sm transition-all capitalize rounded-full ${selectedCategory === cat
                  ? "bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {cat === "all" ? "All" : cat}
              </motion.button>
            ))}
          </motion.div>

          {/* Animated Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <LoadingSpinner size={200} />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredBikes.slice(0, 12).map((bike, index) => (
                <motion.div
                  key={bike._id}
                  variants={scaleIn}
                  custom={index}
                  whileHover={{ y: -10, scale: 1.05 }}
                >
                  <Link to={`/bikes/${bike._id}`} className="group block">
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden mb-4 aspect-square flex items-center justify-center p-6 shadow-md hover:shadow-2xl transition-all border-2 border-transparent hover:border-primary-500">
                      {bike.images && bike.images.length > 0 ? (
                        <motion.img
                          src={`${bike.images[0].url}`}
                          alt={bike.name}
                          className="w-full h-full object-contain"
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        />
                      ) : (
                        <FaMotorcycle className="text-6xl text-gray-300" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 to-accent-500/0 group-hover:from-primary-500/20 group-hover:to-accent-500/20 transition-all duration-500 rounded-2xl" />
                    </div>
                    <h3 className="text-lg font-bold mb-1 text-gray-900 group-hover:text-primary-600 transition-colors">
                      {bike.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{bike.brand}</p>
                    <p className="text-xl font-bold text-primary-600">
                      रु{bike.price.toLocaleString()}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <motion.div variants={fadeInUp} className="text-center mt-12">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/bikes"
                className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-xl font-bold hover:from-primary-700 hover:to-accent-600 transition-all shadow-lg"
              >
                View All Bikes
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Popular Comparisons - Interactive Cards */}
      {latestBikes.length >= 2 && (
        <motion.section
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
          className="py-20 bg-gradient-to-b from-dark-900 to-dark-800 text-white"
        >
          <div className="max-w-7xl mx-auto px-6">
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-r from-white via-accent-200 to-white bg-clip-text text-transparent">
                Popular Comparisons
              </h2>
              <p className="text-xl text-gray-300 font-light">
                Compare bikes side by side
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestBikes.slice(0, 3).map((bike, idx) => {
                if (idx + 1 >= latestBikes.length) return null;
                const nextBike = latestBikes[idx + 1];
                return (
                  <motion.div
                    key={`${bike._id}-${nextBike._id}`}
                    variants={scaleIn}
                    custom={idx}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border-2 border-transparent hover:border-primary-500 transition-all shadow-xl hover:shadow-2xl group"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="flex-1 text-center"
                      >
                        {bike.images && bike.images.length > 0 && (
                          <div className="bg-gray-700 rounded-xl p-4 mb-3 aspect-square flex items-center justify-center">
                            <motion.img
                              src={`${bike.images[0].url}`}
                              alt={bike.name}
                              className="w-full h-full object-contain"
                              whileHover={{ rotate: 5 }}
                            />
                          </div>
                        )}
                        <h4 className="font-bold text-lg text-white mb-1">
                          {bike.name}
                        </h4>
                        <p className="text-primary-400 font-bold text-sm">
                          रु{bike.price.toLocaleString()}
                        </p>
                      </motion.div>
                      <div className="px-4">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full px-4 py-2 font-bold text-sm shadow-lg"
                        >
                          VS
                        </motion.div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="flex-1 text-center"
                      >
                        {nextBike.images && nextBike.images.length > 0 && (
                          <div className="bg-gray-700 rounded-xl p-4 mb-3 aspect-square flex items-center justify-center">
                            <motion.img
                              src={`${nextBike.images[0].url}`}
                              alt={nextBike.name}
                              className="w-full h-full object-contain"
                              whileHover={{ rotate: -5 }}
                            />
                          </div>
                        )}
                        <h4 className="font-bold text-lg text-white mb-1">
                          {nextBike.name}
                        </h4>
                        <p className="text-primary-400 font-bold text-sm">
                          रु{nextBike.price.toLocaleString()}
                        </p>
                      </motion.div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to={`/compare`}
                        onClick={() => {
                          const compareList = [
                            {
                              _id: bike._id,
                              name: bike.name,
                              brand: bike.brand,
                            },
                            {
                              _id: nextBike._id,
                              name: nextBike.name,
                              brand: nextBike.brand,
                            },
                          ];
                          localStorage.setItem(
                            "compareList",
                            JSON.stringify(compareList)
                          );
                        }}
                        className="block w-full bg-gradient-to-r from-primary-600 to-accent-500 text-white py-3 rounded-xl font-bold hover:from-primary-700 hover:to-accent-600 transition-all text-center shadow-lg"
                      >
                        Compare {bike.name.split(" ")[0]} vs{" "}
                        {nextBike.name.split(" ")[0]}
                      </Link>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div variants={fadeInUp} className="text-center mt-12">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/compare"
                  className="inline-block px-8 py-4 bg-white text-dark-900 rounded-xl font-bold hover:bg-accent-100 transition-all shadow-lg"
                >
                  Compare More Bikes
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default Home;
