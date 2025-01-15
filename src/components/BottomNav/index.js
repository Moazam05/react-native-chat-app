import {View, Text, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute} from '@react-navigation/native';

const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const currentRoute = route.name;

  const isHomeActive = currentRoute === 'Home';
  const isChatActive = currentRoute === 'ChatList';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Home')}>
        <Icon
          name="account-multiple"
          size={24}
          color={isHomeActive ? '#FF9F0A' : '#666'}
        />
        <Text style={[styles.navText, isHomeActive && styles.activeNavText]}>
          Contacts
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('ChatList')}>
        <Icon
          name="message-outline"
          size={24}
          color={isChatActive ? '#FF9F0A' : '#666'}
        />
        <Text style={[styles.navText, isChatActive && styles.activeNavText]}>
          Chats
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8, // Add padding for iOS safe area
    paddingTop: 5,
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

export default BottomNav;
