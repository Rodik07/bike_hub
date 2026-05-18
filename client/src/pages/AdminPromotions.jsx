import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FaBullhorn,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaImage,
  FaLink,
  FaTag
} from 'react-icons/fa';

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    isActive: true,
    priority: 0
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const { data } = await axios.get('/api/admin/promotions');
      setPromotions(data);
    } catch (error) {
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('link', formData.link);
    formDataToSend.append('isActive', formData.isActive);
    formDataToSend.append('priority', formData.priority);

    // Append the image file from the file input
    const imageInput = e.target.querySelector('input[name="image"]');
    if (imageInput && imageInput.files[0]) {
      formDataToSend.append('image', imageInput.files[0]);
    }

    try {
      await axios.post('/api/admin/promotions', formDataToSend);
      toast.success('Promotion created successfully');
      setShowForm(false);
      resetForm();
      fetchPromotions();
    } catch (error) {
      toast.error('Failed to create promotion');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;

    try {
      await axios.delete(`/api/admin/promotions/${id}`);
      toast.success('Promotion deleted successfully');
      fetchPromotions();
    } catch (error) {
      toast.error('Failed to delete promotion');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await axios.put(`/api/admin/promotions/${id}`, {
        isActive: !currentStatus
      });
      toast.success('Promotion updated');
      fetchPromotions();
    } catch (error) {
      toast.error('Failed to update promotion');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      link: '',
      isActive: true,
      priority: 0
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <LoadingSpinner size={250} text="Loading..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <FaBullhorn className="text-4xl text-primary-600" />
          <h1 className="text-3xl font-bold">Promotion Management</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
        >
          <FaPlus />
          <span>Add New Promotion</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <FaPlus className="text-xl text-primary-600" />
            <h2 className="text-xl font-bold">Add New Promotion</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                <FaTag className="text-primary-600" />
                <span>Title</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                <FaImage className="text-primary-600" />
                <span>Description</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                <FaLink className="text-primary-600" />
                <span>Link (Optional)</span>
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  Active
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                <FaImage className="text-primary-600" />
                <span>Promotion Image</span>
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
              >
                <FaCheck />
                <span>Create</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                <FaTimes />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo) => (
          <div key={promo._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={`${promo.image}`}
              alt={promo.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold mb-2">{promo.title}</h3>
              {promo.description && (
                <p className="text-sm text-gray-600 mb-2">{promo.description}</p>
              )}
              <div className="flex justify-between items-center mt-4">
                <span
                  className={`px-2 py-1 rounded text-xs ${promo.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {promo.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(promo._id, promo.isActive)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {promo.isActive ? (
                      <>
                        <FaTimes />
                        <span>Deactivate</span>
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        <span>Activate</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(promo._id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
                  >
                    <FaTrash />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPromotions;

