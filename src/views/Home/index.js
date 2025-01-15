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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {initiateSocket, getSocket} from '../../socket';
import {useGetAllUsersQuery} from '../../redux/api/userApiSlice';
import useTypedSelector from '../../hooks/useTypedSelector';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Icon name="plus" size={24} color="#000" />
          </TouchableOpacity>
          <Image
            source={{uri: currentUser?.data?.user?.avatar}}
            style={styles.profilePic}
          />
        </View>
      </View>

      <FlatList
        data={data?.users || []}
        renderItem={renderUser}
        keyExtractor={item => item._id}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="account-multiple" size={24} color="#FF9F0A" />
          <Text style={[styles.navText, styles.activeNavText]}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Icon name="message-outline" size={24} color="#666" />
          <Text style={styles.navText}>Chats</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
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
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeNavText: {
    color: '#FF9F0A',
  },
});

export default Home;
