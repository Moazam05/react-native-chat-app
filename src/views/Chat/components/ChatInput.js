import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import {launchImageLibrary} from 'react-native-image-picker';

const ChatInput = ({message, setMessage, sendMessage, onImageSelect}) => {
  const handleFilePick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed', // Allow both photos and documents
        quality: 0.8,
        includeBase64: false, // Changed to false as we're using FormData
        selectionLimit: 1,
      });

      if (!result.didCancel && result.assets?.[0]) {
        const file = result.assets[0];

        // Determine file type
        const fileType = file.type || 'application/octet-stream';
        const isImage = fileType.startsWith('image/');

        const fileData = {
          uri: file.uri,
          type: fileType,
          name: file.fileName || 'file',
          size: file.fileSize,
          messageType: isImage ? 'image' : 'document',
        };

        console.log('Selected file:', fileData);
        onImageSelect(fileData);
      }
    } catch (error) {
      console.error('Error picking file:', error);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      sendMessage();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inputContainer}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={handleFilePick}
            style={styles.attachButton}>
            <Text style={styles.attachButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
          placeholderTextColor="#666"
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            !message.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!message.trim()}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  attachButtonText: {
    fontSize: 24,
    color: '#007AFF',
    lineHeight: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ChatInput;
