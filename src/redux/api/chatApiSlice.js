import {apiSlice} from './apiSlice';

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getMessageByChatId: builder.query({
      query: ({chatId}) => {
        return {
          url: `messages/${chatId}`,
          method: 'GET',
        };
      },
    }),

    getUserAllChats: builder.query({
      query: () => {
        return {
          url: 'chats/user-chats',
          method: 'GET',
        };
      },
    }),
  }),
});

export const {useGetMessageByChatIdQuery, useGetUserAllChatsQuery} =
  chatApiSlice;
