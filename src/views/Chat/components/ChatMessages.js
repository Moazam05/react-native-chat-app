import React, {useRef, useEffect, useState} from 'react';
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
  Modal,
  PermissionsAndroid,
  Alert,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFetchBlob from 'rn-fetch-blob';

const ImageViewer = ({visible, imageUrl, onClose, onDownload}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.imageViewerContainer}>
        <View style={styles.imageViewerHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDownload} style={styles.downloadButton}>
            <Icon name="download" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Image
          source={{uri: imageUrl}}
          style={styles.fullImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
};

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
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImagePress = imageUrl => {
    setSelectedImage(imageUrl);
  };

  const checkAndRequestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        // First check if we already have permission
        let hasPermission = false;

        if (Platform.Version >= 33) {
          // For Android 13+
          const result = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          );
          hasPermission = result;

          if (!hasPermission) {
            const permission = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              {
                title: 'Storage Permission Required',
                message: 'Please allow access to save images',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );

            if (permission === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
              Alert.alert(
                'Permission Required',
                'Please enable storage permission in app settings to download images',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'Open Settings',
                    onPress: () => {
                      Linking.openSettings();
                    },
                  },
                ],
              );
              return false;
            }

            return permission === PermissionsAndroid.RESULTS.GRANTED;
          }
        } else {
          // For Android < 13
          const result = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          );
          hasPermission = result;

          if (!hasPermission) {
            const permission = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
              {
                title: 'Storage Permission Required',
                message: 'Please allow access to save images',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              },
            );

            if (permission === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
              Alert.alert(
                'Permission Required',
                'Please enable storage permission in app settings to download images',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'Open Settings',
                    onPress: () => {
                      Linking.openSettings();
                    },
                  },
                ],
              );
              return false;
            }

            return permission === PermissionsAndroid.RESULTS.GRANTED;
          }
        }

        return hasPermission;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS doesn't need runtime permission
  };

  const handleDownload = async () => {
    const hasPermission = await checkAndRequestPermissions();

    if (!hasPermission) {
      Toast.show({
        type: 'error',
        text2: 'Storage permission required to download images',
      });
      return;
    }

    try {
      Toast.show({
        type: 'info',
        text2: 'Downloading image...',
      });

      const fileName = `ChatApp_${Date.now()}.jpg`;
      const {config, fs} = RNFetchBlob;
      const downloadPath = `${fs.dirs.DownloadDir}/${fileName}`;

      const response = await config({
        path: downloadPath,
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: downloadPath,
          description: 'Downloading image...',
          title: fileName,
          mime: 'image/jpeg',
          mediaScannable: true,
        },
      }).fetch('GET', selectedImage);

      Toast.hide();

      if (response.path()) {
        // Check if file exists
        const exists = await fs.exists(response.path());
        if (exists) {
          Toast.show({
            type: 'success',
            text2: 'Image saved to Downloads folder',
          });
          setSelectedImage(null); // Close image viewer
        } else {
          throw new Error('File not found after download');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Toast.hide();

      Toast.show({
        type: 'error',
        text2: 'Download failed. Please try again.',
      });
    }
  };

  const renderMessage = ({item}) => {
    const isSender = item.sender._id === currentUser.data.user._id;

    const renderContent = () => {
      switch (item.messageType) {
        case 'image':
          return (
            <TouchableOpacity
              onPress={() => handleImagePress(item.fileUrl)}
              style={styles.imageContainer}>
              <Image source={{uri: item.fileUrl}} style={styles.messageImage} />
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
                  isSender && styles.documentTextSender,
                ]}>
                📄 {item.fileName || 'Document'}
              </Text>
            </TouchableOpacity>
          );
        default:
          return (
            <Text
              style={[
                styles.messageText,
                isSender && styles.messageTextSender,
              ]}>
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
          item.messageType === 'image' && styles.imageMessageContainer,
          item.messageType === 'document' && styles.documentMessageContainer,
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
          <ActivityIndicator color="#FF9134" />
        </View>
      );
    }

    if (isReceiverTyping) {
      return (
        <View style={[styles.messageContainerTwo, styles.receiverMessage]}>
          <TypingIndicator />
        </View>
      );
    }

    return null;
  };

  return (
    <>
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
      <ImageViewer
        visible={!!selectedImage}
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
        onDownload={handleDownload}
      />
    </>
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
  messageContainerTwo: {
    maxWidth: '80%',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  senderMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF9134',
    borderBottomRightRadius: 4,
  },
  receiverMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 12,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  messageImage: {
    width: 200,
    height: 300,
    borderRadius: 6,
    resizeMode: 'cover',
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
  messageTextSender: {
    color: '#fff',
  },
  documentTextSender: {
    color: '#fff',
  },
  imageMessageContainer: {
    padding: 6,
    borderRadius: 6,
  },
  documentMessageContainer: {
    padding: 4,
  },
  imageContainer: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  // Image viewer styles
  imageViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  downloadButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});

export default ChatMessages;
