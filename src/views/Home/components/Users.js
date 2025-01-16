import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useNavigation} from '@react-navigation/native';

import {getSocket} from '../../../socket';
import {useGetAllUsersQuery} from '../../../redux/api/userApiSlice';
import useTypedSelector from '../../../hooks/useTypedSelector';
import {selectedUser} from '../../../redux/auth/authSlice';

const Users = () => {
  const navigation = useNavigation();

  const currentUser = useTypedSelector(selectedUser);

  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // todo: Fetch all users
  const {data, isLoading} = useGetAllUsersQuery({});

  // Handle socket events for online status
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('user online', userId => {
        // console.log('User Online:', userId);
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      socket.on('user offline', userId => {
        // console.log('User Offline:', userId);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      return () => {
        socket.off('user online');
        socket.off('user offline');
      };
    }
  }, []);

  const handleUserPress = userId => {
    const socket = getSocket();
    if (socket) {
      socket.emit('join chat', userId);
    }
    navigation.navigate('Chat', {userId});
  };

  const renderUser = ({item}) => {
    if (item._id === currentUser?.data?.user?._id) {
      return null;
    }

    const isOnline = onlineUsers.has(item._id) || item.isOnline;

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
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9F0A" />
      </View>
    );
  }

  return (
    <FlatList
      data={data?.users || []}
      renderItem={renderUser}
      keyExtractor={item => item._id}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
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
