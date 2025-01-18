import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';

import {getSocket, isUserOnline} from '../../../socket';
import {useGetAllUsersQuery} from '../../../redux/api/userApiSlice';
import useTypedSelector from '../../../hooks/useTypedSelector';
import {selectedUser} from '../../../redux/auth/authSlice';
import {useCreateChatMutation} from '../../../redux/api/chatApiSlice';
import Toast from 'react-native-toast-message';

const Users = () => {
  const navigation = useNavigation();
  const currentUser = useTypedSelector(selectedUser);
  const {data, isLoading} = useGetAllUsersQuery({});
  const [createChat] = useCreateChatMutation();
  const [, forceUpdate] = useState({});

  // Handle socket events for online status updates
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      // Request initial online users
      socket.emit('get online users');

      // Set up event listeners
      const handleOnlineUpdate = () => {
        forceUpdate({});
      };

      socket.on('user online', handleOnlineUpdate);
      socket.on('user offline', handleOnlineUpdate);
      socket.on('online users', handleOnlineUpdate);

      return () => {
        socket.off('user online', handleOnlineUpdate);
        socket.off('user offline', handleOnlineUpdate);
        socket.off('online users', handleOnlineUpdate);
      };
    }
  }, []);

  const handleUserPress = async userId => {
    const socket = getSocket();
    if (!socket?.connected) {
      Toast.show({
        type: 'error',
        text2: 'Connection lost. Please try again.',
      });
      return;
    }

    try {
      const chat = await createChat({userId});

      if (chat?.data?.status) {
        socket.emit('join chat', userId);
        navigation.navigate('Chat', {
          chatId: chat?.data?.data?.chat?._id,
          userId,
        });
      }

      if (chat?.error) {
        Toast.show({
          type: 'error',
          text2: chat?.error?.data?.message || 'Chat creation failed',
        });
      }
    } catch (error) {
      console.error('Create Chat Error:', error);
      Toast.show({
        type: 'error',
        text2: 'Something went wrong',
      });
    }
  };

  const renderUser = useCallback(
    ({item}) => {
      if (item._id === currentUser?.data?.user?._id) {
        return null;
      }

      const isOnline = isUserOnline(item._id);

      return (
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => handleUserPress(item._id)}>
          <View style={styles.avatarContainer}>
            <Image source={{uri: item.avatar}} style={styles.avatar} />
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.lastSeen}>{item.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => handleUserPress(item._id)}>
            <Text style={styles.messageText}>Message</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [currentUser?.data?.user?._id],
  );

  return (
    <View style={styles.wrap}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9F0A" />
        </View>
      ) : (
        <FlatList
          data={data?.users || []}
          renderItem={renderUser}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          extraData={Date.now()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 28,
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
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  lastSeen: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  messageButton: {
    padding: 8,
  },
  messageText: {
    color: '#FF9F0A',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default Users;
