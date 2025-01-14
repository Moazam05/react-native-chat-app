import {View, Text, StyleSheet, Image} from 'react-native';
import React from 'react';

const ChatHeader = ({chatUser, isUserOnline}) => {
  return (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <Image source={{uri: chatUser?.avatar}} style={styles.avatar} />
        <View style={styles.nameContainer}>
          <Text style={styles.username}>{chatUser?.username}</Text>
          <Text style={styles.status}>
            {isUserOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  nameContainer: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default ChatHeader;
