import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useGetAllUsersQuery} from '../../../redux/api/userApiSlice';
import Toast from 'react-native-toast-message';

const CreateGroup = () => {
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [groupTitle, setGroupTitle] = useState('');

  //   todo: GET ALL USERS API
  const {data, isLoading} = useGetAllUsersQuery({});

  // Filter users based on search query
  useEffect(() => {
    if (data?.users) {
      const filtered = data.users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredUsers(filtered);
    }
  }, [data, searchQuery]);

  const handleUserSelect = user => {
    if (!selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleUserRemove = userId => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };

  const handleCreateGroup = () => {
    if (!groupTitle.trim()) {
      Toast.show({
        type: 'error',
        text2: 'Please enter group title',
      });
      return;
    }

    if (selectedUsers.length < 2) {
      Toast.show({
        type: 'error',
        text2: 'Please select at least 2 members',
      });
      return;
    }

    // All good, proceed with group creation
    console.log('Creating group:', {
      title: groupTitle.trim(),
      members: selectedUsers,
    });
  };

  // Render selected users chips
  const renderSelectedUsers = () => {
    if (selectedUsers.length === 0) {
      return null;
    }

    return (
      <View style={styles.selectedUsersContainer}>
        <FlatList
          data={selectedUsers}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <View style={styles.userChip}>
              <Image source={{uri: item.avatar}} style={styles.chipAvatar} />
              <Text style={styles.chipText}>{item.username}</Text>
              <TouchableOpacity
                onPress={() => handleUserRemove(item._id)}
                style={styles.chipRemove}>
                <Icon name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  };

  // Render user list item
  const renderUserItem = ({item}) => {
    const isSelected = selectedUsers.some(user => user._id === item._id);

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => handleUserSelect(item)}
        disabled={isSelected}>
        <Image source={{uri: item.avatar}} style={styles.avatar} />
        <Text style={styles.username}>{item.username}</Text>
        {isSelected && (
          <Icon
            name="check-circle"
            size={24}
            color="#4CAF50"
            style={styles.checkIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Icon
            name="magnify"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Selected Users */}
      {renderSelectedUsers()}

      {/* Users List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9F0A" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.loadingContainer}>
              <Text>No users found</Text>
            </View>
          }
        />
      )}

      {selectedUsers.length > 0 && (
        <View style={styles.members}>
          <Text>{selectedUsers.length} members selected</Text>
        </View>
      )}

      <View style={styles.searchContainerTwo}>
        <Icon
          name="account-group"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Group Title"
          value={groupTitle}
          onChangeText={setGroupTitle}
        />
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
        <Text style={styles.createButtonText}>Create Group</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  members: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 16,
  },
  searchContainerTwo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
  },

  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  selectedUsersContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    marginRight: 4,
  },
  chipRemove: {
    marginLeft: 4,
  },
  listContainer: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userItemSelected: {
    backgroundColor: '#f8f8f8',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#FF9F0A',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateGroup;
