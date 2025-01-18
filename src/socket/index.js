import {Platform, AppState} from 'react-native';
import io from 'socket.io-client';
import {ANDROID_SOCKET_URL, IOS_SOCKET_URL} from '@env';

let socket;
let appStateSubscription;
let onlineUsers = new Set();

export const initiateSocket = user => {
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
    socket.emit('get online users');
  });

  // Add these handlers for online users
  socket.on('user online', userId => {
    // console.log('User online:', userId);
    onlineUsers.add(userId);
    // console.log('Current online users:', Array.from(onlineUsers));
  });

  socket.on('user offline', userId => {
    // console.log('User offline:', userId);
    onlineUsers.delete(userId);
    // console.log('Current online users:', Array.from(onlineUsers));
  });

  socket.on('online users', users => {
    // console.log('Received online users:', users);
    onlineUsers = new Set(users);
    // console.log('Updated online users:', Array.from(onlineUsers));
  });

  appStateSubscription = AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'active') {
      if (!socket.connected) {
        socket.connect();
        socket.emit('setup', user);
        socket.emit('get online users');
      }
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      socket.emit('app background');
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.emit('user offline');
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    onlineUsers.clear();
  }

  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
};

export const getSocket = () => socket;
export const getOnlineUsers = () => Array.from(onlineUsers);
