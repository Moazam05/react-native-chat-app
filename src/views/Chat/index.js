import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import BottomNav from '../../components/BottomNav';
import {useGetChatQuery} from '../../redux/api/chatApiSlice';
import {useNavigation} from '@react-navigation/native';
import {formatLastSeen} from '../../utils';
import {getSocket} from '../../socket';

const ChatList = () => {
  const navigation = useNavigation();
  const [chats, setChats] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({}); // Store unread counts by chatId
  const socketRef = useRef(null);

  // todo: GET USER ALL CHATS API
  const {data, isLoading} = useGetChatQuery({});

  useEffect(() => {
    if (data?.data?.chats) {
      setChats(data.data.chats);
    }
  }, [data]);

  // Socket setup
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socketRef.current = socket;

      // Listen for chat list updates
      socket.on('chat list update', ({chatId, lastMessage, unreadCount}) => {
        setChats(prevChats =>
          prevChats.map(chat => {
            if (chat._id === chatId) {
              return {
                ...chat,
                latestMessage: lastMessage,
                unreadCount: (chat.unreadCount || 0) + unreadCount,
              };
            }
            return chat;
          }),
        );

        // Update unread counts
        setUnreadCounts(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + unreadCount,
        }));
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('chat list update');
      }
    };
  }, []);

  const renderChat = ({item}) => {
    const otherUser = item.users[0];
    const isOnline = otherUser.isOnline;
    const lastMessage = item.latestMessage;
    const unreadCount = unreadCounts[item._id] || 0;

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
                  {lastMessage.sender.username === otherUser.username ? (
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
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{unreadCount}</Text>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
