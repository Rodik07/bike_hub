import { createContext, useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Connect to Socket.IO
      const newSocket = io(window.location.origin, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('🔌 Socket connected');
      });

      newSocket.on('new_message', () => {
        // Increment unread count on new message
        setUnreadCount(prev => prev + 1);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Fetch initial unread count
      fetchUnreadCount();

      return () => {
        newSocket.disconnect();
        socketRef.current = null;
        setSocket(null);
      };
    } else {
      // Disconnect on logout
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      setUnreadCount(0);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await axios.get('/api/chat/unread-count');
      setUnreadCount(data.unreadCount);
    } catch {
      // Silently fail
    }
  };

  const markRead = async (otherUserId) => {
    try {
      await axios.put(`/api/chat/read/${otherUserId}`);
      fetchUnreadCount();
    } catch {
      // Silently fail
    }
  };

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount, fetchUnreadCount, markRead }}>
      {children}
    </SocketContext.Provider>
  );
};
