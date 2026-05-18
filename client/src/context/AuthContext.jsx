import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    console.log('🔐 [AuthContext] Fetching user data...');
    try {
      const { data } = await axios.get('/api/auth/me');
      console.log('✅ [AuthContext] User fetched successfully:', {
        id: data._id,
        email: data.email,
        role: data.role,
        name: data.name
      });
      setUser(data);
    } catch (error) {
      console.error('❌ [AuthContext] Error fetching user:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      console.log('🏁 [AuthContext] Fetch user completed');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 [AuthContext] Initializing auth context...');
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🔑 [AuthContext] Token found, setting up authorization');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      console.log('⚠️ [AuthContext] No token found, user not authenticated');
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    console.log('🔐 [AuthContext] Attempting login for:', email);
    try {
      // Encode password in Base64 before sending
      const encodedPassword = btoa(password);
      const { data } = await axios.post('/api/auth/login', { email, password: encodedPassword });
      console.log('✅ [AuthContext] Login step 1 successful - OTP sent');

      // Login now returns OTP sent status instead of token
      return {
        success: true,
        otpSent: data.otpSent,
        email: data.email,
        expiresIn: data.expiresIn
      };
    } catch (error) {
      console.error('❌ [AuthContext] Login failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        temporaryPasswordExpired: error.response?.data?.temporaryPasswordExpired || false
      };
    }
  };

  const verifyOTP = async (email, otp) => {
    console.log('🔐 [AuthContext] Verifying OTP for:', email);
    try {
      const { data } = await axios.post('/api/auth/verify-otp', { email, otp });
      const { token, ...userProfile } = data;
      console.log('✅ [AuthContext] OTP verification successful:', {
        userId: userProfile._id,
        email: userProfile.email,
        role: userProfile.role
      });
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userProfile);
      return { success: true, user: userProfile };
    } catch (error) {
      console.error('❌ [AuthContext] OTP verification failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return {
        success: false,
        message: error.response?.data?.message || 'OTP verification failed'
      };
    }
  };

  const resendOTP = async (email) => {
    console.log('🔐 [AuthContext] Resending OTP for:', email);
    try {
      const { data } = await axios.post('/api/auth/resend-otp', { email });
      console.log('✅ [AuthContext] OTP resent successfully');
      return { success: true, message: data.message };
    } catch (error) {
      console.error('❌ [AuthContext] Resend OTP failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend OTP'
      };
    }
  };

  const register = async (userData) => {
    try {
      // Encode password in Base64 before sending
      const encodedUserData = {
        ...userData,
        password: btoa(userData.password)
      };
      const { data } = await axios.post('/api/auth/register', encodedUserData);
      const { token, ...userProfile } = data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userProfile);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const setUserFromToken = (userData, token) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, verifyOTP, resendOTP, register, logout, loading, setUserFromToken, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

