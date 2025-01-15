import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const HomeHeader = ({
  title = 'Contacts',
  avatarUrl,
  onAddPress,
  onAvatarPress,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
            <Icon name="plus" size={28} color="#999" />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={onAvatarPress}>
            <Image source={{uri: avatarUrl}} style={styles.avatar} />
            <View style={styles.onlineIndicator} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 65,
  },
  leftSection: {
    width: 40,
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default HomeHeader;
