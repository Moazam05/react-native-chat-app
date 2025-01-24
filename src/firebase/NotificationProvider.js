import {useEffect} from 'react';
import messaging from '@react-native-firebase/messaging';
import {useNavigation} from '@react-navigation/native';
import notifee, {EventType} from '@notifee/react-native';

import {createChannel} from './NotificationService';
import {requestUserPermission} from '../utils';
import {handleNotification} from './NotificationHandlers';

const NotificationProvider = ({children}) => {
  const navigation = useNavigation();

  const navigateToChat = chatData => {
    if (!chatData) {
      return;
    }

    navigation.navigate('Chat', {
      userId: chatData.isGroupChat ? null : chatData.userId,
      chatId: chatData.chatId,
      isGroupChat: chatData.isGroupChat,
      chatName: chatData.chatName,
    });
  };

  useEffect(() => {
    const setupNotifications = async () => {
      await createChannel();
      await requestUserPermission();

      // Foreground handler
      const unsubscribeForeground = messaging().onMessage(
        async remoteMessage => {
          console.log('Foreground notification:', remoteMessage);
          await handleNotification(remoteMessage);
        },
      );

      // Background handler
      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Background notification:', remoteMessage);
        if (remoteMessage?.data?.chatData) {
          const chatData = JSON.parse(remoteMessage.data.chatData);
          setTimeout(() => navigateToChat(chatData), 500);
        }
      });

      // Quit state handler
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification?.data?.chatData) {
        console.log('Quit state notification:', initialNotification);
        const chatData = JSON.parse(initialNotification.data.chatData);
        setTimeout(() => navigateToChat(chatData), 1000);
      }

      // Foreground press handler
      notifee.onForegroundEvent(({type, detail}) => {
        if (type === EventType.PRESS && detail.notification?.data?.chatData) {
          const chatData = JSON.parse(detail.notification.data.chatData);
          navigateToChat(chatData);
        }
      });

      return () => unsubscribeForeground();
    };

    setupNotifications();
  }, []);

  return children;
};

export default NotificationProvider;
