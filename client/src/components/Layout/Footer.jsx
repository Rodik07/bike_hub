import { Link } from 'react-router-dom';
import {
  FaMotorcycle,
  FaBicycle,
  FaBalanceScale,
  FaMapMarkerAlt,
  FaQuestionCircle,
  FaEnvelope,
  FaInfoCircle
} from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FaMotorcycle className="text-2xl text-primary-400" />
              <h3 className="text-2xl font-bold">BikeHub</h3>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Explore Your Dream Ride - Your one-stop destination for premium motorcycles. Find, compare, and book your perfect bike.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-lg flex items-center space-x-2">
              <FaBicycle className="text-primary-400" />
              <span>Quick Links</span>
            </h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link to="/bikes" className="hover:text-primary-400 transition-colors flex items-center space-x-2">
                  <FaBicycle className="text-sm" />
                  <span>Browse Bikes</span>
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-primary-400 transition-colors flex items-center space-x-2">
                  <FaBalanceScale className="text-sm" />
                  <span>Compare Bikes</span>
                </Link>
              </li>
              <li>
                <Link to="/dealers" className="hover:text-primary-400 transition-colors flex items-center space-x-2">
                  <FaMapMarkerAlt className="text-sm" />
                  <span>Find Dealers</span>
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-lg flex items-center space-x-2">
              <FaQuestionCircle className="text-primary-400" />
              <span>Support</span>
            </h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="#" className="hover:text-primary-400 transition-colors flex items-center space-x-2">
                  <FaQuestionCircle className="text-sm" />
                  <span>Help Center</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-400 transition-colors flex items-center space-x-2">
                  <FaEnvelope className="text-sm" />
                  <span>Contact Us</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary-400 transition-colors flex items-center space-x-2">
                  <FaInfoCircle className="text-sm" />
                  <span>FAQs</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-lg flex items-center space-x-2">
              <FaInfoCircle className="text-primary-400" />
              <span>About</span>
            </h4>
            <p className="text-gray-400 leading-relaxed">
              Your trusted platform for finding and booking motorcycles in Nepal.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              &copy; 2026 BikeHub. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <FaMapMarkerAlt />
              <span>Made in Nepal 🇳🇵</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

