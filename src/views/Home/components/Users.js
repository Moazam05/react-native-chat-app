import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import React from 'react';

import useTypedSelector from '../../../hooks/useTypedSelector';
import {selectedUser} from '../../../redux/auth/authSlice';

const Users = ({data, handleUserPress, onlineUsers}) => {
  const currentUser = useTypedSelector(selectedUser);

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
          <Text style={styles.lastSeen}>last seen recently</Text>
        </View>
        <TouchableOpacity style={styles.messageButton}>
          <Text style={styles.messageText}>Message</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderUser}
      keyExtractor={item => item._id}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  userCard: {
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
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
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
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  messageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  messageText: {
    color: '#FF9F0A',
    fontSize: 16,
  },
});

export default Users;
