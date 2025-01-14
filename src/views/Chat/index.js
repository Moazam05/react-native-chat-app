import {ANDROID_API_URL, IOS_API_URL} from '@env';
import React, {useEffect, useState} from 'react';
import {StyleSheet, Platform, SafeAreaView} from 'react-native';
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
import ChatMessages from './components/ChatMessages';

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
  }, [currentUser.token, userId]);

  const handleFileUpload = async fileData => {
    if (!chatId) {
      return;
    }

    const formData = new FormData();
    const isPDF = fileData.type === 'application/pdf';

    formData.append('messageType', isPDF ? 'document' : 'image');
    formData.append('file', {
      uri: fileData.uri,
      type: fileData.type || 'image/jpeg',
      name: fileData.name || (isPDF ? 'document.pdf' : 'image.jpg'),
    });

    try {
      // Only make the API call, don't emit socket event
      const response = await axios.post(`${url}messages/${chatId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      if (response.data.status === 'success') {
        // Update local messages with server response
        const serverMessage = response.data.data.message;
        setMessages(prev => [
          {
            ...serverMessage,
            sender: {
              _id: currentUser.data.user._id,
              username: currentUser.data.user.username,
              avatar: currentUser.data.user.avatar,
            },
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error(
        'Error uploading file:',
        error.response?.data || error.message,
      );
    }
  };

  // Update sendMessage function for consistency
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

      // Local update for text messages
      setMessages(prev => [
        {
          _id: Date.now().toString(),
          ...messageData,
          sender: {
            _id: currentUser.data.user._id,
            username: currentUser.data.user.username,
            avatar: currentUser.data.user.avatar,
          },
          readBy: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setMessage('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ChatHeader chatUser={chatUser} isUserOnline={isUserOnline} />

      {/* Chat Messages */}
      <ChatMessages messages={messages} currentUser={currentUser} />

      {/* Input */}
      <ChatInput
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
        onImageSelect={handleFileUpload}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default Chat;
