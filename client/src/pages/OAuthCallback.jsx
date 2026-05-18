import { useEffect, useContext, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import OTPVerification from '../components/OTPVerification';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toastUtils';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUserFromToken, verifyOTP, resendOTP } = useContext(AuthContext);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [userName, setUserName] = useState('');

  const token = searchParams.get('token');
  const error = searchParams.get('error');
  const otpRequired = searchParams.get('otpRequired');
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const provider = searchParams.get('provider');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (error === 'oauth_not_configured') {
        toast.dismiss();
        showErrorToast('Google OAuth is not configured. Please use email/password login.');
        navigate('/login');
        return;
      }

      if (error) {
        toast.dismiss();
        showErrorToast('OAuth authentication failed. Please try again.');
        navigate('/login');
        return;
      }

      // Check if OTP is required (2FA for OAuth)
      if (otpRequired === 'true' && email) {
        setOtpEmail(email);
        setUserName(name || '');
        setShowOTPModal(true);
        toast.dismiss();
        showSuccessToast(`Verification code sent to ${email}`);
        return;
      }

      // Legacy flow - direct token (fallback, shouldn't happen with 2FA enabled)
      if (token) {
        try {
          // Store token in localStorage
          localStorage.setItem('token', token);

          // Fetch user data
          // Use relative URL - Vite proxy handles it
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUserFromToken(userData, token);
            toast.dismiss();
            showSuccessToast('Login successful!');
            navigate('/');
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          toast.error('Failed to complete authentication. Please try again.');
          navigate('/login');
        }
      } else if (!otpRequired) {
        toast.dismiss();
        showErrorToast('No authentication token received.');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [token, error, otpRequired, email, name, navigate, setUserFromToken]);

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

      if (userData.mustChangePassword) {
        showSuccessToast('Login successful! Please change your temporary password.');
      } else {
        showSuccessToast(`Login successful via ${provider || 'OAuth'}!`);
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
    toast.dismiss();
    showInfoToast('OAuth login cancelled.', { icon: 'ℹ️' });
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="text-center">
        {error ? (
          <>
            <FaTimesCircle className="text-6xl text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600">Redirecting to login...</p>
          </>
        ) : showOTPModal ? (
          <OTPVerification
            email={otpEmail}
            onVerify={handleVerifyOTP}
            onResend={handleResendOTP}
            onCancel={handleCancelOTP}
          />
        ) : token ? (
          <>
            <LoadingSpinner size={200} text="Completing Sign In..." />
            <h2 className="text-2xl font-bold text-gray-900 mb-2 mt-4">Completing Sign In...</h2>
            <p className="text-gray-600">Please wait while we set up your account</p>
          </>
        ) : (
          <>
            <LoadingSpinner size={200} text="Processing OAuth..." />
            <h2 className="text-2xl font-bold text-gray-900 mb-2 mt-4">Processing...</h2>
            <p className="text-gray-600">Please wait</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
