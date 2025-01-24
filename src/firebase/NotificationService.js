import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
} from '@notifee/react-native';

export const processAvatarImage = async imageUrl => {
  try {
    if (!imageUrl) {
      return null;
    }
    const downloadPath = `${RNFS.CachesDirectoryPath}/temp_avatar.jpg`;

    await RNFS.downloadFile({
      fromUrl: imageUrl.replace('/upload/', '/upload/w_64,h_64,c_fill,g_face/'),
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

export const createChannel = async () => {
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

export const showLoginNotification = async () => {
  const channelId = await notifee.createChannel({
    id: 'login_status',
    name: 'Login Status',
    sound: 'default',
    importance: AndroidImportance.DEFAULT,
    vibration: true,
    lights: true,
  });

  const notificationText =
    'Dear User, you have successfully logged in to ChatApp. Your account security is our top priority.';

  await notifee.displayNotification({
    id: 'login_alert',
    title: 'ChatApp - Login Alert',
    body: notificationText,
    android: {
      channelId,
      importance: AndroidImportance.DEFAULT,
      largeIcon: 'ic_launcher',
      style: {
        type: AndroidStyle.BIGTEXT,
        text: notificationText,
      },
      timestamp: Date.now(),
      showTimestamp: true,
      pressAction: {
        id: 'default',
      },
      lightUpScreen: true,
    },
    ios: {
      categoryId: 'alert',
      foregroundPresentationOptions: {
        badge: true,
        sound: true,
        banner: true,
        list: true,
      },
    },
  });
};
