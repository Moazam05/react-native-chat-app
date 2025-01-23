import notifee, {AndroidStyle} from '@notifee/react-native';
import {processAvatarImage} from './NotificationService';

export const handleNotification = async remoteMessage => {
  try {
    const channelId = 'chat_messages';
    const chatData = remoteMessage.data?.chatData
      ? JSON.parse(remoteMessage.data.chatData)
      : null;
    const isGroupChat = chatData?.isGroupChat;
    const chatTitle = remoteMessage.notification?.title;
    const notifications = await notifee.getDisplayedNotifications();

    // Find existing notification from the same user
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
        data: chatData ? {chatData: JSON.stringify(chatData)} : {},
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
                text: remoteMessage.notification?.body || '',
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
        data: chatData ? {chatData: JSON.stringify(chatData)} : {},
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
                text: remoteMessage.notification?.body || '',
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
  } catch (error) {
    console.error('Error handling notification:', error);
  }
};
