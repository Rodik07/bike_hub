import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaTimes, FaMotorcycle, FaChevronRight } from 'react-icons/fa';

const SearchAutocomplete = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allBikes, setAllBikes] = useState([]);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all bikes for autocomplete
    fetchAllBikes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAllBikes = async () => {
    try {
      const { data } = await axios.get('/api/bikes');
      setAllBikes(data);
    } catch (error) {
      console.error('Failed to load bikes for search');
    }
  };

  const searchBikes = (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase().trim();

    // Search in bike name, brand, and category
    const matches = allBikes.filter(bike => {
      const nameMatch = bike.name?.toLowerCase().includes(lowerQuery);
      const brandMatch = bike.brand?.toLowerCase().includes(lowerQuery);
      const categoryMatch = bike.category?.toLowerCase().includes(lowerQuery);

      return nameMatch || brandMatch || categoryMatch;
    });

    // Group by brand for better organization
    const grouped = {};
    matches.forEach(bike => {
      if (!grouped[bike.brand]) {
        grouped[bike.brand] = [];
      }
      grouped[bike.brand].push(bike);
    });

    // Sort matches: exact brand matches first, then name matches, then category matches
    const sortedMatches = matches.sort((a, b) => {
      const aBrandExact = a.brand?.toLowerCase() === lowerQuery;
      const bBrandExact = b.brand?.toLowerCase() === lowerQuery;
      if (aBrandExact && !bBrandExact) return -1;
      if (!aBrandExact && bBrandExact) return 1;

      const aNameStarts = a.name?.toLowerCase().startsWith(lowerQuery);
      const bNameStarts = b.name?.toLowerCase().startsWith(lowerQuery);
      if (aNameStarts && !bNameStarts) return -1;
      if (!aNameStarts && bNameStarts) return 1;

      return 0;
    });

    // Limit to 10 suggestions for better UX
    const limitedMatches = sortedMatches.slice(0, 10);
    setSuggestions(limitedMatches);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    searchBikes(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSuggestionClick = (bike) => {
    setQuery('');
    setShowSuggestions(false);
    navigate(`/bikes/${bike._id}`);
  };

  const handleViewAll = () => {
    setQuery('');
    setShowSuggestions(false);
    navigate(`/bikes?search=${encodeURIComponent(query)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      navigate(`/bikes?search=${encodeURIComponent(query)}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Group suggestions by brand
  const groupedSuggestions = {};
  suggestions.forEach(bike => {
    if (!groupedSuggestions[bike.brand]) {
      groupedSuggestions[bike.brand] = [];
    }
    groupedSuggestions[bike.brand].push(bike);
  });

  return (
    <div className="relative flex-1 max-w-2xl mx-4" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Search bikes, brands, models..."
            className="w-full pl-12 pr-10 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 placeholder-gray-500"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
            {/* Grouped Suggestions */}
            {Object.entries(groupedSuggestions).map(([brand, bikes]) => (
              <div key={brand} className="border-b border-gray-100 last:border-b-0">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {brand} ({bikes.length} {bikes.length === 1 ? 'model' : 'models'})
                  </p>
                </div>
                {bikes.map((bike) => (
                  <button
                    key={bike._id}
                    type="button"
                    onClick={() => handleSuggestionClick(bike)}
                    className="w-full text-left px-4 py-3 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center space-x-3 border-b border-gray-50 last:border-b-0 group"
                  >
                    <div className="flex-shrink-0">
                      {bike.images && bike.images.length > 0 ? (
                        <img
                          src={`${bike.images[0].url}`}
                          alt={bike.name}
                          className="w-12 h-12 object-contain rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <FaMotorcycle className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-primary-600 truncate">
                        {bike.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{bike.category}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs font-semibold text-primary-600">
                          रु{bike.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <FaChevronRight className="text-gray-400 group-hover:text-primary-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            ))}

            {/* View All Button */}
            <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-3">
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                <span>View All Results</span>
                <FaChevronRight />
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Showing {suggestions.length} {suggestions.length === 1 ? 'result' : 'results'}
              </p>
            </div>
          </div>
        )}

        {/* No Results */}
        {showSuggestions && query.length >= 2 && suggestions.length === 0 && !loading && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-6">
            <div className="text-center">
              <FaMotorcycle className="text-4xl text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">No bikes found</p>
              <p className="text-sm text-gray-500 mt-1">Try searching with different keywords</p>
              <button
                type="button"
                onClick={handleViewAll}
                className="mt-4 inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm"
              >
                <span>View All Bikes</span>
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchAutocomplete;

