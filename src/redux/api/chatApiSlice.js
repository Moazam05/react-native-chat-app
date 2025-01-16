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
      providesTags: ['Message'],
    }),

    getUserAllChats: builder.query({
      query: () => {
        return {
          url: 'chats/user-chats',
          method: 'GET',
        };
      },
      providesTags: ['Message'],
    }),

    sendMessage: builder.mutation({
      query: ({chatId, ...messageData}) => {
        console.log('chatId', chatId);
        console.log('messageData', messageData);
        // Check if messageData contains a file
        if (messageData.file) {
          const formData = new FormData();

          if (messageData.messageType) {
            formData.append('messageType', messageData.messageType);
          }
          if (messageData.content) {
            formData.append('content', messageData.content);
          }
          formData.append('file', messageData.file);

          return {
            url: `messages/${chatId}`,
            method: 'POST',
            body: formData,
          };
        }

        // For text messages
        return {
          url: `messages/${chatId}`,
          method: 'POST',
          body: messageData,
        };
      },
      invalidatesTags: ['Message'],
    }),
  }),
});

export const {
  useGetMessageByChatIdQuery,
  useGetUserAllChatsQuery,
  useSendMessageMutation,
} = chatApiSlice;
