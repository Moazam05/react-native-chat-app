import React, {useEffect, useState} from 'react';
import {StyleSheet, SafeAreaView} from 'react-native';
import {useRoute} from '@react-navigation/native';

import {useGetAllUsersQuery} from '../../../redux/api/userApiSlice';
import {getSocket} from '../../../socket';
import useTypedSelector from '../../../hooks/useTypedSelector';
import {selectedUser} from '../../../redux/auth/authSlice';
import {
  useGetMessagesQuery,
  useCreateMessageMutation,
} from '../../../redux/api/messageAPISlice';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';

const Chat = () => {
  const route = useRoute();
  const {userId, chatId} = route.params;
  const currentUser = useTypedSelector(selectedUser);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isUserOnline, setIsUserOnline] = useState(false);

  // todo: GET ALL USERS API
  const {data} = useGetAllUsersQuery({});

  // todo: GET MESSAGES BY CHAT ID API
  const {data: messagesData} = useGetMessagesQuery({chatId});

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

  useEffect(() => {
    if (currentUser.token) {
      const socket = getSocket();
      if (socket) {
        // Join the chat rooms
        socket.emit('join chat', chatId);
      }
    }
  }, [currentUser.token]);

  useEffect(() => {}, [chatId]);

  // todo: Send message API Mutation
  const [createMessage] = useCreateMessageMutation();

  // In your Chat component:
  const sendMessage = async () => {
    if (!message.trim() || !chatId) {
      return;
    }

    const messageData = {
      content: message.trim(),
      messageType: 'text',
    };

    try {
      const response = await createMessage({
        chatId,
        ...messageData,
      }).unwrap();

      if (response.status === 'success') {
        const newMessage = response.data.message;

        // Emit through socket
        const socket = getSocket();
        if (socket) {
          socket.emit('new message', {
            ...newMessage,
            sender: currentUser.data.user._id,
          });
        }

        // Update local messages
        setMessages(prev => [newMessage, ...prev]);
        setMessage('');
      }
    } catch (error) {
      console.error('Error details:', error);
    }
  };

  const handleFileUpload = async fileData => {
    if (!chatId) {
      return;
    }

    const isPDF = fileData.type === 'application/pdf';

    try {
      const response = await createMessage({
        chatId,
        messageType: isPDF ? 'document' : 'image',
        file: {
          uri: fileData.uri,
          type: fileData.type || 'image/jpeg',
          name: fileData.name || (isPDF ? 'document.pdf' : 'image.jpg'),
        },
      }).unwrap();

      if (response.status === 'success') {
        const newMessage = response.data.message;

        // Emit socket event
        const socket = getSocket();
        if (socket) {
          socket.emit('new message', {
            ...newMessage,
            sender: currentUser.data.user._id,
          });
        }

        // Update local messages
        setMessages(prev => [newMessage, ...prev]);
      }
    } catch (error) {
      console.error('Error details:', error);
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
