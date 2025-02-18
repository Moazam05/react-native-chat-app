import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import BottomNav from '../../components/BottomNav';
import {useGetChatQuery} from '../../redux/api/chatApiSlice';
import {useNavigation} from '@react-navigation/native';
import {formatLastSeen, getGroupColor, getInitial} from '../../utils';
import {getSocket, isUserOnline} from '../../socket';
import {SafeAreaView} from 'react-native-safe-area-context';
import useTypedSelector from '../../hooks/useTypedSelector';
import {selectedUser} from '../../redux/auth/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ChatList = () => {
  const socket = getSocket();
  const navigation = useNavigation();
  const currentUser = useTypedSelector(selectedUser);

  const [chats, setChats] = useState([]);
  const [, forceUpdate] = useState({});

  // todo: GET USER ALL CHATS API
  const {
    data,
    isLoading,
    refetch: refetchChat,
  } = useGetChatQuery({
    refetchOnMountOrArgChange: true,
  });
  // Add refetch on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refetchChat();
    });

    return unsubscribe;
  }, [navigation, refetchChat]);

  useEffect(() => {
    if (data?.data?.chats) {
      // Initialize chats with unread counts from API
      setChats(
        data.data.chats.map(chat => ({
          ...chat,
          unreadCount: chat.unreadCount || 0,
        })),
      );
    }
  }, [data]);

  useEffect(() => {
    if (!socket || !currentUser?.data?.user?._id) {
      return;
    }

    // Listen for new messages and updates
    socket.on('chat list update', ({chatId, lastMessage, unreadCount}) => {
      setChats(prevChats =>
        prevChats.map(chat => {
          if (chat._id === chatId) {
            // Only show unread count if the current user is NOT the sender
            const shouldShowCount =
              lastMessage?.sender?._id !== currentUser.data.user._id;
            return {
              ...chat,
              latestMessage: lastMessage,
              unreadCount: shouldShowCount ? unreadCount : 0,
            };
          }
          return chat;
        }),
      );
    });

    // Listen for read messages
    socket.on('messages read', ({chatId, userId}) => {
      setChats(prevChats =>
        prevChats.map(chat =>
          chat._id === chatId ? {...chat, unreadCount: 0} : chat,
        ),
      );
    });

    socket.on('new chat notification', chatData => {
      refetchChat(); // Refetch to get fresh data
    });

    // Request initial chat updates
    socket.emit('get chat updates');

    return () => {
      socket.off('chat list update');
      socket.off('messages read');
      socket.off('new chat notification');
    };
  }, [socket, currentUser]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleOnlineStatusChange = () => {
      forceUpdate({}); // Force re-render when online status changes
    };

    socket.on('user online', handleOnlineStatusChange);
    socket.on('user offline', handleOnlineStatusChange);
    socket.on('online users', handleOnlineStatusChange);

    return () => {
      socket.off('user online', handleOnlineStatusChange);
      socket.off('user offline', handleOnlineStatusChange);
      socket.off('online users', handleOnlineStatusChange);
    };
  }, [socket]);

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No chats found</Text>
    </View>
  );

  const renderChat = ({item}) => {
    const isGroupChat = item.isGroupChat;

    // Handle avatar and user info based on chat type
    const chatInfo = isGroupChat
      ? {
          name: item.chatName,
          initial: getInitial(item.chatName),
          avatar: null,
        }
      : {
          name: item.users[0].username,
          avatar: item.users[0].avatar,
        };

    // Get online status for direct chats only
    const isOnline = !isGroupChat && isUserOnline(item.users[0]._id);
    const lastMessage = item.latestMessage;
    const showUnreadCount =
      lastMessage?.sender?._id !== currentUser?.data?.user?._id &&
      item.unreadCount > 0;

    const handleChatPress = () => {
      navigation.navigate('Chat', {
        userId: isGroupChat ? null : item.users[0]._id,
        chatId: item._id,
        isGroupChat: item.isGroupChat,
        chatName: item.chatName,
      });
    };

    const messageContent =
      lastMessage?.messageType === 'image'
        ? 'Photo'
        : lastMessage?.messageType === 'document'
        ? 'PDF'
        : lastMessage?.content;

    const messageIcon =
      lastMessage?.messageType === 'image' ? (
        <Icon name="image" size={16} color="#666" style={styles.messageIcon} />
      ) : lastMessage?.messageType === 'document' ? (
        <Icon
          name="file-document"
          size={16}
          color="#666"
          style={styles.messageIcon}
        />
      ) : null;

    return (
      <TouchableOpacity style={styles.chatCard} onPress={handleChatPress}>
        <View style={styles.avatarContainer}>
          {isGroupChat ? (
            <View
              style={[
                styles.groupAvatar,
                {backgroundColor: getGroupColor(chatInfo.name)},
              ]}>
              <Text style={styles.groupInitial}>{chatInfo.initial}</Text>
            </View>
          ) : (
            <Image source={{uri: chatInfo.avatar}} style={styles.avatar} />
          )}
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.topRow}>
            <Text style={styles.username}>{chatInfo.name}</Text>
            <Text style={styles.timeStamp}>
              {lastMessage?.createdAt
                ? formatLastSeen(lastMessage?.createdAt)
                : ''}
            </Text>
          </View>
          <View style={styles.bottomRow}>
            {lastMessage ? (
              <View style={styles.messageContainer}>
                <View
                  style={[
                    styles.messageContent,
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                    },
                  ]}>
                  {isGroupChat ? (
                    <Text style={styles.senderName} numberOfLines={1}>
                      {lastMessage.sender.username}:{' '}
                    </Text>
                  ) : lastMessage?.sender?.username !==
                    item.users[0]?.username ? (
                    <Text style={styles.youText}>You: </Text>
                  ) : null}

                  {/* Message with icon */}
                  <View style={styles.messageTextRow}>
                    {messageIcon}
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {messageContent}
                    </Text>
                  </View>
                </View>

                {showUnreadCount && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.noMessage}>No messages yet</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity
          style={styles.groupButton}
          onPress={() => navigation.navigate('CreateGroup')}>
          <Icon name="account-group-outline" size={24} color="#444" />
          <Text style={styles.groupButtonText}>New Group</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9134" />
        </View>
      ) : (
        <FlatList
          data={chats || []}
          renderItem={renderChat}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={styles.listContainer}
          extraData={Date.now()}
        />
      )}

      <View style={styles.bottomNavPadding} />
      <BottomNav />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  groupButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeStamp: {
    fontSize: 12,
    color: '#666',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  noMessage: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  bottomNavPadding: {
    height: Platform.OS === 'ios' ? 88 : 76,
  },
  unreadBadge: {
    backgroundColor: '#FF9134',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  groupAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInitial: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },

  messageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageContent: {
    flex: 1,
  },
  messageTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    marginRight: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  senderName: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  youText: {
    fontSize: 12,
    color: '#FF9134',
    fontWeight: '500',
  },
});

export default ChatList;
