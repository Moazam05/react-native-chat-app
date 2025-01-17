// socket.js
import {Platform, AppState} from 'react-native';
import io from 'socket.io-client';
import {ANDROID_SOCKET_URL, IOS_SOCKET_URL} from '@env';

let socket;

export const initiateSocket = user => {
  const SOCKET_URL =
    Platform.OS === 'android' ? ANDROID_SOCKET_URL : IOS_SOCKET_URL;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
    socket.emit('setup', user);
  });

  socket.on('connect_error', error => {
    console.log('Socket connection error:', error);
  });

  // Handle app state changes
  AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'active') {
      // App came to foreground
      if (!socket.connected) {
        socket.connect();
        socket.emit('setup', user);
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
    socket.disconnect();
  }
};

export const getSocket = () => socket;
