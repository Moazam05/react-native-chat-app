import React, {useRef, useEffect} from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Animated,
} from 'react-native';

const TypingIndicator = () => {
  // Create animated values for each dot
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      // Reset values
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);

      // Create animation sequence
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 1,
            duration: 400,
            delay: 200,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 1,
            duration: 400,
            delay: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate());
    };

    animate();
  }, []);

  return (
    <View style={styles.typingContainer}>
      {[dot1, dot2, dot3].map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.typingDot,
            {
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, -6, 0],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const MessageTime = ({time, isSender}) => (
  <Text style={[styles.timeText, {color: isSender ? '#fff' : '#666'}]}>
    {new Date(time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}
  </Text>
);

const ChatMessages = ({
  messages,
  currentUser,
  isReceiverTyping,
  isLoading,
  // onImagePress,
}) => {
  const flatListRef = useRef(null);

  const renderMessage = ({item}) => {
    const isSender = item.sender._id === currentUser.data.user._id;

    const renderContent = () => {
      switch (item.messageType) {
        case 'image':
          return (
            <TouchableOpacity
              // onPress={() => onImagePress?.(item.fileUrl)}
              activeOpacity={0.8}>
              <Image
                source={{uri: item.fileUrl}}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          );

        case 'document':
          return (
            <TouchableOpacity
              onPress={() => Linking.openURL(item.fileUrl)}
              style={styles.documentContainer}>
              <Text
                style={[
                  styles.documentText,
                  {color: isSender ? '#fff' : '#000'},
                ]}>
                📄 {item.fileName || 'Document'}
              </Text>
            </TouchableOpacity>
          );

        default:
          return (
            <Text
              style={[styles.messageText, {color: isSender ? '#fff' : '#000'}]}>
              {item.content}
            </Text>
          );
      }
    };

    return (
      <View
        style={[
          styles.messageContainer,
          isSender ? styles.senderMessage : styles.receiverMessage,
        ]}>
        {renderContent()}
        <MessageTime time={item.createdAt} isSender={isSender} />
      </View>
    );
  };

  const renderFooter = () => {
    if (isLoading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#007AFF" />
        </View>
      );
    }

    if (isReceiverTyping) {
      return (
        <View style={[styles.messageContainer, styles.receiverMessage]}>
          <TypingIndicator />
        </View>
      );
    }

    return null;
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={item => item._id}
      contentContainerStyle={styles.messagesList}
      inverted
      ListHeaderComponent={renderFooter}
      onContentSizeChange={() => {
        if (messages.length > 0) {
          flatListRef.current?.scrollToOffset({offset: 0, animated: true});
        }
      }}
    />
  );
};

const styles = StyleSheet.create({
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
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  documentContainer: {
    padding: 8,
  },
  documentText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginHorizontal: 2,
  },
  loaderContainer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default ChatMessages;
