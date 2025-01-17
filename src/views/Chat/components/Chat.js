import React, {useEffect, useState, useCallback, useRef} from 'react';
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
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // State management
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);

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

  // Socket setup
  const setupSocket = () => {
    const socket = getSocket();
    if (socket) {
      socketRef.current = socket;

      // Setup user and join chat
      socket.emit('setup', currentUser.data.user);
      socket.emit('join chat', chatId);

      // Online status handling
      socket.on('user online', onlineUserId => {
        console.log('Online event received for:', onlineUserId);
        if (onlineUserId === userId) {
          setIsUserOnline(true);
        }
      });

      socket.on('user offline', offlineUserId => {
        console.log('Offline event received for:', offlineUserId);
        if (offlineUserId === userId) {
          setIsUserOnline(false);
        }
      });

      // Add connected handler
      socket.on('connected', () => {
        console.log('Socket connected, checking status');
        socket.emit('check user status', userId);
      });

      // Keep your existing message and typing handlers as they are
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

      // Initial status check
      socket.emit('check user status', userId);
    }
  };

  // Cleanup socket
  const cleanupSocket = () => {
    if (socketRef.current) {
      socketRef.current.off('message received');
      socketRef.current.off('typing');
      socketRef.current.off('stop typing');
      socketRef.current.off('user online');
      socketRef.current.off('user offline');
    }
  };

  // Initial socket setup and cleanup
  useEffect(() => {
    // Only setup if socket doesn't exist
    if (!socketRef.current) {
      setupSocket();
    } else {
      // If socket exists, just join the chat
      socketRef.current.emit('join chat', chatId);
    }

    return () => cleanupSocket();
  }, []);

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

    if (socketRef.current) {
      if (!isTyping) {
        setIsTyping(true);
        socketRef.current.emit('typing', chatId);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && isTyping) {
          socketRef.current.emit('stop typing', chatId);
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

    if (socketRef.current) {
      socketRef.current.emit('stop typing', chatId);
    }

    try {
      const response = await createMessage({
        chatId,
        content: message.trim(),
        messageType: 'text',
      }).unwrap();

      if (response.status === 'success') {
        const newMessage = response.data.message;

        if (socketRef.current) {
          socketRef.current.emit('new message', newMessage);
        }

        setMessage('');
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error (show toast or alert)
    }
  };

  // File upload handler
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

        if (socketRef.current) {
          socketRef.current.emit('new message', newMessage);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Handle error (show toast or alert)
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader chatUser={chatUser} isUserOnline={isUserOnline} />

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
