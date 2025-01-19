import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {getGroupColor, getInitial} from '../../../utils';
import {useNavigation} from '@react-navigation/native';

const ChatHeader = ({chatUser, isUserOnline, chatId}) => {
  const navigation = useNavigation();

  const isGroup = !chatUser?.avatar;

  const handleGroupInfo = () => {
    navigation.navigate('GroupInfo', {
      chatId,
    });
  };

  return (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        {isGroup ? (
          <View
            style={[
              styles.groupAvatar,
              {backgroundColor: getGroupColor(chatUser?.username)},
            ]}>
            <Text style={styles.groupInitial}>
              {getInitial(chatUser?.username)}
            </Text>
          </View>
        ) : (
          <Image source={{uri: chatUser?.avatar}} style={styles.avatar} />
        )}
        <View style={styles.nameContainer}>
          <Text style={styles.username}>{chatUser?.username}</Text>
          {!isGroup && (
            <Text style={styles.status}>
              {isUserOnline ? 'Online' : 'Offline'}
            </Text>
          )}
        </View>
        {isGroup && (
          <TouchableOpacity
            style={styles.groupButton}
            onPress={handleGroupInfo}>
            <Icon name="information" size={24} color="#444" />
            <Text style={styles.groupButtonText}>Group Info</Text>
          </TouchableOpacity>
        )}
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
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
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
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  groupButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
});

export default ChatHeader;
