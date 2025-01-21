import {PermissionsAndroid, Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';

export function formatLastSeen(lastSeen) {
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);

  // Check if lastSeen is from today
  const isToday = lastSeenDate.toDateString() === now.toDateString();

  // Check if lastSeen is from yesterday
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = lastSeenDate.toDateString() === yesterday.toDateString();

  if (isToday) {
    // Return time in 12-hour format with AM/PM
    return lastSeenDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (isYesterday) {
    return 'Yesterday';
  } else {
    // Return date in DD/MM/YYYY format
    const day = String(lastSeenDate.getDate()).padStart(2, '0');
    const month = String(lastSeenDate.getMonth() + 1).padStart(2, '0');
    const year = lastSeenDate.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

export const getGroupColor = name => {
  if (!name) {
    return;
  }

  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEEAD',
    '#FF9F1C',
    '#2AB7CA',
    '#FED766',
    '#7768AE',
    '#82D173',
  ];
  const index = name?.length % colors?.length;
  return colors[index];
};

export const getInitial = name => {
  if (!name) {
    return;
  }
  return name
    ?.replace(
      /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2702-\u27B0]|[\uF680-\uF6C0]|[\u24C2-\uF251]/g,
      '',
    )
    ?.trim()[0];
};

export const requestUserPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Android Notification permission granted');
          const token = await messaging().getToken();
          console.log('Android FCM Token:', token);
          return token;
        } else {
          console.log('Android Notification permission denied');
        }
      } else {
        // For Android < 13, permissions are granted during installation
        const token = await messaging().getToken();
        console.log('Android FCM Token:', token);
        return token;
      }
    }
  } catch (error) {
    console.log('Permission request error:', error);
  }
};
