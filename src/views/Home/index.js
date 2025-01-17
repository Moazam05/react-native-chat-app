import React from 'react';
import {StyleSheet, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import useTypedSelector from '../../hooks/useTypedSelector';
import {selectedUser} from '../../redux/auth/authSlice';
import HomeHeader from './components/HomeHeader';
import Users from './components/Users';
import BottomNav from '../../components/BottomNav';
import {useNavigation} from '@react-navigation/native';

const Home = () => {
  const navigation = useNavigation();
  const currentUser = useTypedSelector(selectedUser);

  const handleAddPress = () => {};
  const handleAvatarPress = () => {
    navigation.navigate('Profile');
  };

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
