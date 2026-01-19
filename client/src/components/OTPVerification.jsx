import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaEnvelope, FaRedo } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import PropTypes from 'prop-types';

const OTPVerification = ({ email, onVerify, onResend, onCancel }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(180); // 3 minutes
    const [canResend, setCanResend] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef([]);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    // Focus first input on mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all fields are filled
        if (index === 5 && value) {
            const otpString = newOtp.join('');
            if (otpString.length === 6) {
                handleVerify(otpString);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        // Handle arrow keys
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);

        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split('');
        while (newOtp.length < 6) {
            newOtp.push('');
        }

        setOtp(newOtp.slice(0, 6));
        setError('');

        // Focus last filled input or first empty input
        const lastFilledIndex = Math.min(pastedData.length - 1, 5);
        inputRefs.current[lastFilledIndex]?.focus();

        // Auto-submit if complete
        if (pastedData.length === 6) {
            handleVerify(pastedData);
        }
    };

    const handleVerify = async (otpString = otp.join('')) => {
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onVerify(otpString);
        } catch (err) {
            setError(err.message || 'Invalid OTP. Please try again.');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError('');

        try {
            await onResend();
            setCountdown(180); // Reset countdown
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(err.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onCancel}
        >
            <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="inline-block bg-gradient-to-r from-primary-600 to-accent-500 p-4 rounded-full mb-4"
                    >
                        <FaLock className="text-3xl text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent mb-2">
                        Verify Your Identity
                    </h2>
                    <p className="text-gray-600 flex items-center justify-center gap-2">
                        <FaEnvelope className="text-primary-600" />
                        Code sent to {email}
                    </p>
                </div>

                {/* OTP Input */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                        Enter 6-Digit Verification Code
                    </label>
                    <div className="flex gap-2 justify-center mb-4">
                        {otp.map((digit, index) => (
                            <motion.input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                whileFocus={{ scale: 1.1, borderColor: '#dc2626' }}
                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                disabled={loading}
                            />
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-600 text-sm text-center mb-2"
                        >
                            {error}
                        </motion.p>
                    )}

                    {/* Timer */}
                    <div className="text-center">
                        {countdown > 0 ? (
                            <p className="text-sm text-gray-600">
                                Code expires in{' '}
                                <span className="font-bold text-accent-600">{formatTime(countdown)}</span>
                            </p>
                        ) : (
                            <p className="text-sm text-red-600 font-semibold">Code expired</p>
                        )}
                    </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <motion.button
                        type="button"
                        onClick={() => handleVerify()}
                        disabled={loading || otp.join('').length !== 6}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size={20} inline={true} />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <span>Verify Code</span>
                        )}
                    </motion.button>

                    <motion.button
                        type="button"
                        onClick={handleResend}
                        disabled={!canResend || resendLoading || countdown > 0}
                        whileHover={canResend ? { scale: 1.02 } : {}}
                        whileTap={canResend ? { scale: 0.98 } : {}}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-4 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {resendLoading ? (
                            <>
                                <LoadingSpinner size={20} inline={true} />
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <FaRedo />
                                <span>Resend Code</span>
                            </>
                        )}
                    </motion.button>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        Cancel and try different email
                    </button>
                </div>

                {/* Help Text */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-600 text-center">
                        Didn't receive the code? Check your spam folder or click resend when available.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

OTPVerification.propTypes = {
    email: PropTypes.string.isRequired,
    onVerify: PropTypes.func.isRequired,
    onResend: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default OTPVerification;
