import {View, Text, SafeAreaView, StyleSheet} from 'react-native';
import React from 'react';
import BottomNav from '../../components/BottomNav';

const ChatList = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text>ChatList</Text>

      {/* BottomNav */}
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
export default ChatList;
