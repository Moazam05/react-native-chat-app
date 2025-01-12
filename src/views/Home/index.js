import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {initiateSocket, getSocket} from '../../socket';
import {useGetAllUsersQuery} from '../../redux/api/userApiSlice';
import useTypedSelector from '../../hooks/useTypedSelector';
import {selectedUser} from '../../redux/auth/authSlice';

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
    // Don't show current user in the list
    if (item._id === currentUser?.data?.user?._id) return null;

    const isOnline = onlineUsers.has(item._id) || item.isOnline;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleUserPress(item._id)}>
        <Image source={{uri: item.avatar}} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.onlineStatus,
              {backgroundColor: isOnline ? '#4CAF50' : '#bbb'},
            ]}
          />
          <Text
            style={[styles.statusText, {color: isOnline ? '#4CAF50' : '#666'}]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
      </View>

      <FlatList
        data={data?.users || []}
        renderItem={renderUser}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  statusIndicator: {
    alignItems: 'center',
    padding: 8,
  },
  onlineStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default Home;
