import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import React, {useState} from 'react';
import {
  useGroupInfoQuery,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
  useUpdateGroupChatMutation,
} from '../../../redux/api/chatApiSlice';
import {useGetAllUsersQuery} from '../../../redux/api/userApiSlice';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {getGroupColor, getInitial} from '../../../utils';
import useTypedSelector from '../../../hooks/useTypedSelector';
import {selectedUser} from '../../../redux/auth/authSlice';

const GroupInfo = () => {
  const route = useRoute();
  const {chatId} = route.params;
  const currentUser = useTypedSelector(selectedUser);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // APIs
  const {data: groupInfo} = useGroupInfoQuery(chatId);
  const [updateGroup] = useUpdateGroupChatMutation();
  const [addToGroup] = useAddGroupMemberMutation();
  const [removeFromGroup] = useRemoveGroupMemberMutation();
  const {data: allUsers} = useGetAllUsersQuery({});

  const chat = groupInfo?.data?.chat;
  const isAdmin = chat?.groupAdmin?._id === currentUser?.data?.user?._id;

  // Handle group name update
  const handleUpdateName = async () => {
    if (!newGroupName.trim()) {
      return;
    }
    try {
      await updateGroup({
        chatId,
        chatName: newGroupName.trim(),
      }).unwrap();
      setIsEditingName(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update group name');
    }
  };

  // Handle adding members
  const handleAddMember = async userId => {
    try {
      await addToGroup({
        chatId,
        userId,
      }).unwrap();
      setShowAddMembers(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add member');
    }
  };

  // Handle removing members
  const handleRemoveMember = async userId => {
    try {
      await removeFromGroup({
        chatId,
        userId,
      }).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to remove member');
    }
  };

  // Filter users for add member modal
  const filteredUsers =
    allUsers?.users?.filter(
      user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !chat?.users.some(member => member._id === user._id),
    ) || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Group Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.groupAvatar,
            {backgroundColor: getGroupColor(chat?.chatName)},
          ]}>
          <Text style={styles.groupInitial}>{getInitial(chat?.chatName)}</Text>
        </View>

        {isEditingName ? (
          <View style={styles.editNameContainer}>
            <TextInput
              style={styles.nameInput}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Enter group name"
              autoFocus
            />
            <TouchableOpacity
              onPress={handleUpdateName}
              style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameContainer}>
            <Text style={styles.groupName}>{chat?.chatName}</Text>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => {
                  setNewGroupName(chat?.chatName);
                  setIsEditingName(true);
                }}>
                <Icon name="pencil" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Admin Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin</Text>
        <View style={styles.memberItem}>
          <Image
            source={{uri: chat?.groupAdmin?.avatar}}
            style={styles.memberAvatar}
          />
          <Text style={styles.memberName}>{chat?.groupAdmin?.username}</Text>
        </View>
      </View>

      {/* Members Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Members ({chat?.users?.length})
          </Text>
          {isAdmin && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddMembers(true)}>
              <Icon name="account-plus" size={24} color="#4CAF50" />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={chat?.users}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <View style={styles.memberItem}>
              <Image source={{uri: item.avatar}} style={styles.memberAvatar} />
              <Text style={styles.memberName}>{item.username}</Text>
              {isAdmin && item._id !== chat?.groupAdmin?._id && (
                <TouchableOpacity
                  onPress={() => handleRemoveMember(item._id)}
                  style={styles.removeButton}>
                  <Icon name="account-remove" size={20} color="#ff4444" />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>

      {/* Add Members Modal */}
      <Modal visible={showAddMembers} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Members</Text>
              <TouchableOpacity onPress={() => setShowAddMembers(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search users"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredUsers}
              keyExtractor={item => item._id}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => handleAddMember(item._id)}>
                  <Image
                    source={{uri: item.avatar}}
                    style={styles.memberAvatar}
                  />
                  <Text style={styles.memberName}>{item.username}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupInitial: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '600',
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    fontSize: 20,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    padding: 4,
    minWidth: 200,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberName: {
    fontSize: 16,
    flex: 1,
  },
  removeButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default GroupInfo;
