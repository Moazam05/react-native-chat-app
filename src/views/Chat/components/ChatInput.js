import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React from 'react';
import {launchImageLibrary} from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

const ChatInput = ({message, setMessage, sendMessage, onImageSelect}) => {
  const handleImagePick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (!result.didCancel && result.assets?.[0]) {
        const file = result.assets[0];
        const fileData = {
          uri: file.uri,
          type: file.type || 'image/jpeg',
          name: file.fileName || 'image.jpg',
          size: file.fileSize,
          messageType: 'image',
        };
        onImageSelect(fileData);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
        copyTo: 'cachesDirectory',
      });

      const file = result[0];
      const fileData = {
        uri: file.fileCopyUri || file.uri,
        type: file.type || 'application/pdf',
        name: file.name || 'document.pdf',
        size: file.size,
        messageType: 'document',
      };
      onImageSelect(fileData);
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        console.error('Error picking document:', error);
      }
    }
  };

  const showAttachmentOptions = () => {
    Alert.alert(
      'Select Attachment',
      'Choose the type of file to attach',
      [
        {
          text: 'Image',
          onPress: handleImagePick,
        },
        {
          text: 'PDF Document',
          onPress: handleDocumentPick,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {cancelable: true},
    );
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
            onPress={showAttachmentOptions}
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
