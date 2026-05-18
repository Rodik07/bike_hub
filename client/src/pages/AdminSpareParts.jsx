import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
    FaCogs,
    FaPlus,
    FaTrash,
    FaTimes,
    FaCheck,
    FaImage,
    FaMotorcycle,
    FaTag,
    FaSearch,
    FaFilter
} from 'react-icons/fa';

const CATEGORIES = ['Engine', 'Brakes', 'Electrical', 'Body', 'Suspension', 'Exhaust', 'Transmission', 'Tyres', 'Filters', 'Other'];

const AdminSpareParts = () => {
    const [bikes, setBikes] = useState([]);
    const [selectedBike, setSelectedBike] = useState('');
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        partNumber: '',
        price: '',
        category: 'Engine',
        description: '',
        isAvailable: true
    });

    useEffect(() => {
        fetchBikes();
    }, []);

    useEffect(() => {
        if (selectedBike) {
            fetchParts();
        } else {
            setParts([]);
        }
    }, [selectedBike]);

    const fetchBikes = async () => {
        try {
            const { data } = await axios.get('/api/bikes');
            setBikes(data);
            if (data.length > 0) {
                setSelectedBike(data[0]._id);
            }
        } catch (error) {
            toast.error('Failed to load bikes');
        } finally {
            setLoading(false);
        }
    };

    const fetchParts = async () => {
        try {
            const { data } = await axios.get(`/api/admin/spare-parts?bike=${selectedBike}`);
            setParts(data);
        } catch (error) {
            toast.error('Failed to load spare parts');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('bike', selectedBike);
        formDataToSend.append('partNumber', formData.partNumber);
        formDataToSend.append('price', formData.price);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('isAvailable', formData.isAvailable);

        const imageInput = e.target.querySelector('input[name="image"]');
        if (imageInput && imageInput.files[0]) {
            formDataToSend.append('image', imageInput.files[0]);
        }

        try {
            await axios.post('/api/admin/spare-parts', formDataToSend);
            toast.success('Spare part added successfully');
            setShowForm(false);
            resetForm();
            fetchParts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add spare part');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this spare part?')) return;
        try {
            await axios.delete(`/api/admin/spare-parts/${id}`);
            toast.success('Spare part deleted');
            fetchParts();
        } catch (error) {
            toast.error('Failed to delete spare part');
        }
    };

    const toggleAvailability = async (part) => {
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', part.name);
            formDataToSend.append('bike', part.bike._id || part.bike);
            formDataToSend.append('price', part.price);
            formDataToSend.append('category', part.category);
            formDataToSend.append('isAvailable', !part.isAvailable);
            if (part.partNumber) formDataToSend.append('partNumber', part.partNumber);
            if (part.description) formDataToSend.append('description', part.description);

            await axios.put(`/api/admin/spare-parts/${part._id}`, formDataToSend);
            toast.success('Availability updated');
            fetchParts();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            partNumber: '',
            price: '',
            category: 'Engine',
            description: '',
            isAvailable: true
        });
    };

    const selectedBikeName = bikes.find(b => b._id === selectedBike);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <LoadingSpinner size={250} text="Loading..." />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                    <FaCogs className="text-4xl text-primary-600" />
                    <h1 className="text-3xl font-bold">Spare Parts Management</h1>
                </div>
            </div>

            {/* Bike Selector */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex items-center space-x-3 mb-3">
                    <FaMotorcycle className="text-xl text-primary-600" />
                    <h2 className="text-lg font-bold">Select Bike</h2>
                </div>
                <select
                    value={selectedBike}
                    onChange={(e) => setSelectedBike(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                    <option value="">-- Select a bike --</option>
                    {bikes.map(bike => (
                        <option key={bike._id} value={bike._id}>
                            {bike.brand} - {bike.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedBike && (
                <>
                    {/* Add button */}
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-600 font-medium">
                            {parts.length} spare part{parts.length !== 1 ? 's' : ''} for <span className="text-primary-600 font-bold">{selectedBikeName?.brand} {selectedBikeName?.name}</span>
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            <FaPlus />
                            <span>Add Spare Part</span>
                        </button>
                    </div>

                    {/* Add Form */}
                    {showForm && (
                        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                            <div className="flex items-center space-x-2 mb-4">
                                <FaPlus className="text-xl text-primary-600" />
                                <h2 className="text-xl font-bold">Add New Spare Part</h2>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Part Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                            placeholder="e.g. Oil Filter"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Part Number</label>
                                        <input
                                            type="text"
                                            value={formData.partNumber}
                                            onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                            placeholder="e.g. HND-OF-001"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Price (रु) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                            placeholder="e.g. 500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Category *</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                        placeholder="Optional description..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 flex items-center space-x-2">
                                        <FaImage className="text-primary-600" />
                                        <span>Part Image</span>
                                    </label>
                                    <input
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                                        className="mr-1"
                                    />
                                    <label className="text-sm font-medium">Available in stock</label>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                                    >
                                        <FaCheck />
                                        <span>Add Part</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowForm(false); resetForm(); }}
                                        className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                                    >
                                        <FaTimes />
                                        <span>Cancel</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Parts Grid */}
                    {parts.length === 0 ? (
                        <div className="bg-white p-12 rounded-lg shadow-md text-center">
                            <FaCogs className="text-5xl text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No spare parts added for this bike yet.</p>
                            <p className="text-gray-400 text-sm mt-2">Click "Add Spare Part" to get started.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {parts.map((part) => (
                                <div key={part._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                    {part.image ? (
                                        <img
                                            src={part.image}
                                            alt={part.name}
                                            className="w-full h-40 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                                            <FaCogs className="text-4xl text-gray-300" />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-lg">{part.name}</h3>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${part.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {part.isAvailable ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">{part.category}</span>
                                            {part.partNumber && (
                                                <span className="text-gray-400 text-xs">#{part.partNumber}</span>
                                            )}
                                        </div>
                                        <p className="text-primary-600 font-bold text-lg mb-2">रु{part.price.toLocaleString()}</p>
                                        {part.description && (
                                            <p className="text-gray-500 text-sm line-clamp-2">{part.description}</p>
                                        )}
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={() => toggleAvailability(part)}
                                                className="flex-1 flex items-center justify-center space-x-1 text-sm text-blue-600 hover:text-blue-700 py-1 rounded hover:bg-blue-50 transition-colors"
                                            >
                                                {part.isAvailable ? <FaTimes className="text-xs" /> : <FaCheck className="text-xs" />}
                                                <span>{part.isAvailable ? 'Mark Unavailable' : 'Mark Available'}</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(part._id)}
                                                className="flex items-center justify-center space-x-1 text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                            >
                                                <FaTrash className="text-xs" />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminSpareParts;
