import React, {useEffect, useState, useRef, useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {useRoute, useIsFocused} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

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
        avatar: null,
      };
    }
    const user = usersData?.users?.find(findUser => findUser._id === userId);
    return user || null;
  }, [isGroupChat, chatName, userId, usersData]);

  // Handle screen focus/unfocus with debounce
  useEffect(() => {
    let timeoutId;
    if (socket && chatId) {
      if (isFocused) {
        // Small delay to ensure proper sequence of events
        timeoutId = setTimeout(() => {
          console.log('Joining chat room:', chatId);
          socket.emit('join chat', chatId);
        }, 100);
      } else {
        console.log('Leaving chat room:', chatId);
        socket.emit('leave chat', chatId);
      }
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isFocused, chatId, socket]);

  // Socket listeners setup
  useEffect(() => {
    if (!socket) {
      return;
    }

    // Handle online status updates
    const handleOnlineStatusChange = () => {
      forceUpdate({});
    };

    // Message handler with proper sorting
    const handleMessageReceived = newMessage => {
      if (
        newMessage.chatId === chatId &&
        newMessage.sender._id !== currentUser.data.user._id
      ) {
        setMessages(prev => {
          const updatedMessages = [...prev];
          const existingIndex = updatedMessages.findIndex(
            msg => msg._id === newMessage._id,
          );

          if (existingIndex === -1) {
            updatedMessages.push(newMessage);
          }

          return updatedMessages.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          );
        });
      }
    };

    // Typing status handlers
    const handleTypingStart = data => {
      if (data.chatId === chatId) {
        setUserTyping(true);
      }
    };

    const handleTypingStop = data => {
      if (data.chatId === chatId) {
        setUserTyping(false);
      }
    };

    // Set up event listeners
    socket.on('user online', handleOnlineStatusChange);
    socket.on('user offline', handleOnlineStatusChange);
    socket.on('online users', handleOnlineStatusChange);
    socket.on('message received', handleMessageReceived);
    socket.on('typing', handleTypingStart);
    socket.on('stop typing', handleTypingStop);

    // Cleanup listeners
    return () => {
      socket.off('message received', handleMessageReceived);
      socket.off('typing', handleTypingStart);
      socket.off('stop typing', handleTypingStop);
      socket.off('user online', handleOnlineStatusChange);
      socket.off('user offline', handleOnlineStatusChange);
      socket.off('online users', handleOnlineStatusChange);
    };
  }, [chatId, currentUser.data.user._id, socket]);

  // Update messages when data changes
  useEffect(() => {
    if (messagesData?.data?.messages) {
      const sortedMessages = [...messagesData.data.messages].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setMessages(sortedMessages);
    }
  }, [messagesData]);

  // Typing handler with debounce
  const handleTyping = text => {
    setMessage(text);

    if (!socket) {
      return;
    }

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
  };

  const sendMessage = async () => {
    const messageContent = message.trim();
    if (!messageContent || !chatId) {
      return;
    }

    if (socket) {
      socket.emit('stop typing', chatId);
    }

    const tempMessage = messageContent;
    try {
      setMessage('');

      const response = await createMessage({
        chatId,
        content: tempMessage,
        messageType: 'text',
      }).unwrap();

      if (response.status === 'success') {
        const newMessage = response.data.message;
        socket?.emit('new message', newMessage);

        // Optimistically update messages
        setMessages(prev => {
          const updated = [...prev, newMessage].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          );
          return updated;
        });

        setIsTyping(false);
      } else {
        setMessage(tempMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(tempMessage);
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
