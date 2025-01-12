// Redux Toolkit Imports
import {createSlice} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getInitialUser = async () => {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getInitialUser(),
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
  },
});

export const {setUser} = authSlice.actions;
export default authSlice.reducer;

export const selectedUser = state => state.auth.user;
