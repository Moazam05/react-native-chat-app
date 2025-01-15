import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import {initiateSocket, getSocket} from '../../socket';
import {useGetAllUsersQuery} from '../../redux/api/userApiSlice';
import useTypedSelector from '../../hooks/useTypedSelector';
import {selectedUser} from '../../redux/auth/authSlice';
import HomeHeader from './components/HomeHeader';
import Users from './components/Users';
import BottomNav from '../../components/BottomNav';

const Home = () => {
  const navigation = useNavigation();

  const currentUser = useTypedSelector(selectedUser);

  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // todo: GET ALL USERS API CALL
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
      {/* StatusBar */}
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <HomeHeader
        title="Contacts"
        avatarUrl={currentUser?.data?.user?.avatar}
        onAddPress={handleAddPress}
        onAvatarPress={handleAvatarPress}
      />

      {/* Users */}
      <Users
        data={data?.users || []}
        handleUserPress={handleUserPress}
        onlineUsers={onlineUsers}
      />

      {/* BottomNav */}
      <BottomNav />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default Home;
