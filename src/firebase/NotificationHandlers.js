import notifee, {AndroidStyle} from '@notifee/react-native';
import {processAvatarImage} from './NotificationService';
import {store} from '../redux/store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {initiateSocket, getSocket} from '../socket';

let quitStateNavigationData = null;
let reconnectionTimeout = null;

export const setQuitStateNavigation = data => {
  quitStateNavigationData = data;
};

export const getQuitStateNavigation = () => {
  const data = quitStateNavigationData;
  quitStateNavigationData = null;
  return data;
};

const handleSocketReconnection = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const socket = getSocket();

      if (!socket?.connected && user) {
        console.log('Reconnecting socket from notification handler');
        if (reconnectionTimeout) {
          clearTimeout(reconnectionTimeout);
        }

        // Delay socket reconnection to ensure proper state
        reconnectionTimeout = setTimeout(async () => {
          const currentSocket = getSocket();
          if (!currentSocket?.connected) {
            await initiateSocket(user);
          }
        }, 1000);

        return new Promise(resolve => {
          if (socket) {
            socket.once('connect', () => {
              resolve();
            });
          } else {
            resolve();
          }
        });
      }
    }
  } catch (error) {
    console.error('Socket reconnection error:', error);
  }
};

export const handleNotification = async remoteMessage => {
  try {
    const channelId = 'chat_messages';
    const chatData = remoteMessage.data?.chatData
      ? JSON.parse(remoteMessage.data.chatData)
      : null;

    // Manage socket connection based on app state
    if (remoteMessage.from === 'background' || !store.getState().auth?.token) {
      await handleSocketReconnection();
    }

    // Persist navigation data for killed state
    if (!store.getState().auth?.token && chatData) {
      setQuitStateNavigation(chatData);
      await AsyncStorage.setItem(
        'lastNotificationData',
        JSON.stringify(chatData),
      );
      await AsyncStorage.setItem(
        'lastNotificationTimestamp',
        Date.now().toString(),
      );
    }

    const isGroupChat = chatData?.isGroupChat || false;
    const chatTitle =
      chatData?.chatName ||
      remoteMessage.notification?.title ||
      'Unknown Sender';

    // Group messages by sender
    const notifications = await notifee.getDisplayedNotifications();
    const existingNotification = notifications.find(
      n =>
        n.notification.data?.chatData &&
        JSON.parse(n.notification.data.chatData).userId === chatData?.userId,
    );

    let avatarIcon = isGroupChat
      ? await processAvatarImage(
          `https://ui-avatars.com/api/?name=${chatTitle
            ?.charAt(0)
            ?.toUpperCase()}&background=4A90E2&color=fff&size=64`,
        )
      : remoteMessage.data?.senderAvatar
      ? await processAvatarImage(remoteMessage.data.senderAvatar)
      : null;

    if (existingNotification) {
      const existingMessages =
        existingNotification.notification.android.style.messages || [];

      await notifee.displayNotification({
        id: existingNotification.id,
        title: chatTitle,
        data: chatData
          ? {
              chatData: JSON.stringify(chatData),
              timestamp: Date.now().toString(),
            }
          : {},
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          largeIcon: avatarIcon
            ? 'data:image/png;base64,' + avatarIcon
            : 'ic_launcher',
          style: {
            type: AndroidStyle.MESSAGING,
            person: {
              name: chatTitle || 'User',
              icon: avatarIcon
                ? 'data:image/png;base64,' + avatarIcon
                : 'ic_launcher',
            },
            messages: [
              ...existingMessages,
              {
                text:
                  remoteMessage.data?.body ||
                  remoteMessage.notification?.body ||
                  'New message',
                timestamp: Date.now(),
              },
            ],
          },
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
      });
    } else {
      await notifee.displayNotification({
        title: chatTitle,
        data: chatData
          ? {
              chatData: JSON.stringify(chatData),
              timestamp: Date.now().toString(),
            }
          : {},
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          largeIcon: avatarIcon
            ? 'data:image/png;base64,' + avatarIcon
            : 'ic_launcher',
          style: {
            type: AndroidStyle.MESSAGING,
            person: {
              name: chatTitle || 'User',
              icon: avatarIcon
                ? 'data:image/png;base64,' + avatarIcon
                : 'ic_launcher',
            },
            messages: [
              {
                text:
                  remoteMessage.data?.body ||
                  remoteMessage.notification?.body ||
                  'New message',
                timestamp: Date.now(),
              },
            ],
          },
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
        },
      });
    }

    return chatData;
  } catch (error) {
    console.error('Error handling notification:', error);
  } finally {
    if (reconnectionTimeout) {
      clearTimeout(reconnectionTimeout);
      reconnectionTimeout = null;
    }
  }
};
