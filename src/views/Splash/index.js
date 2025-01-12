import {View, Text, StyleSheet} from 'react-native';
import React, {useEffect} from 'react';
import {selectedUser} from '../../redux/auth/authSlice';
import useTypedSelector from '../../hooks/useTypedSelector';
import {useNavigation} from '@react-navigation/native';

const Splash = () => {
  const navigation = useNavigation();
  const isAuthenticated = useTypedSelector(selectedUser);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleNavigation();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleNavigation = () => {
    const screen = isAuthenticated?.token ? 'Home' : 'Login';
    navigation.replace(screen);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Chat App</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Splash;
