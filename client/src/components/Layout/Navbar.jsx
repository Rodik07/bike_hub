import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import SearchAutocomplete from '../SearchAutocomplete';
import LoginModal from '../LoginModal';
import RegisterModal from '../RegisterModal';
import { 
  FaMotorcycle, 
  FaHome, 
  FaBicycle, 
  FaBalanceScale, 
  FaMapMarkerAlt,
  FaCog,
  FaStore,
  FaUserCircle,
  FaSignInAlt,
  FaUserPlus,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaSearch
} from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-lg sticky top-0 z-50 border-b-2 border-primary-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="flex items-center space-x-2 text-2xl font-bold flex-shrink-0">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <FaMotorcycle className="text-primary-600" />
              </motion.div>
              <span className="hidden sm:inline tracking-tight bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                BikeHub
              </span>
            </Link>
          </motion.div>
          
          {/* Search Bar - Desktop */}
          <div className="hidden lg:block flex-1 max-w-2xl">
            <SearchAutocomplete />
          </div>
          
          {/* Desktop Navigation - Animated */}
          <div className="hidden md:flex space-x-6 flex-shrink-0">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
              <Link to="/bikes" className="text-gray-700 hover:text-primary-600 transition-colors font-semibold text-sm relative group">
                Bikes
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
              <Link to="/compare" className="text-gray-700 hover:text-primary-600 transition-colors font-semibold text-sm relative group">
                Compare
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
              <Link to="/dealers" className="text-gray-700 hover:text-primary-600 transition-colors font-semibold text-sm relative group">
                Dealers
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300" />
              </Link>
            </motion.div>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        to="/admin"
                        className="text-gray-700 hover:text-primary-600 transition-colors font-semibold text-sm flex items-center space-x-1"
                      >
                        <FaCog className="text-xs" />
                        <span>Admin</span>
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        to="/dashboard"
                        className="text-gray-700 hover:text-primary-600 transition-colors font-semibold text-sm flex items-center space-x-1"
                      >
                        <FaUserCircle className="text-xs" />
                        <span>User View</span>
                      </Link>
                    </motion.div>
                  </>
                )}
                {user.role === 'dealer' && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/dealer"
                      className="text-gray-700 hover:text-primary-600 transition-colors font-semibold text-sm"
                    >
                      Dashboard
                    </Link>
                  </motion.div>
                )}
                {user.role === 'user' && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/dashboard"
                      className="text-gray-700 hover:text-primary-600 transition-colors font-semibold text-sm"
                    >
                      Dashboard
                    </Link>
                  </motion.div>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-primary-600 transition-colors font-semibold text-sm"
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-gray-700 hover:text-primary-600 transition-colors font-semibold text-sm"
                  >
                    Login
                  </button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-xl hover:from-primary-700 hover:to-accent-600 transition-all font-bold text-sm shadow-lg"
                  >
                    Register
                  </button>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-black hover:opacity-70 transition-opacity"
          >
            {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

          {/* Mobile Navigation - Tesla Style */}
          {mobileMenuOpen && (
            <div className="md:hidden py-6 border-t border-gray-200/50 bg-white/95 backdrop-blur-md">
              {/* Mobile Search - Link to bikes page */}
              <div className="mb-6 px-2">
                <Link 
                  to="/bikes" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors font-medium py-2 px-4 bg-gray-50 rounded-lg border-2 border-gray-200"
                >
                  <FaSearch className="text-gray-400" />
                  <span>Search Bikes</span>
                </Link>
              </div>

              <div className="flex flex-col space-y-4 px-2">
                <Link to="/bikes" onClick={() => setMobileMenuOpen(false)} className="text-black hover:opacity-70 transition-opacity font-light py-2">
                  Bikes
                </Link>
                <Link to="/compare" onClick={() => setMobileMenuOpen(false)} className="text-black hover:opacity-70 transition-opacity font-light py-2">
                  Compare
                </Link>
                <Link to="/dealers" onClick={() => setMobileMenuOpen(false)} className="text-black hover:opacity-70 transition-opacity font-light py-2">
                  Dealers
                </Link>
                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <>
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-black hover:opacity-70 transition-opacity font-light py-2 flex items-center space-x-2">
                          <FaCog className="text-xs" />
                          <span>Admin Dashboard</span>
                        </Link>
                        <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-black hover:opacity-70 transition-opacity font-light py-2 flex items-center space-x-2">
                          <FaUserCircle className="text-xs" />
                          <span>User View</span>
                        </Link>
                      </>
                    )}
                    {user.role === 'dealer' && (
                      <Link to="/dealer" onClick={() => setMobileMenuOpen(false)} className="text-black hover:opacity-70 transition-opacity font-light py-2">
                        Dashboard
                      </Link>
                    )}
                    {user.role === 'user' && (
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-black hover:opacity-70 transition-opacity font-light py-2">
                        Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-black hover:opacity-70 transition-opacity font-light py-2 text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setShowLoginModal(true); setMobileMenuOpen(false); }} className="text-black hover:opacity-70 transition-opacity font-light py-2 text-left">
                      Login
                    </button>
                    <button onClick={() => { setShowRegisterModal(true); setMobileMenuOpen(false); }} className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-light text-center mt-2">
                      Register
                    </button>
                  </>
                )}
            </div>
          </div>
        )}

        {/* Modals */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      </div>
    </nav>
  );
};

export default Navbar;

