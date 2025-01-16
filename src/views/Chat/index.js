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
import React from 'react';
import BottomNav from '../../components/BottomNav';
import {useGetChatQuery} from '../../redux/api/chatApiSlice';
import {useNavigation} from '@react-navigation/native';
import {formatLastSeen} from '../../utils';

const ChatList = () => {
  const navigation = useNavigation();

  // todo: GET USER ALL CHATS API
  const {data, isLoading} = useGetChatQuery({});

  const renderChat = ({item}) => {
    const otherUser = item.users[0];
    const isOnline = otherUser.isOnline;
    const lastMessage = item.latestMessage;

    const handleChatPress = () => {
      navigation.navigate('Chat', {userId: otherUser._id});
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
              {formatLastSeen(otherUser.lastSeen)}
            </Text>
          </View>
          <View style={styles.bottomRow}>
            {lastMessage ? (
              <Text numberOfLines={1} ellipsizeMode="tail">
                {lastMessage.sender.username === otherUser.username ? (
                  <Text style={styles.lastMessage}>{lastMessage.content}</Text>
                ) : (
                  <>
                    <Text style={styles.youText}>You: </Text>
                    <Text style={styles.lastMessage}>
                      {lastMessage.content}
                    </Text>
                  </>
                )}
              </Text>
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
          data={data?.data?.chats || []}
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
});

export default ChatList;
