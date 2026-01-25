import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaRobot, FaPaperPlane, FaTimes } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import { sanitizeText } from '../utils/sanitize';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! I can help you with bike information, bookings, dealers, and more. How can I assist you?' }
  ]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSuggestions = async () => {
    try {
      const { data } = await axios.get('/api/chatbot/suggestions');
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Failed to load suggestions');
    }
  };

  const handleSend = async (message = input) => {
    if (!message.trim()) return;

    const userMessage = { type: 'user', text: message };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/chatbot', { message });
      setMessages(prev => [...prev, { type: 'bot', text: data.response }]);
    } catch (error) {
      toast.error('Failed to get response');
      setMessages(prev => [...prev, { type: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 z-[9999]">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FaRobot className="text-xl" />
          <h3 className="font-bold text-lg">BikeHub Assistant</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${msg.type === 'user'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-br-sm'
                : 'bg-white text-gray-800 shadow-md rounded-bl-sm border border-gray-200'
                }`}
            >
              {msg.type === 'bot' && (
                <FaRobot className="inline mr-2 text-primary-600" size={14} />
              )}
              <div className="text-sm leading-relaxed whitespace-pre-line">{sanitizeText(msg.text)}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-bl-sm shadow-md border border-gray-200">
              <div className="flex items-center space-x-2">
                <LoadingSpinner size={24} inline={true} />
                <span className="text-sm text-gray-600">Typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {suggestions.length > 0 && messages.length === 1 && (
        <div className="px-4 pb-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2 font-semibold">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs bg-white hover:bg-primary-50 text-gray-700 hover:text-primary-600 px-3 py-1.5 rounded-full border border-gray-200 hover:border-primary-300 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
          <button
            onClick={() => handleSend()}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;

