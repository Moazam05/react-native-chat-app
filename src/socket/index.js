import {ANDROID_SOCKET_URL, IOS_SOCKET_URL} from '@env';
import {Platform} from 'react-native';
import io from 'socket.io-client';

console.log('ANDROID_SOCKET_URL:', ANDROID_SOCKET_URL);

let socket;

export const initiateSocket = user => {
  const SOCKET_URL =
    Platform.OS === 'android' ? ANDROID_SOCKET_URL : IOS_SOCKET_URL;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
    // Setup user's room
    socket.emit('setup', user);
  });

  socket.on('connect_error', error => {
    console.log('Socket connection error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export const getSocket = () => socket;
