import { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, useInView } from 'framer-motion';
import { FaSignInAlt, FaEnvelope, FaLock, FaMotorcycle, FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import OTPVerification from '../components/OTPVerification';
import { fadeInUp, scaleIn } from '../utils/animations';
import { showSuccessToast, showErrorToast } from '../utils/toastUtils';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const { login, verifyOTP, resendOTP } = useContext(AuthContext);
  const navigate = useNavigate();

  // Check for error in URL parameters
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'oauth_not_configured') {
      toast.dismiss();
      showErrorToast('Google OAuth is not configured. Please use email/password login.');
      // Clean up URL
      navigate('/login', { replace: true });
    } else if (error === 'oauth_failed') {
      toast.dismiss();
      showErrorToast('Google authentication failed. Please try again.');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success && result.otpSent) {
      // Show OTP modal
      setOtpEmail(result.email);
      setShowOTPModal(true);
      toast.dismiss();
      showSuccessToast('Verification code sent to your email!');
    } else if (!result.success) {
      toast.dismiss();
      if (result.temporaryPasswordExpired) {
        showErrorToast('Your temporary password has expired. Please use "Forgot Password" to reset it.');
      } else {
        showErrorToast(result.message);
      }
    }

    setLoading(false);
  };

  const handleVerifyOTP = async (otp) => {
    const result = await verifyOTP(otpEmail, otp);

    if (result.success) {
      setShowOTPModal(false);
      toast.dismiss();

      const userData = result.user;

      // Determine redirect path based on role
      let redirectPath = '/';
      if (userData.role === 'dealer') {
        redirectPath = '/dealer';
      } else if (userData.role === 'admin') {
        redirectPath = '/admin';
      }

      // Check if password change is required
      if (userData.mustChangePassword) {
        showSuccessToast('Login successful! Please change your temporary password.');
      } else {
        showSuccessToast('Login successful!');
      }

      navigate(redirectPath);
    } else {
      throw new Error(result.message);
    }
  };

  const handleResendOTP = async () => {
    const result = await resendOTP(otpEmail);

    if (result.success) {
      toast.dismiss();
      showSuccessToast('New verification code sent!');
    } else {
      throw new Error(result.message);
    }
  };

  const handleCancelOTP = () => {
    setShowOTPModal(false);
    setOtpEmail('');
    toast('Login cancelled. Try again with different credentials.', { icon: 'ℹ️' });
  };

  const handleGoogleLogin = () => {
        // Use relative URL - Vite proxy handles it
    window.location.href = '/api/auth/google';
  };

  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-accent-500 to-primary-700 py-12 px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
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
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8 bg-gradient-to-br from-white to-gray-50 p-10 rounded-2xl shadow-2xl border-2 border-white/50 relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex justify-center mb-4"
          >
            <div className="bg-gradient-to-r from-primary-600 to-accent-500 p-4 rounded-full shadow-lg">
              <FaMotorcycle className="text-4xl text-white" />
            </div>
          </motion.div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600 font-medium">Sign in to your BikeHub account</p>
        </motion.div>
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                <FaEnvelope className="inline mr-2 text-primary-600" />
                Email address
              </label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="you@example.com"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5 }}
            >
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                <FaLock className="inline mr-2 text-primary-600" />
                Password
              </label>
              <div className="relative">
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash className="text-xl" /> : <FaEye className="text-xl" />}
                </button>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-sm font-semibold text-primary-600 hover:text-accent-600 transition-colors">
              Forgot Password?
            </Link>
          </div>

          <div className="space-y-3">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center space-x-2 py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <LoadingSpinner size={20} inline={true} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <FaSignInAlt />
                  <span>Sign in</span>
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center space-x-2 py-4 px-4 border-2 border-gray-300 rounded-xl shadow-lg text-base font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
            >
              <FaGoogle className="text-red-500" />
              <span>Sign in with Google</span>
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-primary-600 hover:text-accent-600 transition-colors">
                Sign up here
              </Link>
            </p>
          </motion.div>
        </motion.form>
      </motion.div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <OTPVerification
          email={otpEmail}
          onVerify={handleVerifyOTP}
          onResend={handleResendOTP}
          onCancel={handleCancelOTP}
        />
      )}
    </div>
  );
};

export default Login;

