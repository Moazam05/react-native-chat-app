import {ANDROID_API_URL} from '@env';
import {useEffect} from 'react';
import {Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import RNFS from 'react-native-fs';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
} from '@notifee/react-native';
import {useNavigation} from '@react-navigation/native';

import useTypedSelector from '../hooks/useTypedSelector';
import {selectedUser} from '../redux/auth/authSlice';
import {requestUserPermission} from '../utils';

console.log('ANDROID_API_URL:', ANDROID_API_URL);

const processAvatarImage = async imageUrl => {
  try {
    const downloadPath = `${RNFS.CachesDirectoryPath}/temp_avatar.jpg`;

    await RNFS.downloadFile({
      fromUrl: imageUrl.replace('/upload/', '/upload/w_64,h_64,c_fill,g_face/'), // Use Cloudinary transformations
      toFile: downloadPath,
    }).promise;

    const imageBitmap = await RNFS.readFile(downloadPath, 'base64');
    await RNFS.unlink(downloadPath);
    return imageBitmap;
  } catch (err) {
    console.error('Error processing avatar image:', err);
    return null;
  }
};

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

      const notifications = await notifee.getDisplayedNotifications();
      const existingNotification = notifications.find(
        n =>
          n.notification.data?.chatData &&
          JSON.parse(n.notification.data.chatData).chatId === chatData?.chatId,
      );

      const imageBitmap = await getLargeIcon(remoteMessage.data?.senderAvatar);

      const baseNotification = {
        title: remoteMessage.notification?.title,
        data: chatData ? {chatData: JSON.stringify(chatData)} : {},
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          largeIcon: imageBitmap
            ? 'data:image/png;base64,' + imageBitmap
            : 'ic_launcher',
          style: {
            type: AndroidStyle.MESSAGING,
            person: {
              name: remoteMessage.notification?.title || 'User',
              icon: imageBitmap
                ? 'data:image/png;base64,' + imageBitmap
                : 'ic_launcher',
            },
          },
          groupId: chatData?.chatId,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
        },
      };

      if (existingNotification) {
        baseNotification.id = existingNotification.id;
        baseNotification.android.style.messages = [
          ...(existingNotification.notification.android.style.messages || []),
          {
            text: remoteMessage.notification?.body || '',
            timestamp: Date.now(),
          },
        ];
        baseNotification.android.groupSummary = true;
      } else {
        baseNotification.body = remoteMessage.notification?.body;
        baseNotification.android.style.messages = [
          {
            text: remoteMessage.notification?.body || '',
            timestamp: Date.now(),
          },
        ];
      }

      await notifee.displayNotification(baseNotification);
    } catch (error) {
      console.error('Error displaying notification:', error);
    }
  };

  const getLargeIcon = async iconUri => {
    try {
      return iconUri ? await processAvatarImage(iconUri) : null;
    } catch (err) {
      console.warn('Error processing senderAvatar:', err);
      return null;
    }
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
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification received:', remoteMessage);
      await handleNotification(remoteMessage);
    });

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
          setTimeout(() => {
            navigation.navigate('Chat', chatData);
          }, 1000);
        }
      });

    // Handle FCM token refresh
    messaging().onTokenRefresh(token => {
      if (currentUser?.token) {
        updateFcmToken(token);
      }
    });

    return () => {
      unsubscribeForeground();
    };
  }, [navigation]);

  return children;
};

export default NotificationProvider;
