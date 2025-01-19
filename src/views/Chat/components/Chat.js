import React, {useEffect, useState, useRef, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {useRoute, useIsFocused} from '@react-navigation/native';

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
  const {userId, chatId, isGroupChat, chatName} = route.params;
  const currentUser = useTypedSelector(selectedUser);
  const typingTimeoutRef = useRef(null);
  const socket = getSocket();
  const isFocused = useIsFocused();

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

  const chatUser = useMemo(() => {
    if (isGroupChat) {
      return {
        username: chatName,
        avatar: null, // This will trigger group avatar display
      };
    }
    const user = usersData?.users?.find(findUser => findUser._id === userId);
    return user || null;
  }, [isGroupChat, chatName, userId, usersData]);

  // Handle screen focus/unfocus
  useEffect(() => {
    if (socket) {
      if (isFocused) {
        // Join chat room when screen is focused
        console.log('Joining chat room:', chatId);
        socket.emit('join chat', chatId);
      } else {
        // Leave chat room when screen is unfocused
        console.log('Leaving chat room:', chatId);
        socket.emit('leave chat', chatId);
      }
    }
  }, [isFocused, chatId, socket]);

  // Socket listeners setup
  useEffect(() => {
    if (socket) {
      // Handle online status updates
      const handleOnlineStatusChange = () => {
        forceUpdate({});
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
        // Ensure we leave the room when component unmounts
        socket.emit('leave chat', chatId);
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
      <ChatHeader
        chatUser={chatUser}
        isUserOnline={!isGroupChat && isUserOnline(userId)}
        chatId={chatId}
      />
      <ChatMessages
        messages={messages}
        currentUser={currentUser}
        isLoading={messagesLoading}
        isReceiverTyping={userTyping}
        isGroupChat={isGroupChat}
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
    backgroundColor: '#fff',
  },
});

export default Chat;
