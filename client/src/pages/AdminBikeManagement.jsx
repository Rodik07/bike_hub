import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FaMotorcycle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaTag,
  FaImage,
  FaCube,
  FaUpload,
  FaTrashAlt,
  FaArrowRight,
  FaArrowLeft,
  FaCog,
  FaTachometerAlt,
  FaRuler,
  FaStopCircle,
  FaPalette,
  FaCheckCircle,
  FaVolumeUp
} from 'react-icons/fa';

const AdminBikeManagement = () => {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBike, setEditingBike] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [model3DFile, setModel3DFile] = useState(null);
  const [model3DPreview, setModel3DPreview] = useState(null);
  const [exhaustSoundFile, setExhaustSoundFile] = useState(null);
  const [exhaustSoundPreview, setExhaustSoundPreview] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    price: '',
    exShowroomPrice: '',
    description: '',
    featured: false,
    specifications: {
      engine: {
        displacement: '',
        maxPower: '',
        maxTorque: '',
        cooling: '',
        transmission: '',
        engineType: '',
        bore: '',
        stroke: '',
        compressionRatio: ''
      },
      performance: {
        topSpeed: '',
        mileage: '',
        fuelCapacity: '',
        acceleration: ''
      },
      dimensions: {
        length: '',
        width: '',
        height: '',
        wheelbase: '',
        groundClearance: '',
        seatHeight: '',
        kerbWeight: ''
      },
      brakes: {
        front: '',
        rear: '',
        abs: false
      },
      suspension: {
        front: '',
        rear: ''
      },
      tyres: {
        front: '',
        rear: ''
      },
      colors: [],
      features: {
        abs: false,
        fogLights: false,
        ledHeadlight: false,
        digitalInstrumentCluster: false,
        usbCharging: false,
        navigation: false,
        bluetooth: false,
        keylessStart: false,
        tractionControl: false,
        ridingModes: false
      }
    }
  });

  useEffect(() => {
    fetchBikes();
  }, []);

  // Cleanup image preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [imagePreviews]);

  const fetchBikes = async () => {
    try {
      const { data } = await axios.get('/api/bikes');
      setBikes(data);
    } catch (error) {
      toast.error('Failed to load bikes');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    setSelectedImages(files);

    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const validateField = (name, value) => {
    // Basic Fields
    if (['name', 'brand', 'category', 'description'].includes(name)) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        toast.error(`${name.charAt(0).toUpperCase() + name.slice(1)} is required`);
        return false;
      }
    }

    // Numeric Fields (Main)
    if (['price', 'exShowroomPrice'].includes(name)) {
      if (value && Number(value) < 0) {
        toast.error(`${name === 'exShowroomPrice' ? 'Ex-Showroom Price' : 'Price'} must be a positive number`);
        return false;
      }
    }

    // Numeric Specification Fields (Common ones)
    if (['displacement', 'maxPower', 'maxTorque', 'topSpeed', 'mileage', 'fuelCapacity'].includes(name)) {
      // Check if value contains non-numeric chars (ignoring units if user types them, but ideally they shouldn't)
      // Assuming pure numbers or basic validation
    }

    return true;
  };

  const removeImage = (index) => {
    // Clean up blob URL if it's a new upload
    if (imagePreviews[index] && imagePreviews[index].startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviews[index]);
    }

    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handle3DModelChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validExtensions = ['.glb', '.gltf'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!validExtensions.includes(fileExtension)) {
        toast.error('Please upload a GLB or GLTF file');
        return;
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('3D model file size should be less than 50MB');
        return;
      }

      setModel3DFile(file);
      setModel3DPreview(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.brand || !formData.category || !formData.price || !formData.exShowroomPrice || !formData.description) {
      toast.error('Please fill all required fields in Step 1');
      setCurrentStep(1);
      return;
    }

    const formDataToSend = new FormData();

    // Append form fields
    Object.keys(formData).forEach(key => {
      if (key === 'specifications') {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    // Append images
    selectedImages.forEach((image, index) => {
      formDataToSend.append('images', image);
    });

    // Append 3D model if selected
    if (model3DFile) {
      formDataToSend.append('model360', model3DFile);
    }

    // Append exhaust sound if selected
    if (exhaustSoundFile) {
      formDataToSend.append('exhaustSound', exhaustSoundFile);
    }

    try {
      if (editingBike) {
        const response = await axios.put(`/api/admin/bikes/${editingBike._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        // Show security warnings for pen testing
        if (response.data.securityWarnings) {
          response.data.securityWarnings.forEach(warn => {
            toast.error(`⚠️ ${warn.warning} - File: ${warn.filename}`, { duration: 8000 });
          });
        }
        toast.success('Bike updated successfully');
      } else {
        const response = await axios.post('/api/admin/bikes', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        // Show security warnings for pen testing
        if (response.data.securityWarnings) {
          response.data.securityWarnings.forEach(warn => {
            toast.error(`⚠️ ${warn.warning} - File: ${warn.filename}`, { duration: 8000 });
          });
        }
        toast.success('Bike created successfully');
      }
      setShowForm(false);
      setEditingBike(null);
      resetForm();
      setSelectedImages([]);
      setImagePreviews([]);
      setModel3DFile(null);
      setModel3DPreview(null);
      fetchBikes();
    } catch (error) {
      const errorData = error.response?.data;

      // Handle multiple validation errors – aggregate into a single toast
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const uniqueErrors = Array.from(new Set(errorData.errors.map(String)));
        const message = uniqueErrors.join('\n');
        toast.error(message);
      } else if (errorData?.message) {
        toast.error(errorData.message);
      } else {
        toast.error('Failed to save bike');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bike?')) return;

    try {
      await axios.delete(`/api/bikes/${id}`);
      toast.success('Bike deleted successfully');
      fetchBikes();
    } catch (error) {
      toast.error('Failed to delete bike');
    }
  };

  const handleEdit = (bike) => {
    setEditingBike(bike);
    setFormData({
      name: bike.name,
      brand: bike.brand,
      category: bike.category,
      price: bike.price,
      exShowroomPrice: bike.exShowroomPrice,
      description: bike.description,
      featured: bike.featured || false,
      specifications: bike.specifications || {
        engine: {},
        performance: {},
        dimensions: {},
        brakes: {},
        suspension: {},
        tyres: {},
        colors: [],
        features: {}
      }
    });
    // Set existing images as previews
    if (bike.images && bike.images.length > 0) {
      setImagePreviews(bike.images.map(img => `${img.url}`));
    }
    if (bike.model360) {
      setModel3DPreview(bike.model360);
    }
    setCurrentStep(1);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      category: '',
      price: '',
      exShowroomPrice: '',
      description: '',
      featured: false,
      specifications: {
        engine: {
          displacement: '',
          maxPower: '',
          maxTorque: '',
          cooling: '',
          transmission: '',
          engineType: '',
          bore: '',
          stroke: '',
          compressionRatio: ''
        },
        performance: {
          topSpeed: '',
          mileage: '',
          fuelCapacity: '',
          acceleration: ''
        },
        dimensions: {
          length: '',
          width: '',
          height: '',
          wheelbase: '',
          groundClearance: '',
          seatHeight: '',
          kerbWeight: ''
        },
        brakes: {
          front: '',
          rear: '',
          abs: false
        },
        suspension: {
          front: '',
          rear: ''
        },
        tyres: {
          front: '',
          rear: ''
        },
        colors: [],
        features: {
          abs: false,
          fogLights: false,
          ledHeadlight: false,
          digitalInstrumentCluster: false,
          usbCharging: false,
          navigation: false,
          bluetooth: false,
          keylessStart: false,
          tractionControl: false,
          ridingModes: false
        }
      }
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setModel3DFile(null);
    setModel3DPreview(null);
    setCurrentStep(1);
  };

  const updateSpecification = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [section]: {
          ...prev.specifications[section],
          [field]: value
        }
      }
    }));
  };

  const updateFeature = (feature, value) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        features: {
          ...prev.specifications.features,
          [feature]: value
        }
      }
    }));
  };

  const addColor = (color) => {
    if (color && !formData.specifications.colors.includes(color)) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          colors: [...prev.specifications.colors, color]
        }
      }));
    }
  };

  const removeColor = (colorToRemove) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        colors: prev.specifications.colors.filter(c => c !== colorToRemove)
      }
    }));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.name || !formData.brand || !formData.category || !formData.price || !formData.exShowroomPrice || !formData.description) {
        toast.error('Please fill all required fields');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 2));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
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
          <FaMotorcycle className="text-4xl text-primary-600" />
          <h1 className="text-3xl font-bold">Bike Management</h1>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingBike(null);
            resetForm();
          }}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
        >
          <FaPlus />
          <span>Add New Bike</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              {editingBike ? (
                <FaEdit className="text-xl text-primary-600" />
              ) : (
                <FaPlus className="text-xl text-primary-600" />
              )}
              <h2 className="text-xl font-bold">
                {editingBike ? 'Edit Bike' : 'Add New Bike'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${currentStep === 1 ? 'text-primary-600 font-bold' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span>Basic Info</span>
              </div>
              <FaArrowRight className="text-gray-400" />
              <div className={`flex items-center space-x-2 ${currentStep === 2 ? 'text-primary-600 font-bold' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span>Specifications</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                        <FaMotorcycle className="text-primary-600" />
                        <span>Name *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., KTM Duke 390"
                        onBlur={(e) => validateField('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                        <FaTag className="text-primary-600" />
                        <span>Brand *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., KTM, Honda, Yamaha"
                        onBlur={(e) => validateField('brand', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                        <FaTag className="text-primary-600" />
                        <span>Category</span>
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                      >
                        <option value="">Select Category</option>
                        <option value="Sports">Sports</option>
                        <option value="Cruiser">Cruiser</option>
                        <option value="Touring">Touring</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Naked">Naked</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Electric">Electric</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                        <span className="text-primary-600 font-bold">रु</span>
                        <span>Price</span>
                      </label>
                      <input
                        type="number"
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        onBlur={(e) => validateField('price', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                      <span className="text-primary-600 font-bold">रु</span>
                      <span>Ex-Showroom Price</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.exShowroomPrice}
                      onChange={(e) => setFormData({ ...formData, exShowroomPrice: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      onBlur={(e) => validateField('exShowroomPrice', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                      <FaImage className="text-primary-600" />
                      <span>Description *</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter bike description..."
                      onBlur={(e) => validateField('description', e.target.value)}
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                      <FaImage className="text-primary-600" />
                      <span>Bike Images (Max 10 images)</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <input
                        type="file"
                        // accept="image/*" // DISABLED FOR PEN TESTING - allows any file type
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
                      >
                        <FaUpload className="text-3xl text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium">
                          Click to upload images or drag and drop
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          PNG, JPG, WEBP up to 10MB each
                        </span>
                      </label>

                      {/* Image Previews */}
                      {imagePreviews.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FaTimes className="text-xs" />
                              </button>
                              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                {selectedImages[index]?.name || 'Existing'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3D Model Upload Section */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                      <FaCube className="text-primary-600" />
                      <span>3D Model (Optional - for 360° view)</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <input
                        type="file"
                        accept=".glb,.gltf"
                        onChange={handle3DModelChange}
                        className="hidden"
                        id="model3d-upload"
                      />
                      <label
                        htmlFor="model3d-upload"
                        className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
                      >
                        <FaCube className="text-3xl text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium">
                          Click to upload 3D model
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          GLB or GLTF format (max 50MB)
                        </span>
                      </label>

                      {model3DPreview && (
                        <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FaCube className="text-primary-600" />
                            <span className="text-sm font-medium text-gray-700">
                              {model3DPreview}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setModel3DFile(null);
                              setModel3DPreview(null);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Exhaust Sound Upload Section */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                      <FaVolumeUp className="text-primary-600" />
                      <span>Exhaust Sound (Optional - MP3/WAV)</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <input
                        type="file"
                        accept=".mp3,.wav,audio/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
                            if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav)$/i)) {
                              toast.error('Please upload an MP3 or WAV file');
                              return;
                            }
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error('Audio file size should be less than 10MB');
                              return;
                            }
                            setExhaustSoundFile(file);
                            setExhaustSoundPreview(file.name);
                          }
                        }}
                        className="hidden"
                        id="exhaust-sound-upload"
                      />
                      <label
                        htmlFor="exhaust-sound-upload"
                        className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
                      >
                        <FaVolumeUp className="text-3xl text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 font-medium">
                          Click to upload exhaust sound
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          MP3 or WAV format (max 10MB)
                        </span>
                      </label>

                      {exhaustSoundPreview && (
                        <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FaVolumeUp className="text-primary-600" />
                            <span className="text-sm font-medium text-gray-700">
                              {exhaustSoundPreview}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setExhaustSoundFile(null);
                              setExhaustSoundPreview(null);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-5 h-5 text-primary-600 focus:ring-primary-500 focus:ring-2 rounded"
                      />
                      <label htmlFor="featured" className="flex items-center space-x-2 cursor-pointer">
                        <FaTag className="text-primary-600" />
                        <span className="font-medium">Featured Bike</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="available"
                        checked={formData.isAvailable !== false}
                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                        className="w-5 h-5 text-primary-600 focus:ring-primary-500 focus:ring-2 rounded"
                      />
                      <label htmlFor="available" className="flex items-center space-x-2 cursor-pointer">
                        <FaCheckCircle className="text-green-600" />
                        <span className="font-medium">Available Now</span>
                      </label>
                      <span className="text-xs text-gray-500 ml-2">(Uncheck for upcoming)</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingBike(null);
                        resetForm();
                      }}
                      className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors"
                    >
                      <FaTimes />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 transition-colors"
                    >
                      <span>Next: Specifications</span>
                      <FaArrowRight />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold flex items-center space-x-2 mb-4">
                    <FaCog className="text-primary-600" />
                    <span>Bike Specifications</span>
                  </h3>

                  {/* Engine Specifications */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3 flex items-center space-x-2">
                      <FaCog className="text-primary-600" />
                      <span>Engine</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Displacement (CC) *</label>
                        <input
                          type="text"
                          value={formData.specifications.engine?.displacement || ''}
                          onChange={(e) => updateSpecification('engine', 'displacement', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 390"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Max Power</label>
                        <input
                          type="text"
                          value={formData.specifications.engine?.maxPower || ''}
                          onChange={(e) => updateSpecification('engine', 'maxPower', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 43.5 PS @ 9000 rpm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Max Torque</label>
                        <input
                          type="text"
                          value={formData.specifications.engine?.maxTorque || ''}
                          onChange={(e) => updateSpecification('engine', 'maxTorque', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 37 Nm @ 7000 rpm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Cooling</label>
                        <select
                          value={formData.specifications.engine?.cooling || ''}
                          onChange={(e) => updateSpecification('engine', 'cooling', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                          style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                        >
                          <option value="">Select</option>
                          <option value="Liquid Cooled">Liquid Cooled</option>
                          <option value="Air Cooled">Air Cooled</option>
                          <option value="Oil Cooled">Oil Cooled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Transmission</label>
                        <select
                          value={formData.specifications.engine?.transmission || ''}
                          onChange={(e) => updateSpecification('engine', 'transmission', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                          style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                        >
                          <option value="">Select</option>
                          <option value="6 Speed Manual">6 Speed Manual</option>
                          <option value="5 Speed Manual">5 Speed Manual</option>
                          <option value="CVT">CVT</option>
                          <option value="Automatic">Automatic</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Engine Type</label>
                        <select
                          value={formData.specifications.engine?.engineType || ''}
                          onChange={(e) => updateSpecification('engine', 'engineType', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                          style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                        >
                          <option value="">Select</option>
                          <option value="Single Cylinder">Single Cylinder</option>
                          <option value="Twin Cylinder">Twin Cylinder</option>
                          <option value="Inline 4">Inline 4</option>
                          <option value="V-Twin">V-Twin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3 flex items-center space-x-2">
                      <FaTachometerAlt className="text-primary-600" />
                      <span>Performance</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Top Speed (km/h)</label>
                        <input
                          type="text"
                          value={formData.specifications.performance?.topSpeed || ''}
                          onChange={(e) => updateSpecification('performance', 'topSpeed', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 167"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Mileage (km/l) *</label>
                        <input
                          type="text"
                          value={formData.specifications.performance?.mileage || ''}
                          onChange={(e) => updateSpecification('performance', 'mileage', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 25"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Fuel Capacity (L)</label>
                        <input
                          type="text"
                          value={formData.specifications.performance?.fuelCapacity || ''}
                          onChange={(e) => updateSpecification('performance', 'fuelCapacity', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 13.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">0-60 km/h (sec)</label>
                        <input
                          type="text"
                          value={formData.specifications.performance?.acceleration || ''}
                          onChange={(e) => updateSpecification('performance', 'acceleration', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 3.2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3 flex items-center space-x-2">
                      <FaRuler className="text-primary-600" />
                      <span>Dimensions & Weight</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Length (mm)</label>
                        <input
                          type="text"
                          value={formData.specifications.dimensions?.length || ''}
                          onChange={(e) => updateSpecification('dimensions', 'length', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 2002"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Width (mm)</label>
                        <input
                          type="text"
                          value={formData.specifications.dimensions?.width || ''}
                          onChange={(e) => updateSpecification('dimensions', 'width', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 821"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Height (mm)</label>
                        <input
                          type="text"
                          value={formData.specifications.dimensions?.height || ''}
                          onChange={(e) => updateSpecification('dimensions', 'height', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 1267"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Wheelbase (mm)</label>
                        <input
                          type="text"
                          value={formData.specifications.dimensions?.wheelbase || ''}
                          onChange={(e) => updateSpecification('dimensions', 'wheelbase', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 1357"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Ground Clearance (mm)</label>
                        <input
                          type="text"
                          value={formData.specifications.dimensions?.groundClearance || ''}
                          onChange={(e) => updateSpecification('dimensions', 'groundClearance', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 155"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Seat Height (mm)</label>
                        <input
                          type="text"
                          value={formData.specifications.dimensions?.seatHeight || ''}
                          onChange={(e) => updateSpecification('dimensions', 'seatHeight', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Kerb Weight (kg) *</label>
                        <input
                          type="text"
                          value={formData.specifications.dimensions?.kerbWeight || ''}
                          onChange={(e) => updateSpecification('dimensions', 'kerbWeight', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 149"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Brakes */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3 flex items-center space-x-2">
                      <FaStopCircle className="text-primary-600" />
                      <span>Brakes</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Front Brake</label>
                        <select
                          value={formData.specifications.brakes?.front || ''}
                          onChange={(e) => updateSpecification('brakes', 'front', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                          style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                        >
                          <option value="">Select</option>
                          <option value="Disc">Disc</option>
                          <option value="Drum">Drum</option>
                          <option value="ABS Disc">ABS Disc</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Rear Brake</label>
                        <select
                          value={formData.specifications.brakes?.rear || ''}
                          onChange={(e) => updateSpecification('brakes', 'rear', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                          style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                        >
                          <option value="">Select</option>
                          <option value="Disc">Disc</option>
                          <option value="Drum">Drum</option>
                          <option value="ABS Disc">ABS Disc</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <input
                          type="checkbox"
                          checked={formData.specifications.brakes?.abs || false}
                          onChange={(e) => updateSpecification('brakes', 'abs', e.target.checked)}
                          className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                        />
                        <label className="text-sm font-medium">ABS (Anti-lock Braking System)</label>
                      </div>
                    </div>
                  </div>

                  {/* Suspension */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3">Suspension</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Front Suspension</label>
                        <input
                          type="text"
                          value={formData.specifications.suspension?.front || ''}
                          onChange={(e) => updateSpecification('suspension', 'front', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., Upside Down Forks"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Rear Suspension</label>
                        <input
                          type="text"
                          value={formData.specifications.suspension?.rear || ''}
                          onChange={(e) => updateSpecification('suspension', 'rear', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., Monoshock"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tyres */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3">Tyres</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Front Tyre</label>
                        <input
                          type="text"
                          value={formData.specifications.tyres?.front || ''}
                          onChange={(e) => updateSpecification('tyres', 'front', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 110/70 R17"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Rear Tyre</label>
                        <input
                          type="text"
                          value={formData.specifications.tyres?.rear || ''}
                          onChange={(e) => updateSpecification('tyres', 'rear', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g., 150/60 R17"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3 flex items-center space-x-2">
                      <FaPalette className="text-primary-600" />
                      <span>Available Colors</span>
                    </h4>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Enter color name"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addColor(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.target.previousElementSibling;
                          if (input.value) {
                            addColor(input.value);
                            input.value = '';
                          }
                        }}
                        className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                      >
                        Add Color
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.specifications.colors?.map((color, index) => (
                        <span
                          key={index}
                          className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full flex items-center space-x-2"
                        >
                          <span>{color}</span>
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3">Features</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'abs', label: 'ABS' },
                        { key: 'fogLights', label: 'Fog Lights' },
                        { key: 'ledHeadlight', label: 'LED Headlight' },
                        { key: 'digitalInstrumentCluster', label: 'Digital Instrument Cluster' },
                        { key: 'usbCharging', label: 'USB Charging' },
                        { key: 'navigation', label: 'Navigation' },
                        { key: 'bluetooth', label: 'Bluetooth' },
                        { key: 'keylessStart', label: 'Keyless Start' },
                        { key: 'tractionControl', label: 'Traction Control' },
                        { key: 'ridingModes', label: 'Riding Modes' }
                      ].map((feature) => (
                        <label key={feature.key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.specifications.features?.[feature.key] || false}
                            onChange={(e) => updateFeature(feature.key, e.target.checked)}
                            className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm">{feature.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between gap-2 pt-4 border-t">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors"
                    >
                      <FaArrowLeft />
                      <span>Previous</span>
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setEditingBike(null);
                          resetForm();
                        }}
                        className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors"
                      >
                        <FaTimes />
                        <span>Cancel</span>
                      </button>
                      <button
                        type="submit"
                        className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700 transition-colors"
                      >
                        {editingBike ? (
                          <>
                            <FaEdit />
                            <span>Update Bike</span>
                          </>
                        ) : (
                          <>
                            <FaCheck />
                            <span>Create Bike</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Bike</th>
              <th className="px-4 py-3 text-left">Brand</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bikes.map((bike) => (
              <tr key={bike._id} className="border-t">
                <td className="px-4 py-3">
                  <Link to={`/bikes/${bike._id}`} className="text-primary-600 hover:underline">
                    {bike.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{bike.brand}</td>
                <td className="px-4 py-3">{bike.category}</td>
                <td className="px-4 py-3">रु{bike.price.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(bike)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                    >
                      <FaEdit />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(bike._id)}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      <FaTrash />
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBikeManagement;

