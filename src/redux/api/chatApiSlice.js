import {apiSlice} from './apiSlice';

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createChat: builder.mutation({
      query: data => {
        return {
          url: 'chats',
          method: 'POST',
          body: data,
        };
      },
      invalidatesTags: ['Chats'],
    }),

    getChat: builder.query({
      query: () => {
        return {
          url: 'chats',
          method: 'GET',
        };
      },
      providesTags: ['Chats', 'Messages'],
    }),
  }),
});

export const {useCreateChatMutation, useGetChatQuery} = chatApiSlice;
