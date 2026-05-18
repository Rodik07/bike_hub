import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/PrivateRoute';


// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import BikeList from './pages/BikeList';
import BikeDetail from './pages/BikeDetail';
import BikeComparison from './pages/BikeComparison';
import TestRideBooking from './pages/TestRideBooking';
import MyBookings from './pages/MyBookings';
import DealerLocator from './pages/DealerLocator';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DealerDashboard from './pages/DealerDashboard';
import AdminBikeManagement from './pages/AdminBikeManagement';
import AdminDealerManagement from './pages/AdminDealerManagement';
import AdminPromotions from './pages/AdminPromotions';
import AdminSpareParts from './pages/AdminSpareParts';
import BikeSparePartsPage from './pages/BikeSparePartsPage';
import SparePartDetail from './pages/SparePartDetail';
import BikeReviews from './pages/BikeReviews';

// Layout
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Chatbot from './components/Chatbot';
import { FaCommentDots, FaTimes } from 'react-icons/fa';

function App() {
  console.log('🚀 [App] Application starting...');
  const [showChatbot, setShowChatbot] = useState(false);


  return (
    <AuthProvider>
      <SocketProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="/bikes" element={<BikeList />} />
              <Route path="/bikes/:id" element={<BikeDetail />} />
              <Route path="/bikes/:bikeId/spare-parts" element={<BikeSparePartsPage />} />
              <Route path="/spare-parts/:partId" element={<SparePartDetail />} />
              <Route path="/bikes/:id/reviews" element={<BikeReviews />} />
              <Route path="/compare" element={<BikeComparison />} />
              <Route path="/dealers" element={<DealerLocator />} />

              {/* Protected Routes */}
              <Route
                path="/book-test-ride/:bikeId"
                element={
                  <PrivateRoute>
                    <TestRideBooking />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <PrivateRoute>
                    <MyBookings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <UserDashboard />
                  </PrivateRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/bikes"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminBikeManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/dealers"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminDealerManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/promotions"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminPromotions />
                  </PrivateRoute>
                }
              />

              <Route
                path="/admin/spare-parts"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminSpareParts />
                  </PrivateRoute>
                }
              />

              {/* Dealer Routes */}
              <Route
                path="/dealer"
                element={
                  <PrivateRoute allowedRoles={['dealer', 'admin']}>
                    <DealerDashboard />
                  </PrivateRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-right" />

          {/* Global Chatbot */}
          <div className="fixed bottom-6 right-6 z-[9999]">
            <AnimatePresence>
              {showChatbot && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Chatbot />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowChatbot(!showChatbot)}
              className={`bg-gradient-to-r from-primary-600 to-accent-500 text-white p-5 rounded-full shadow-2xl hover:from-primary-700 hover:to-accent-600 transition-all flex items-center justify-center ${showChatbot ? 'rotate-180' : ''
                }`}
              style={{ transition: 'transform 0.3s ease' }}
            >
              <motion.div
                animate={{ rotate: showChatbot ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {showChatbot ? <FaTimes size={24} /> : <FaCommentDots size={24} />}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
