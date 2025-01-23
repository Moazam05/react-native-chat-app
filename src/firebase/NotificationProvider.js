import {ANDROID_API_URL} from '@env';
import {useEffect} from 'react';
import messaging from '@react-native-firebase/messaging';
import {useNavigation} from '@react-navigation/native';
import useTypedSelector from '../hooks/useTypedSelector';
import {selectedUser} from '../redux/auth/authSlice';
import {requestUserPermission} from '../utils';
import {createChannel} from './NotificationService';
import {handleNotification} from './NotificationHandlers';

const NotificationProvider = ({children}) => {
  const navigation = useNavigation();
  const currentUser = useTypedSelector(selectedUser);

  const updateFcmToken = async token => {
    try {
      const response = await fetch(`${ANDROID_API_URL}users/update-fcm-token`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser?.token}`,
        },
        body: JSON.stringify({fcmToken: token}),
      });
      const data = await response.json();
      console.log('FCM token updated:', data);
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  };

  const navigateToChat = chatData => {
    const updateData = {
      userId: chatData?.isGroupChat ? null : chatData?.userId,
      chatId: chatData?.chatId,
      isGroupChat: chatData?.isGroupChat,
      chatName: chatData?.chatName,
    };
    navigation.navigate('Chat', updateData);
  };

  useEffect(() => {
    const getFcmToken = async () => {
      const token = await requestUserPermission();
      if (token) {
        updateFcmToken(token);
      }
    };
    getFcmToken();
  }, []);

  useEffect(() => {
    createChannel();
    requestUserPermission();

    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);
      await handleNotification(remoteMessage);
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage.data?.chatData) {
        const chatData = JSON.parse(remoteMessage.data.chatData);
        navigateToChat(chatData);
      }
    });

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage?.data?.chatData) {
          const chatData = JSON.parse(remoteMessage.data.chatData);
          setTimeout(() => navigateToChat(chatData), 1000);
        }
      });

    messaging().onTokenRefresh(token => {
      if (currentUser?.token) {
        updateFcmToken(token);
      }
    });

    messaging().setBackgroundMessageHandler(handleNotification);

    return () => unsubscribeForeground();
  }, [navigation]);

  return children;
};

export default NotificationProvider;
