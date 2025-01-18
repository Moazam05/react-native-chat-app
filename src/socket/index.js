import {Platform, AppState} from 'react-native';
import io from 'socket.io-client';
import {ANDROID_SOCKET_URL, IOS_SOCKET_URL} from '@env';

let socket;
let appStateSubscription;

export const initiateSocket = user => {
  // Clean up existing socket and subscription
  if (socket) {
    socket.emit('user offline');
    socket.disconnect();
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
    auth: {
      userId: user._id,
    },
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
    socket.emit('setup', user);
    // Request online users after setup
    socket.emit('get online users');
  });

  socket.on('reconnect', () => {
    console.log('Reconnected to socket server');
    socket.emit('setup', user);
    socket.emit('get online users');
  });

  socket.on('connect_error', error => {
    console.log('Socket connection error:', error);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  // Handle app state changes with proper reference cleanup
  appStateSubscription = AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'active') {
      // App came to foreground
      if (!socket.connected) {
        socket.connect();
        socket.emit('setup', user);
        socket.emit('get online users');
      }
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background
      socket.emit('app background');
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    // Emit offline status before disconnecting
    socket.emit('user offline');
    // Remove all listeners to prevent memory leaks
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  // Clean up AppState event listener
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
};

export const getSocket = () => socket;
