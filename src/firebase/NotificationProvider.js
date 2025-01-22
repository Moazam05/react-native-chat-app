import {ANDROID_API_URL} from '@env';
import {useEffect} from 'react';
import {Platform, PermissionsAndroid} from 'react-native';
import messaging from '@react-native-firebase/messaging';

import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
} from '@notifee/react-native';
import {useNavigation} from '@react-navigation/native';
import useTypedSelector from '../hooks/useTypedSelector';
import {selectedUser} from '../redux/auth/authSlice';

const NotificationProvider = ({children}) => {
  const navigation = useNavigation();
  const currentUser = useTypedSelector(selectedUser);

  // Create notification channel
  const createChannel = async () => {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'chat_messages',
        name: 'Chat Messages',
        sound: 'default',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        vibration: true,
        lights: true,
      });
    }
  };

  const handleNotification = async remoteMessage => {
    try {
      const channelId = 'chat_messages';
      const chatData = remoteMessage.data?.chatData
        ? JSON.parse(remoteMessage.data.chatData)
        : null;

      // Get existing notifications for this chat
      const notifications = await notifee.getDisplayedNotifications();
      const existingNotification = notifications.find(
        n =>
          n.notification.data?.chatData &&
          JSON.parse(n.notification.data.chatData).chatId === chatData?.chatId,
      );

      if (existingNotification) {
        // Update existing notification with new message
        const oldMessages =
          existingNotification.notification.android.style.messages || [];
        const newMessage = {
          text: remoteMessage.notification?.body || '',
          timestamp: Date.now(),
        };

        await notifee.displayNotification({
          id: existingNotification.id,
          title: remoteMessage.notification?.title,
          data: chatData ? {chatData: JSON.stringify(chatData)} : {},
          android: {
            channelId,
            smallIcon: 'ic_launcher',
            largeIcon: remoteMessage.data?.senderAvatar,
            style: {
              type: AndroidStyle.MESSAGING,
              person: {
                name: remoteMessage.notification?.title || 'User',
                icon: remoteMessage.data?.senderAvatar,
              },
              messages: [...oldMessages, newMessage],
            },
            groupId: chatData?.chatId,
            groupSummary: true,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
          },
        });
      } else {
        // Create new notification
        await notifee.displayNotification({
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          data: chatData ? {chatData: JSON.stringify(chatData)} : {},
          android: {
            channelId,
            smallIcon: 'ic_launcher',
            largeIcon: remoteMessage.data?.senderAvatar,
            style: {
              type: AndroidStyle.MESSAGING,
              person: {
                name: remoteMessage.notification?.title || 'User',
                icon: remoteMessage.data?.senderAvatar,
              },
              messages: [
                {
                  text: remoteMessage.notification?.body || '',
                  timestamp: Date.now(),
                },
              ],
            },
            groupId: chatData?.chatId,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            importance: AndroidImportance.HIGH,
            visibility: AndroidVisibility.PUBLIC,
          },
        });
      }
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
  };

  const requestUserPermission = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          const token = await messaging().getToken();
          // Here you would send this token to your backend
          updateFcmToken(token);
        }
      } else {
        const token = await messaging().getToken();
        updateFcmToken(token);
      }
    }
  };

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

  useEffect(() => {
    createChannel();
    requestUserPermission();

    // Handle foreground messages
    const unsubscribeForeground = messaging().onMessage(handleNotification);

    // Handle background notification taps
    messaging().onNotificationOpenedApp(remoteMessage => {
      if (remoteMessage.data?.chatData) {
        const chatData = JSON.parse(remoteMessage.data.chatData);
        navigation.navigate('Chat', chatData);
      }
    });

    // Check if app was opened from quit state by notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage?.data?.chatData) {
          const chatData = JSON.parse(remoteMessage.data.chatData);
          // Add slight delay to ensure navigation is ready
          setTimeout(() => {
            navigation.navigate('Chat', chatData);
          }, 1000);
        }
      });

    // Handle FCM token refresh
    messaging().onTokenRefresh(token => {
      updateFcmToken(token);
    });

    return () => {
      unsubscribeForeground();
    };
  }, [navigation]);

  return children;
};

export default NotificationProvider;
