import React from 'react';
import {StyleSheet, SafeAreaView, StatusBar} from 'react-native';
import useTypedSelector from '../../hooks/useTypedSelector';
import {selectedUser} from '../../redux/auth/authSlice';
import HomeHeader from './components/HomeHeader';
import Users from './components/Users';
import BottomNav from '../../components/BottomNav';
import {initiateSocket} from '../../socket';

const Home = () => {
  const currentUser = useTypedSelector(selectedUser);

  // Initialize socket when app starts
  React.useEffect(() => {
    if (currentUser?.data?.user) {
      const socket = initiateSocket(currentUser.data.user);
      socket.emit('setup', currentUser.data.user);
    }
  }, [currentUser]);

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

      <Users />

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
