import {ANDROID_API_URL, IOS_API_URL} from '@env';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import axios from 'axios';
import {skipToken} from '@reduxjs/toolkit/query';

import {useGetAllUsersQuery} from '../../redux/api/userApiSlice';
import {getSocket} from '../../socket';
import useTypedSelector from '../../hooks/useTypedSelector';
import {selectedUser} from '../../redux/auth/authSlice';
import {useGetMessageByChatIdQuery} from '../../redux/api/chatApiSlice';
import ChatHeader from './components/ChatHeader';
import ChatInput from './components/ChatInput';

const Chat = () => {
  const route = useRoute();
  const {userId} = route.params;
  const currentUser = useTypedSelector(selectedUser);

  const [chatId, setChatId] = useState(skipToken);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isUserOnline, setIsUserOnline] = useState(false);

  // todo: GET ALL USERS API
  const {data} = useGetAllUsersQuery({});

  // todo: GET MESSAGES BY CHAT ID API
  const {data: messagesData} = useGetMessageByChatIdQuery(
    chatId === skipToken ? skipToken : {chatId},
  );

  useEffect(() => {
    if (messagesData?.data?.messages) {
      setMessages(messagesData.data.messages);
    }
  }, [messagesData]);

  useEffect(() => {
    const socket = getSocket();
    if (socket && userId) {
      // Check initial online status from chatUser data
      if (chatUser?.isOnline) {
        setIsUserOnline(true);
      }

      // Set up online status listener
      socket.on('user online', onlineUserId => {
        // console.log('User online event:', onlineUserId, userId);
        if (onlineUserId === userId) {
          setIsUserOnline(true);
        }
      });

      // Set up offline status listener
      socket.on('user offline', offlineUserId => {
        // console.log('User offline event:', offlineUserId, userId);
        if (offlineUserId === userId) {
          setIsUserOnline(false);
        }
      });

      // Initial check for online status
      socket.emit('check online', userId);

      // Message listener
      socket.on('message received', newMessage => {
        if (newMessage.chatId === chatId) {
          setMessages(prev => [newMessage, ...prev]);
        }
      });

      // Cleanup listeners
      return () => {
        socket.off('message received');
        socket.off('user online');
        socket.off('user offline');
      };
    }
  }, [chatId, userId, chatUser?.isOnline]);

  // todo: Chat user
  const chatUser = data?.users?.find(user => user._id === userId);

  const url = Platform.OS === 'android' ? ANDROID_API_URL : IOS_API_URL;

  const createChat = async () => {
    try {
      const response = await axios.post(
        `${url}chats`,
        {userId},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentUser.token}`,
          },
        },
      );

      const result = response.data;

      if (result.status === 'success') {
        setChatId(result.data.chat._id);
        const socket = getSocket();
        if (socket) {
          // Join the chat room
          socket.emit('join chat', result.data.chat._id);
        }
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  useEffect(() => {
    if (userId && currentUser.token) {
      createChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.token, userId]);

  const renderMessage = ({item}) => {
    const isSender = item.sender._id === currentUser.data.user._id;

    return (
      <View
        style={[
          styles.messageContainer,
          isSender ? styles.senderMessage : styles.receiverMessage,
        ]}>
        <Text style={[styles.messageText, {color: isSender ? '#fff' : '#000'}]}>
          {item.content}
        </Text>
        <Text style={[styles.timeText, {color: isSender ? '#fff' : '#666'}]}>
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  // 3. Update the sendMessage function to match the message structure
  const sendMessage = () => {
    if (!message.trim() || !chatId) {
      return;
    }

    const socket = getSocket();
    if (socket) {
      const messageData = {
        sender: currentUser.data.user._id,
        content: message,
        chatId: chatId,
        messageType: 'text',
      };

      socket.emit('new message', messageData);

      // Update local messages with the correct structure
      setMessages(prev => [
        {
          _id: Date.now().toString(),
          chatId: chatId,
          sender: {
            _id: currentUser.data.user._id,
            username: currentUser.data.user.username,
            avatar: currentUser.data.user.avatar,
          },
          content: message,
          messageType: 'text',
          readBy: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ChatHeader chatUser={chatUser} isUserOnline={isUserOnline} />

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.messagesList}
        inverted
      />

      {/* Input */}
      <ChatInput
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  senderMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  receiverMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8E8E8',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

export default Chat;
