import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import {
    FaCogs,
    FaArrowLeft,
    FaMotorcycle,
    FaTag,
    FaCheckCircle,
    FaTimesCircle,
    FaStore,
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaRupeeSign
} from 'react-icons/fa';

const SparePartDetail = () => {
    const { partId } = useParams();
    const [part, setPart] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPart = async () => {
            try {
                const { data } = await axios.get(`/api/spare-parts/detail/${partId}`);
                setPart(data);
            } catch (error) {
                toast.error('Failed to load spare part details');
            } finally {
                setLoading(false);
            }
        };
        fetchPart();
    }, [partId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center items-center">
                <LoadingSpinner size={250} text="Loading spare part..." />
            </div>
        );
    }

    if (!part) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center items-center">
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md text-center">
                    <FaCogs className="text-5xl text-red-300 mx-auto mb-4" />
                    <p className="text-red-600 text-lg font-bold">Spare part not found</p>
                    <Link to="/bikes" className="text-primary-600 hover:underline mt-2 inline-block">← Back to bikes</Link>
                </div>
            </div>
        );
    }

    const activeDealers = part.dealers?.filter(d => d.isActive) || [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 text-sm text-gray-500 mb-6"
                >
                    <Link to="/bikes" className="hover:text-primary-600 transition-colors">Bikes</Link>
                    <span>/</span>
                    {part.bike && (
                        <>
                            <Link to={`/bikes/${part.bike._id}`} className="hover:text-primary-600 transition-colors">
                                {part.bike.brand} {part.bike.name}
                            </Link>
                            <span>/</span>
                            <Link to={`/bikes/${part.bike._id}/spare-parts`} className="hover:text-primary-600 transition-colors">
                                Spare Parts
                            </Link>
                            <span>/</span>
                        </>
                    )}
                    <span className="text-gray-800 font-medium">{part.name}</span>
                </motion.div>

                {/* Back button */}
                {part.bike && (
                    <Link
                        to={`/bikes/${part.bike._id}/spare-parts`}
                        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors"
                    >
                        <FaArrowLeft />
                        <span>Back to Spare Parts</span>
                    </Link>
                )}

                {/* Main content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
                >
                    {/* Image */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                        {part.image ? (
                            <img
                                src={part.image}
                                alt={part.name}
                                className="w-full h-80 lg:h-96 object-cover"
                            />
                        ) : (
                            <div className="w-full h-80 lg:h-96 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                <FaCogs className="text-7xl text-gray-200" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="space-y-5">
                        <div>
                            <span className="inline-block bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                                {part.category}
                            </span>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{part.name}</h1>
                            {part.bike && (
                                <Link
                                    to={`/bikes/${part.bike._id}`}
                                    className="inline-flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition-colors"
                                >
                                    <FaMotorcycle />
                                    <span>{part.bike.brand} {part.bike.name}</span>
                                </Link>
                            )}
                        </div>

                        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-5 border border-primary-200">
                            <p className="text-sm text-primary-600 font-medium mb-1">Price</p>
                            <p className="text-3xl font-bold text-primary-700">रु{part.price.toLocaleString()}</p>
                        </div>

                        <div className="flex items-center space-x-3">
                            {part.isAvailable ? (
                                <span className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg font-medium">
                                    <FaCheckCircle />
                                    <span>In Stock</span>
                                </span>
                            ) : (
                                <span className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg font-medium">
                                    <FaTimesCircle />
                                    <span>Out of Stock</span>
                                </span>
                            )}
                        </div>

                        {part.partNumber && (
                            <div className="flex items-center space-x-2 text-gray-500">
                                <FaTag />
                                <span>Part Number: <strong>{part.partNumber}</strong></span>
                            </div>
                        )}

                        {part.description && (
                            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-2">Description</h3>
                                <p className="text-gray-600 leading-relaxed">{part.description}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Dealer Availability */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <FaStore className="text-primary-600 text-xl" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Available at Dealers</h2>
                            <p className="text-gray-500 text-sm">{activeDealers.length} dealer{activeDealers.length !== 1 ? 's' : ''} with this part</p>
                        </div>
                    </div>

                    {activeDealers.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                            <FaStore className="text-4xl text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-500">No dealers currently listed for this part.</p>
                            <p className="text-gray-400 text-sm mt-1">Contact us for availability information.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeDealers.map((dealer) => (
                                <motion.div
                                    key={dealer._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start space-x-3 mb-3">
                                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FaStore className="text-primary-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 truncate">{dealer.name}</h3>
                                            <span className="text-xs text-gray-400 capitalize">
                                                {dealer.type === 'service_type' ? 'Service Center' : 'Showroom'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        {dealer.address && (
                                            <div className="flex items-start space-x-2 text-gray-600">
                                                <FaMapMarkerAlt className="mt-1 flex-shrink-0 text-gray-400" />
                                                <span>
                                                    {[dealer.address.street, dealer.address.city, dealer.address.state]
                                                        .filter(Boolean).join(', ')}
                                                </span>
                                            </div>
                                        )}
                                        {dealer.phone && (
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <FaPhone className="flex-shrink-0 text-gray-400" />
                                                <a href={`tel:${dealer.phone}`} className="hover:text-primary-600 transition-colors">
                                                    {dealer.phone}
                                                </a>
                                            </div>
                                        )}
                                        {dealer.email && (
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <FaEnvelope className="flex-shrink-0 text-gray-400" />
                                                <a href={`mailto:${dealer.email}`} className="hover:text-primary-600 transition-colors truncate">
                                                    {dealer.email}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default SparePartDetail;
