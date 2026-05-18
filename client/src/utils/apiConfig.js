/**
 * API Configuration Utility
 * Centralized API base URL configuration
 */

export const getApiBaseUrl = () => {
  // In development, use relative URLs (proxy handles it)
  // In production, use environment variable or default to HTTPS
  if (import.meta.env.MODE === 'development') {
    return ''; // Empty string means relative URLs (uses Vite proxy)
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5001';
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';

  // If imagePath already includes http/https, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // In development, use relative URLs (proxy handles it)
  // In production, construct full URL
  if (import.meta.env.MODE === 'development') {
    return imagePath; // Relative path, proxy will handle
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  return `${apiUrl}${imagePath}`;
};

export default {
  getApiBaseUrl,
  getImageUrl
};
