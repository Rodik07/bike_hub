import toast from 'react-hot-toast';

// Simple de-duplication for toasts so the same message
// is not shown multiple times in quick succession.
let lastKey = null;
let lastShownAt = 0;
const DEDUPE_WINDOW_MS = 1500;

const shouldSkip = (type, message) => {
  const key = `${type}:${message}`;
  const now = Date.now();
  if (key === lastKey && now - lastShownAt < DEDUPE_WINDOW_MS) {
    return true;
  }
  lastKey = key;
  lastShownAt = now;
  return false;
};

export const showSuccessToast = (message, options) => {
  if (shouldSkip('success', message)) return;
  return toast.success(message, options);
};

export const showErrorToast = (message, options) => {
  if (shouldSkip('error', message)) return;
  return toast.error(message, options);
};

export const showInfoToast = (message, options) => {
  if (shouldSkip('info', message)) return;
  return toast(message, options);
};

