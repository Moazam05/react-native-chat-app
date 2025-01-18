import React, {useEffect, useState, useRef} from 'react';
import {StyleSheet} from 'react-native';
import {useRoute} from '@react-navigation/native';

import {useGetAllUsersQuery} from '../../../redux/api/userApiSlice';
import {getSocket, isUserOnline} from '../../../socket';
import useTypedSelector from '../../../hooks/useTypedSelector';
import {selectedUser} from '../../../redux/auth/authSlice';
import {
  useGetMessagesQuery,
  useCreateMessageMutation,
} from '../../../redux/api/messageAPISlice';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import {SafeAreaView} from 'react-native-safe-area-context';

const Chat = () => {
  const route = useRoute();
  const {userId, chatId} = route.params;
  const currentUser = useTypedSelector(selectedUser);
  const typingTimeoutRef = useRef(null);
  const socket = getSocket(); // Get existing socket directly

  // State management
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const [, forceUpdate] = useState({});

  // RTK Query hooks
  const {data: usersData} = useGetAllUsersQuery({});
  const {data: messagesData, isLoading: messagesLoading} = useGetMessagesQuery(
    {chatId},
    {
      refetchOnMountOrArgChange: true,
    },
  );
  const [createMessage] = useCreateMessageMutation();

  // Get chat user details
  const chatUser = usersData?.users?.find(user => user._id === userId);

  // Socket listeners setup
  useEffect(() => {
    if (socket) {
      // Join chat room
      socket.emit('join chat', chatId);

      // Handle online status updates
      const handleOnlineStatusChange = () => {
        forceUpdate({}); // Force re-render when online status changes
      };

      socket.on('user online', handleOnlineStatusChange);
      socket.on('user offline', handleOnlineStatusChange);
      socket.on('online users', handleOnlineStatusChange);

      // Message and typing handlers
      socket.on('message received', newMessage => {
        if (
          newMessage.chatId === chatId &&
          newMessage.sender !== currentUser.data.user._id
        ) {
          setMessages(prev =>
            [...prev, newMessage].sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            ),
          );
        }
      });

      socket.on('typing', () => setUserTyping(true));
      socket.on('stop typing', () => setUserTyping(false));

      // Request online users list
      socket.emit('get online users');

      // Cleanup listeners
      return () => {
        socket.off('message received');
        socket.off('typing');
        socket.off('stop typing');
        socket.off('user online', handleOnlineStatusChange);
        socket.off('user offline', handleOnlineStatusChange);
        socket.off('online users', handleOnlineStatusChange);
      };
    }
  }, [chatId, userId]);

  // Update messages when data changes
  useEffect(() => {
    if (messagesData?.data?.messages) {
      setMessages(
        [...messagesData.data.messages].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        ),
      );
    }
  }, [messagesData]);

  // Typing handler with debounce
  const handleTyping = text => {
    setMessage(text);

    if (socket) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', chatId);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socket && isTyping) {
          socket.emit('stop typing', chatId);
          setIsTyping(false);
        }
      }, 3000);
    }
  };

  // Send message handler
  const sendMessage = async () => {
    if (!message.trim() || !chatId) {
      return;
    }

    if (socket) {
      socket.emit('stop typing', chatId);
    }

    try {
      const response = await createMessage({
        chatId,
        content: message.trim(),
        messageType: 'text',
      }).unwrap();

      if (response.status === 'success') {
        const newMessage = response.data.message;
        socket?.emit('new message', newMessage);
        setMessage('');
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // File upload handler - simplified error handling
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
        socket?.emit('new message', response.data.message);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader chatUser={chatUser} isUserOnline={isUserOnline(userId)} />
      <ChatMessages
        messages={messages}
        currentUser={currentUser}
        isLoading={messagesLoading}
        isReceiverTyping={userTyping}
      />
      <ChatInput
        message={message}
        onChangeText={handleTyping}
        onSend={sendMessage}
        onFileUpload={handleFileUpload}
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
