import {StyleSheet, FlatList, View, Text, Image} from 'react-native';
import React from 'react';

const ChatMessages = ({messages, currentUser}) => {
  const renderMessage = ({item}) => {
    const isSender = item.sender._id === currentUser.data.user._id;

    return (
      <View
        style={[
          styles.messageContainer,
          isSender ? styles.senderMessage : styles.receiverMessage,
        ]}>
        {item.messageType === 'image' && item.fileUrl ? (
          <Image
            source={{uri: item.fileUrl}}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : (
          <Text
            style={[styles.messageText, {color: isSender ? '#fff' : '#000'}]}>
            {item.content}
          </Text>
        )}
        <Text style={[styles.timeText, {color: isSender ? '#fff' : '#666'}]}>
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={styles.messagesList}
      inverted
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
});

export default ChatMessages;
