import {SOCKET_URL} from '@env';

import io from 'socket.io-client';

let socket;

export const initiateSocket = user => {
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
  if (socket) socket.disconnect();
};

export const getSocket = () => socket;
