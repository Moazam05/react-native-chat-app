import {View, Text} from 'react-native';
import React from 'react';
import {useGroupInfoQuery} from '../../../redux/api/chatApiSlice';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute} from '@react-navigation/native';

const GroupInfo = () => {
  const route = useRoute();
  const {chatId} = route.params;

  // todo: Fetch group info API CALL
  const {data} = useGroupInfoQuery(chatId);

  console.log('Group Info:', data);

  return (
    <SafeAreaView>
      <Text>GroupInfo</Text>
    </SafeAreaView>
  );
};

export default GroupInfo;
