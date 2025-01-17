import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import React, {useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

import useTypedSelector from '../../hooks/useTypedSelector';
import {selectedUser} from '../../redux/auth/authSlice';
import {useNavigation} from '@react-navigation/native';

const Profile = () => {
  const navigation = useNavigation();
  const currentUser = useTypedSelector(selectedUser);

  const [formData, setFormData] = useState({
    name: currentUser?.data?.user?.username || '',
    email: currentUser?.data?.user?.email || '',
    avatar: currentUser?.data?.user?.avatar || '',
  });
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImagePick = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    try {
      const response = await launchImageLibrary(options);
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const imageUri = response.assets[0].uri;
        setSelectedImage(imageUri);
        setFormData(prev => ({...prev, avatar: imageUri}));
      }
    } catch (error) {
      console.log('Error picking image: ', error);
    }
  };

  const handleSubmit = () => {
    // Create FormData object
    const payload = new FormData();
    payload.append('name', formData.name);

    if (selectedImage) {
      const imageFile = {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'profile-image.jpg',
      };
      payload.append('avatar', imageFile);
    }

    // Log the payload
    console.log('Submitting payload:', payload);
    // Here you would typically make your API call
  };

  const handleLogout = () => {
    // Implement logout logic
    console.log('Logging out...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={22} color="#333" />
      </TouchableOpacity>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={handleImagePick}>
          <Image
            source={{
              uri: selectedImage || formData.avatar,
            }}
            style={styles.profileImage}
          />
          <View style={styles.editIconContainer}>
            <Icon name="edit" size={18} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Icon
              name="person"
              size={24}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.name}
              onChangeText={text =>
                setFormData(prev => ({...prev, name: text}))
              }
            />
          </View>

          <View style={[styles.inputContainer, styles.readOnlyInput]}>
            <Icon
              name="email"
              size={24}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={formData.email}
              editable={false}
            />
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Update Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={18} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 30 : 20,
    left: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    padding: 6,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  imageContainer: {
    marginTop: 50,
    position: 'relative',
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 30,
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 30,
    backgroundColor: '#FF9F0A',
    borderRadius: 20,
    padding: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  form: {
    width: '100%',
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 14,
    color: '#333',
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  updateButton: {
    backgroundColor: '#FF9F0A',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  logoutText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Profile;
