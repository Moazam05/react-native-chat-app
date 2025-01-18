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
import {formatLastSeen} from '../../utils';
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

  const renderChat = ({item}) => {
    const otherUser = item.users[0];
    const isOnline = isUserOnline(otherUser._id);
    const lastMessage = item.latestMessage;
    // Only show unread count if the current user is NOT the sender of the last message
    const showUnreadCount =
      lastMessage?.sender?._id !== currentUser?.data?.user?._id &&
      item.unreadCount > 0;

    const handleChatPress = () => {
      navigation.navigate('Chat', {userId: otherUser._id, chatId: item._id});
    };

    return (
      <TouchableOpacity style={styles.chatCard} onPress={handleChatPress}>
        <View style={styles.avatarContainer}>
          <Image source={{uri: otherUser.avatar}} style={styles.avatar} />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.topRow}>
            <Text style={styles.username}>{otherUser.username}</Text>
            <Text style={styles.timeStamp}>
              {formatLastSeen(lastMessage?.createdAt)}
            </Text>
          </View>
          <View style={styles.bottomRow}>
            {lastMessage ? (
              <>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={styles.messageContainer}>
                  {lastMessage?.sender?.username === otherUser?.username ? (
                    <Text style={styles.lastMessage}>
                      {lastMessage.content}
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.youText}>You: </Text>
                      <Text style={styles.lastMessage}>
                        {lastMessage.content}
                      </Text>
                    </>
                  )}
                </Text>
                {showUnreadCount && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.noMessage}>No messages yet</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No chats found</Text>
    </View>
  );

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
          <ActivityIndicator size="large" color="#FF9F0A" />
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
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  youText: {
    fontSize: 12,
    color: '#FF9F0A',
    fontWeight: '500',
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
    backgroundColor: '#FF9F0A',
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
  messageContainer: {
    flex: 1,
  },
});

export default ChatList;
