import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaCheckCircle } from 'react-icons/fa';

const CaptchaGate = ({ children, onVerified }) => {
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async (token) => {
        setLoading(true);
        setError('');

        try {
            // Verify token with backend
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const response = await fetch(`${apiUrl}/api/auth/verify-captcha`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setVerified(true);
                // Store verification in session storage (valid for browser session)
                sessionStorage.setItem('captcha_verified', 'true');
                setTimeout(() => {
                    onVerified();
                }, 1000);
            } else {
                setError(data.message || 'Verification failed. Please try again.');
                setLoading(false);
            }
        } catch (err) {
            console.error('CAPTCHA verification error:', err);
            setError('Network error. Please check your connection and try again.');
            setLoading(false);
        }
    };

    const handleError = () => {
        setError('CAPTCHA widget failed to load. Please refresh the page.');
        setLoading(false);
    };

    const handleExpire = () => {
        setVerified(false);
        setError('Verification expired. Please verify again.');
    };

    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

    if (!siteKey) {
        // If no site key configured, skip CAPTCHA (development mode)
        console.warn('⚠️ CAPTCHA site key not configured. Skipping verification.');
        return children;
    }

    return (
        <AnimatePresence mode="wait">
            {!verified ? (
                <motion.div
                    key="captcha-gate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-600 via-accent-500 to-primary-700"
                >
                    {/* Animated Background Particles */}
                    <div className="absolute inset-0 opacity-20">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-white rounded-full"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    y: [0, -40, 0],
                                    x: [0, Math.random() * 30 - 15, 0],
                                    opacity: [0.2, 0.8, 0.2],
                                }}
                                transition={{
                                    duration: 4 + Math.random() * 3,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                }}
                            />
                        ))}
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 max-w-md w-full mx-4"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
                            {/* Header */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-center mb-8"
                            >
                                <motion.div
                                    animate={{ rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="inline-block mb-4"
                                >
                                    <div className="bg-gradient-to-r from-primary-600 to-accent-500 p-5 rounded-full">
                                        <FaShieldAlt className="text-5xl text-white" />
                                    </div>
                                </motion.div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent mb-3">
                                    Security Check
                                </h1>
                                <p className="text-gray-600 text-lg">
                                    Please verify you're human to continue
                                </p>
                            </motion.div>

                            {/* CAPTCHA Widget */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex justify-center mb-6"
                            >
                                <Turnstile
                                    siteKey={siteKey}
                                    onSuccess={handleVerify}
                                    onError={handleError}
                                    onExpire={handleExpire}
                                    options={{
                                        theme: 'light',
                                        size: 'normal',
                                    }}
                                />
                            </motion.div>

                            {/* Loading State */}
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center"
                                >
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent mb-2"></div>
                                    <p className="text-sm text-gray-600">Verifying...</p>
                                </motion.div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
                                >
                                    <p className="text-sm text-red-700">{error}</p>
                                </motion.div>
                            )}

                            {/* Footer */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-center mt-6"
                            >
                                <p className="text-xs text-gray-500">
                                    Protected by Cloudflare Turnstile
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            ) : (
                <motion.div
                    key="app-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CaptchaGate;
