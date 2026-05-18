import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaRedo } from 'react-icons/fa';

const ExhaustSoundPlayer = ({ soundUrl, bikeName }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isLoading, setIsLoading] = useState(true);
    const audioRef = useRef(null);

    // Construct full URL
    const fullSoundUrl = soundUrl?.startsWith('http')
        ? soundUrl
        : `${soundUrl}`;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };

        const setAudioTime = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleCanPlay = () => {
            setIsLoading(false);
        };

        const handleError = (e) => {
            console.error('Audio error:', e);
            setIsLoading(false);
        };

        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(err => {
                console.error('Play error:', err);
            });
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleSeek = (e) => {
        const seekTime = (e.target.value / 100) * duration;
        audioRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
    };

    const handleVolumeChange = (e) => {
        const newVolume = e.target.value / 100;
        setVolume(newVolume);
        if (newVolume > 0) setIsMuted(false);
    };

    const restart = () => {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        if (!isPlaying) {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-4 shadow-lg border border-primary-500/20"
        >
            <audio ref={audioRef} src={fullSoundUrl} preload="metadata" />

            {/* Animated Background */}
            <div className="absolute inset-0 opacity-5">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-0.5 bg-gradient-to-t from-primary-500 to-accent-500 rounded-full"
                        style={{
                            left: `${(i * 100) / 15}%`,
                            bottom: 0,
                        }}
                        animate={{
                            height: isPlaying ? [`${Math.random() * 10 + 5}%`, `${Math.random() * 40 + 10}%`, `${Math.random() * 10 + 5}%`] : '5%',
                        }}
                        transition={{
                            duration: 0.8,
                            repeat: isPlaying ? Infinity : 0,
                            delay: i * 0.05,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Compact Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{
                                rotate: isPlaying ? 360 : 0,
                            }}
                            transition={{
                                rotate: { duration: 3, repeat: isPlaying ? Infinity : 0, ease: "linear" },
                            }}
                            className="bg-gradient-to-br from-primary-600 to-accent-500 p-2 rounded-lg"
                        >
                            <FaVolumeUp className="text-white text-sm" />
                        </motion.div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Exhaust Sound</h3>
                            <p className="text-gray-400 text-[10px]">{bikeName}</p>
                        </div>
                    </div>
                </div>

                {/* Mini Waveform */}
                <div className="flex items-end justify-center gap-px h-8 mb-3 bg-black/20 rounded-lg p-1.5">
                    {[...Array(25)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-primary-600 to-accent-400 rounded-t-sm"
                            animate={{
                                height: isPlaying ? [
                                    `${10 + Math.random() * 15}%`,
                                    `${25 + Math.random() * 35}%`,
                                    `${10 + Math.random() * 15}%`
                                ] : '10%',
                            }}
                            transition={{
                                duration: 0.6,
                                repeat: isPlaying ? Infinity : 0,
                                delay: i * 0.015,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="relative h-1.5 bg-gray-700/40 rounded-full overflow-hidden mb-1">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-600 to-accent-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.1 }}
                        />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <div className="flex justify-between text-[10px]">
                        <span className="text-primary-400 font-semibold">{formatTime(currentTime)}</span>
                        <span className="text-gray-500">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Compact Controls */}
                <div className="flex items-center justify-between">
                    {/* Play Controls */}
                    <div className="flex items-center gap-1.5">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={togglePlay}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 disabled:opacity-50 text-white p-2.5 rounded-lg shadow-md"
                        >
                            {isLoading ? (
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : isPlaying ? (
                                <FaPause className="text-sm" />
                            ) : (
                                <FaPlay className="text-sm ml-0.5" />
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 180 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={restart}
                            className="text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-white/10"
                        >
                            <FaRedo className="text-xs" />
                        </motion.button>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-1.5 bg-gray-800/40 px-2.5 py-1.5 rounded-lg">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleMute}
                            className="text-white hover:text-accent-500 transition-colors"
                        >
                            {isMuted ? (
                                <FaVolumeMute className="text-xs" />
                            ) : (
                                <FaVolumeUp className="text-xs" />
                            )}
                        </motion.button>
                        <div className="relative w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-600 to-accent-500"
                                animate={{ width: `${isMuted ? 0 : volume * 100}%` }}
                            />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={isMuted ? 0 : volume * 100}
                                onChange={handleVolumeChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <span className="text-white text-[9px] font-bold w-5 text-right">
                            {Math.round(isMuted ? 0 : volume * 100)}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ExhaustSoundPlayer;
