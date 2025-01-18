import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import useTypedSelector from '../../../hooks/useTypedSelector';
import {selectedUser} from '../../../redux/auth/authSlice';

const HomeHeader = ({avatarUrl, onAvatarPress}) => {
  const currentUser = useTypedSelector(selectedUser);
  const username = currentUser?.data?.user?.username || 'User';

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <Text style={styles.appName}>ChatHive</Text>
          <Text style={styles.username}>{username}</Text>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={onAvatarPress}>
            <Image
              source={{uri: avatarUrl}}
              style={styles.avatar}
              defaultSource={{uri: avatarUrl}}
            />
            <View style={styles.onlineIndicator} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  leftSection: {
    flex: 1,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF9F0A',
  },
  username: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  avatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default HomeHeader;
