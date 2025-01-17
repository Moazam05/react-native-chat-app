import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import useTypedSelector from '../hooks/useTypedSelector';
import {selectedUser} from '../redux/auth/authSlice';
import {getSocket, initiateSocket} from '../socket';

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
          const existingSocket = getSocket();
          if (!existingSocket) {
            console.log(
              'Initializing socket for user:',
              currentUser.data.user.username,
            );
            initiateSocket(currentUser.data.user);
          }
        }
      } catch (error) {
        console.error('Socket setup error:', error);
      }
    };

    setupSocketConnection();

    // Cleanup socket only when app is closed/background
    return () => {
      const socket = getSocket();
      if (socket) {
        console.log('Disconnecting socket');
        socket.disconnect();
      }
    };
  }, [currentUser?.data?.user?._id]); // Only re-run if user ID changes

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
