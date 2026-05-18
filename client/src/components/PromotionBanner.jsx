import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

// Fisher-Yates shuffle
const shuffleArray = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const AUTO_HIDE_MS = 60 * 60 * 1000; // 1 hour total lifespan
const AD_DISPLAY_DURATION = 7000; // Show each ad for 7 seconds

const PromotionBanner = () => {
    const [promotions, setPromotions] = useState([]);
    const [currentAd, setCurrentAd] = useState(null);
    const [visible, setVisible] = useState(false);
    const [expired, setExpired] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const adQueueRef = useRef([]);
    const indexRef = useRef(0);
    const mountTimeRef = useRef(Date.now());

    // Fetch promotions on mount
    useEffect(() => {
        const fetchPromotions = async () => {
            try {
                const { data } = await axios.get('/api/promotions');
                const active = data.filter(p => p.isActive);
                if (active.length > 0) {
                    const shuffled = shuffleArray(active);
                    setPromotions(shuffled);
                    adQueueRef.current = shuffled;
                }
            } catch {
                // Silently fail — ads are non-critical
            }
        };
        fetchPromotions();
    }, []);

    // Auto-expire after 1 hour
    useEffect(() => {
        const timer = setTimeout(() => setExpired(true), AUTO_HIDE_MS);
        return () => clearTimeout(timer);
    }, []);

    // Calculate gap between popups based on number of ads
    // More ads = more frequent popups
    // Formula: spread all ads evenly across 1 hour, with some randomness
    const getGapDuration = useCallback(() => {
        const count = promotions.length;
        if (count === 0) return 60000;
        // Each ad cycle: show for ~7s, then wait
        // Total cycles in 1 hour: count * repeats
        // Gap = (3600s - (count * 7s * repeats)) / (count * repeats)
        // Simplified: show each ad ~3-6 times per hour
        const repeatsPerHour = Math.max(2, Math.min(6, Math.ceil(20 / count)));
        const totalShows = count * repeatsPerHour;
        const totalDisplayTime = totalShows * (AD_DISPLAY_DURATION / 1000);
        const remainingTime = 3600 - totalDisplayTime;
        const baseGap = (remainingTime / totalShows) * 1000;
        // Add ±30% randomness
        const jitter = baseGap * 0.3;
        return baseGap + (Math.random() * jitter * 2 - jitter);
    }, [promotions.length]);

    // Show next ad from queue
    const showNextAd = useCallback(() => {
        if (promotions.length === 0 || expired || dismissed) return;

        // Check if 1 hour has passed
        if (Date.now() - mountTimeRef.current >= AUTO_HIDE_MS) {
            setExpired(true);
            return;
        }

        const ad = adQueueRef.current[indexRef.current % adQueueRef.current.length];
        indexRef.current += 1;

        // Re-shuffle when we've gone through all ads
        if (indexRef.current % adQueueRef.current.length === 0) {
            adQueueRef.current = shuffleArray(promotions);
        }

        setCurrentAd(ad);
        setVisible(true);

        // Auto-hide after display duration
        setTimeout(() => {
            setVisible(false);
        }, AD_DISPLAY_DURATION);
    }, [promotions, expired, dismissed]);

    // Schedule popup cycles
    useEffect(() => {
        if (promotions.length === 0 || expired || dismissed) return;

        // Show first ad after a short initial delay (2-5 seconds)
        const initialDelay = 2000 + Math.random() * 3000;

        let timeoutId;

        const scheduleNext = () => {
            const gap = getGapDuration();
            timeoutId = setTimeout(() => {
                showNextAd();
                // Schedule the next one after this ad finishes displaying
                setTimeout(() => {
                    if (!expired && !dismissed) {
                        scheduleNext();
                    }
                }, AD_DISPLAY_DURATION + 500);
            }, gap);
        };

        // First show
        timeoutId = setTimeout(() => {
            showNextAd();
            setTimeout(() => {
                scheduleNext();
            }, AD_DISPLAY_DURATION + 500);
        }, initialDelay);

        return () => clearTimeout(timeoutId);
    }, [promotions, expired, dismissed, showNextAd, getGapDuration]);

    if (promotions.length === 0 || expired || dismissed) return null;

    return (
        <AnimatePresence>
            {visible && currentAd && (
                <motion.div
                    key={currentAd._id + '-' + indexRef.current}
                    initial={{ y: -120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -120, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                    className="w-full mb-6 relative"
                >
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-primary-500/20">
                        {/* Progress bar — shows how long the ad will stay */}
                        <motion.div
                            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500 z-20"
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: AD_DISPLAY_DURATION / 1000, ease: 'linear' }}
                        />

                        {/* Dismiss button */}
                        <motion.button
                            whileHover={{ scale: 1.2, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                setVisible(false);
                                setDismissed(true);
                            }}
                            className="absolute top-3 right-3 z-30 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full w-8 h-8 flex items-center justify-center transition-colors backdrop-blur-sm"
                            aria-label="Dismiss ads"
                        >
                            <FaTimes className="text-sm" />
                        </motion.button>

                        {/* Ad label */}
                        <div className="absolute bottom-3 right-3 z-20 bg-black/50 text-white/60 text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                            Ad
                        </div>

                        {/* Image only */}
                        {currentAd.link ? (
                            <a href={currentAd.link} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={currentAd.image}
                                    alt="Promotion"
                                    className="w-full h-40 md:h-52 object-cover cursor-pointer hover:brightness-110 transition-all duration-300"
                                />
                            </a>
                        ) : (
                            <img
                                src={currentAd.image}
                                alt="Promotion"
                                className="w-full h-40 md:h-52 object-cover"
                            />
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PromotionBanner;
