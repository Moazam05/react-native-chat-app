import {View, Text, StyleSheet, ImageBackground, StatusBar} from 'react-native';
import React, {useEffect} from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';

import {selectedUser} from '../../redux/auth/authSlice';
import useTypedSelector from '../../hooks/useTypedSelector';
import images from '../../constants/image';

const Splash = () => {
  const navigation = useNavigation();
  const isAuthenticated = useTypedSelector(selectedUser);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleNavigation();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleNavigation = () => {
    const screen = isAuthenticated?.token ? 'Home' : 'Login';
    navigation.reset({
      index: 0,
      routes: [{name: screen}],
    });
  };

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ImageBackground
        source={images.AuthBG}
        style={styles.background}
        resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={75}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.appName}>ChatApp</Text>
            <Text style={styles.tagline}>Connect • Chat • Share</Text>
          </View>
        </View>
      </ImageBackground>
    </>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.1)', // Subtle background for icon
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 1,
  },
});

export default Splash;
