import {ANDROID_API_URL, IOS_API_URL} from '@env';
import {Platform} from 'react-native';
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';

console.log('ANDROID_API_URL:', ANDROID_API_URL);

export const apiSlice = createApi({
  reducerPath: 'api', // Unique and descriptive reducerPath

  baseQuery: fetchBaseQuery({
    baseUrl: Platform.OS === 'ios' ? IOS_API_URL : ANDROID_API_URL,
    prepareHeaders: (headers, {getState}) => {
      const token = getState().auth?.user?.token || '';
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      headers.set('Accept', 'application/json');

      // Add iOS specific headers if needed
      if (Platform.OS === 'ios') {
        headers.set('Cache-Control', 'no-cache');
      }

      return headers;
    },
  }),
  tagTypes: [], // Define tag types as needed for cache invalidation
  endpoints: builder => ({
    // Define your endpoints here
  }),
});
