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
import CreateGroup from '../views/Chat/components/CreateGroup';
import GroupInfo from '../views/Chat/components/GroupInfo';
import NotificationProvider from '../firebase/NotificationProvider';
const Stack = createNativeStackNavigator();

const MainStack = () => {
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

            socketInstance.on('user online', () => {});
            socketInstance.on('user offline', () => {});
            socketInstance.on('online users', () => {});
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
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Splash" component={Splash} />

      {!currentUser?.token ? (
        <>
          <Stack.Screen
            name="Login"
            component={Login}
            options={{
              gestureEnabled: false,
              headerBackVisible: false,
            }}
          />
          <Stack.Screen name="SignUp" component={SignUp} />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={Home}
            options={{
              gestureEnabled: false,
              headerBackVisible: false,
            }}
          />
          <Stack.Screen name="ChatList" component={ChatList} />
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="CreateGroup" component={CreateGroup} />
          <Stack.Screen name="GroupInfo" component={GroupInfo} />
        </>
      )}
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <NotificationProvider>
        <MainStack />
      </NotificationProvider>
    </NavigationContainer>
  );
};

export default AppNavigator;
