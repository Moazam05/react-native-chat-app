import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import {handleNotification} from './src/firebase/NotificationHandlers';

// Handle background messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  await handleNotification(remoteMessage);
});

// Handle notification background events
notifee.onBackgroundEvent(async ({type, detail}) => {
  const {notification} = detail;
  if (notification?.data?.chatData) {
    // Return a promise to keep the background event alive
    return Promise.resolve();
  }
});

AppRegistry.registerComponent(appName, () => App);
