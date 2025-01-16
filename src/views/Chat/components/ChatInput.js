import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

const ChatInput = ({message, onChangeText, onSend, onFileUpload}) => {
  const handleImageSelection = async () => {
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (!result.didCancel && result.assets?.[0]) {
        const asset = result.assets[0];
        onFileUpload({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleDocumentSelection = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });

      if (result[0]) {
        onFileUpload({
          uri: result[0].uri,
          type: result[0].type,
          name: result[0].name,
        });
      }
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        console.error('Error picking document:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TouchableOpacity
          onPress={handleImageSelection}
          style={styles.iconButton}>
          <Icon name="image-outline" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDocumentSelection}
          style={styles.iconButton}>
          <Icon name="document-outline" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TextInput
          value={message}
          onChangeText={onChangeText}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          style={styles.input}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          onPress={onSend}
          style={[
            styles.sendButton,
            !message.trim() && styles.sendButtonDisabled,
          ]}
          disabled={!message.trim()}>
          <Icon
            name="send"
            size={24}
            color={message.trim() ? '#007AFF' : '#999'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        paddingBottom: 30, // Additional padding for iOS devices
      },
    }),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 4,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    color: '#000',
    padding: 0,
    marginHorizontal: 8,
  },
  sendButton: {
    padding: 4,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatInput;
