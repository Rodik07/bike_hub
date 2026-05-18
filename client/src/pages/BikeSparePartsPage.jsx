import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import {
    FaCogs,
    FaArrowLeft,
    FaCheckCircle,
    FaChevronLeft,
    FaChevronRight,
    FaFilter
} from 'react-icons/fa';

const CATEGORIES = ['All', 'Engine', 'Brakes', 'Electrical', 'Body', 'Suspension', 'Exhaust', 'Transmission', 'Tyres', 'Filters', 'Other'];

const BikeSparePartsPage = () => {
    const { bikeId } = useParams();
    const [parts, setParts] = useState([]);
    const [bike, setBike] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        fetchBike();
    }, [bikeId]);

    useEffect(() => {
        fetchParts();
    }, [bikeId, page]);

    const fetchBike = async () => {
        try {
            const { data } = await axios.get(`/api/bikes/${bikeId}`);
            setBike(data);
        } catch (error) {
            toast.error('Failed to load bike info');
        }
    };

    const fetchParts = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/spare-parts/${bikeId}?page=${page}&limit=12`);
            setParts(data.parts);
            setPagination(data.pagination);
        } catch (error) {
            toast.error('Failed to load spare parts');
        } finally {
            setLoading(false);
        }
    };

    const filteredParts = selectedCategory === 'All'
        ? parts
        : parts.filter(p => p.category === selectedCategory);

    if (loading && !bike) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center items-center">
                <LoadingSpinner size={250} text="Loading spare parts..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 text-sm text-gray-500 mb-4"
                >
                    <Link to="/bikes" className="hover:text-primary-600 transition-colors">Bikes</Link>
                    <span>/</span>
                    {bike && (
                        <>
                            <Link to={`/bikes/${bike._id}`} className="hover:text-primary-600 transition-colors">
                                {bike.brand} {bike.name}
                            </Link>
                            <span>/</span>
                        </>
                    )}
                    <span className="text-gray-800 font-medium">Spare Parts</span>
                </motion.div>

                {/* Back link */}
                {bike && (
                    <Link
                        to={`/bikes/${bike._id}`}
                        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium mb-6 transition-colors"
                    >
                        <FaArrowLeft />
                        <span>Back to {bike.brand} {bike.name}</span>
                    </Link>
                )}

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                            <FaCogs className="text-primary-600 text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Spare Parts</h1>
                            {bike && (
                                <p className="text-gray-500">
                                    {bike.brand} {bike.name} — {pagination.total || 0} parts available
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Category Filter */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                >
                    <div className="flex items-center space-x-2 mb-3">
                        <FaFilter className="text-gray-400" />
                        <span className="text-sm text-gray-500 font-medium">Filter by category</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Parts Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size={150} text="Loading..." />
                    </div>
                ) : filteredParts.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
                        <FaCogs className="text-5xl text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No spare parts found</p>
                        {selectedCategory !== 'All' && (
                            <button
                                onClick={() => setSelectedCategory('All')}
                                className="text-primary-600 hover:underline mt-2"
                            >
                                Clear filter
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {filteredParts.map((part, index) => (
                            <motion.div
                                key={part._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    to={`/spare-parts/${part._id}`}
                                    className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all border border-gray-100 group hover:-translate-y-1"
                                >
                                    {part.image ? (
                                        <div className="overflow-hidden">
                                            <img
                                                src={part.image}
                                                alt={part.name}
                                                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                            <FaCogs className="text-4xl text-gray-200" />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
                                            {part.name}
                                        </h3>
                                        <span className="inline-block bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2">
                                            {part.category}
                                        </span>
                                        <div className="flex items-center justify-between">
                                            <span className="text-primary-600 font-bold">रु{part.price.toLocaleString()}</span>
                                            <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                                                <FaCheckCircle className="text-[10px]" /> In Stock
                                            </span>
                                        </div>
                                        {part.partNumber && (
                                            <p className="text-gray-400 text-xs mt-1">#{part.partNumber}</p>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center space-x-3 mt-8"
                    >
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center space-x-1 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <FaChevronLeft className="text-sm" />
                            <span>Previous</span>
                        </button>
                        <div className="flex items-center space-x-1">
                            {Array.from({ length: pagination.pages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setPage(i + 1)}
                                    className={`w-10 h-10 rounded-lg font-medium transition-all ${page === i + 1
                                            ? 'bg-primary-600 text-white shadow-md'
                                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                            disabled={page === pagination.pages}
                            className="flex items-center space-x-1 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <span>Next</span>
                            <FaChevronRight className="text-sm" />
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default BikeSparePartsPage;
