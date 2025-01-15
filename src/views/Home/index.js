import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {initiateSocket, getSocket} from '../../socket';
import {useGetAllUsersQuery} from '../../redux/api/userApiSlice';
import useTypedSelector from '../../hooks/useTypedSelector';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {selectedUser} from '../../redux/auth/authSlice';
import HomeHeader from './components/HomeHeader';
import HomeNav from './components/HomeNav';

const Home = () => {
  const navigation = useNavigation();
  const currentUser = useTypedSelector(selectedUser);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const {data, isLoading} = useGetAllUsersQuery({});

  useEffect(() => {
    if (currentUser?.data?.user) {
      const socket = initiateSocket(currentUser.data.user);

      socket.on('connected', () => {
        console.log('Socket Connected');
      });

      socket.on('user online', userId => {
        console.log('User Online:', userId);
        setOnlineUsers(prev => new Set([...prev, userId]));
      });

      socket.on('user offline', userId => {
        console.log('User Offline:', userId);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      // Initial setup
      socket.emit('setup', currentUser.data.user);

      return () => {
        const currentSocket = getSocket();
        if (currentSocket) {
          currentSocket.off('connected');
          currentSocket.off('user online');
          currentSocket.off('user offline');
          currentSocket.disconnect();
        }
      };
    }
  }, [currentUser]);

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
          <Text style={styles.lastSeen}>last seen recently</Text>
        </View>
        <TouchableOpacity style={styles.messageButton}>
          <Text style={styles.messageText}>Message</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  const handleAddPress = () => {};

  const handleAvatarPress = () => {};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <HomeHeader
        title="Contacts"
        avatarUrl={currentUser?.data?.user?.avatar}
        onAddPress={handleAddPress}
        onAvatarPress={handleAvatarPress}
      />

      <FlatList
        data={data?.users || []}
        renderItem={renderUser}
        keyExtractor={item => item._id}
        showsVerticalScrollIndicator={false}
      />

      <HomeNav />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

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

export default Home;
