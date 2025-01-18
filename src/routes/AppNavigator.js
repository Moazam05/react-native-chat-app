import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import useTypedSelector from '../hooks/useTypedSelector';
import {selectedUser} from '../redux/auth/authSlice';
import {disconnectSocket, getSocket, initiateSocket} from '../socket';

import Home from '../views/Home';
import Login from '../views/Auth/Login';
import Splash from '../views/Splash';
import Chat from '../views/Chat/components/Chat';
import SignUp from '../views/Auth/SignUp';
import ChatList from '../views/Chat';
import Profile from '../views/Profile';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const currentUser = useTypedSelector(selectedUser);

  useEffect(() => {
    const setupSocketConnection = async () => {
      try {
        if (currentUser?.data?.user) {
          const socket = getSocket();
          if (!socket || !socket.connected) {
            console.log(
              'Initializing socket for user:',
              currentUser.data.user.username,
            );
            const socketInstance = initiateSocket(currentUser.data.user);

            // Log online users whenever they change
            socketInstance.on('user online', () => {
              // console.log('AppNavigator - Online Users: 1', getOnlineUsers());
            });

            socketInstance.on('user offline', () => {
              // console.log('AppNavigator - Online Users: 2', getOnlineUsers());
            });

            socketInstance.on('online users', () => {
              // console.log('AppNavigator - Online Users: 3', getOnlineUsers());
            });
          }
        }
      } catch (error) {
        console.error('Socket setup error:', error);
      }
    };

    setupSocketConnection();

    return () => {
      disconnectSocket();
    };
  }, [currentUser?.data?.user?._id]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ChatList" component={ChatList} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="Profile" component={Profile} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
