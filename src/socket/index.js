import {Platform, AppState} from 'react-native';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ANDROID_SOCKET_URL, IOS_SOCKET_URL} from '@env';

let socket;
let appStateSubscription;
let onlineUsers = new Set();
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000;
const BACKGROUND_TIMEOUT = 300000; // 5 minutes
let backgroundTimer = null;

const setupReconnection = async user => {
  if (reconnectTimer) {
    clearInterval(reconnectTimer);
  }
  if (backgroundTimer) {
    clearTimeout(backgroundTimer);
  }

  reconnectTimer = setInterval(async () => {
    if (!socket?.connected && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      await reconnectSocket(user);
      reconnectAttempts++;
    } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      clearInterval(reconnectTimer);
      // Try to restore from storage
      const storedUser = await AsyncStorage.getItem('socketUser');
      if (storedUser) {
        reconnectAttempts = 0;
        await reconnectSocket(JSON.parse(storedUser));
      }
    }
  }, RECONNECT_INTERVAL);
};

const reconnectSocket = async user => {
  try {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    const SOCKET_URL =
      Platform.OS === 'android' ? ANDROID_SOCKET_URL : IOS_SOCKET_URL;

    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
      auth: {userId: user._id},
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('Reconnected to socket server');
      socket.emit('setup', user);
      reconnectAttempts = 0;
      if (reconnectTimer) {
        clearInterval(reconnectTimer);
      }
    });

    setupSocketListeners(socket, user);
    socket.connect();
  } catch (error) {
    console.error('Socket reconnection error:', error);
  }
};

const setupSocketListeners = (socket, user) => {
  socket.on('user online', userId => {
    onlineUsers.add(userId);
  });

  socket.on('user offline', userId => {
    onlineUsers.delete(userId);
  });

  socket.on('online users', users => {
    onlineUsers = new Set(users);
  });

  socket.on('disconnect', reason => {
    console.log('Socket disconnected:', reason);
    if (reason === 'io server disconnect' || reason === 'transport close') {
      setupReconnection(user);
    }
  });

  socket.on('connect_error', error => {
    console.log('Connection error:', error);
    setupReconnection(user);
  });

  // Add heartbeat
  const heartbeat = setInterval(() => {
    if (socket?.connected) {
      socket.emit('heartbeat');
    }
  }, 30000);

  socket.on('close', () => clearInterval(heartbeat));
};

export const initiateSocket = async user => {
  try {
    if (socket) {
      await new Promise(resolve => {
        socket.emit('user offline');
        socket.disconnect();
        resolve();
      });
    }

    if (appStateSubscription) {
      appStateSubscription.remove();
    }

    const SOCKET_URL =
      Platform.OS === 'android' ? ANDROID_SOCKET_URL : IOS_SOCKET_URL;

    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
      auth: {userId: user._id},
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('setup', user);
      AsyncStorage.setItem('socketUser', JSON.stringify(user));
    });

    setupSocketListeners(socket, user);

    appStateSubscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (nextAppState === 'active') {
          if (backgroundTimer) {
            clearTimeout(backgroundTimer);
            backgroundTimer = null;
          }
          if (!socket?.connected) {
            const storedUser = await AsyncStorage.getItem('socketUser');
            if (storedUser) {
              await reconnectSocket(JSON.parse(storedUser));
            }
          }
        } else if (
          nextAppState === 'background' ||
          nextAppState === 'inactive'
        ) {
          socket.emit('app background');
          backgroundTimer = setTimeout(() => {
            if (socket?.connected) {
              socket.disconnect();
            }
          }, BACKGROUND_TIMEOUT);
        }
      },
    );

    socket.connect();
    return socket;
  } catch (error) {
    console.error('Socket initialization error:', error);
    throw error;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.emit('user offline');
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    onlineUsers.clear();
  }

  if (reconnectTimer) {
    clearInterval(reconnectTimer);
    reconnectTimer = null;
  }

  if (backgroundTimer) {
    clearTimeout(backgroundTimer);
    backgroundTimer = null;
  }

  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }

  AsyncStorage.removeItem('socketUser');
};

export const isUserOnline = userId => onlineUsers.has(userId);
export const getSocket = () => socket;
export const getOnlineUsers = () => Array.from(onlineUsers);
