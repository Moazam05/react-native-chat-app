import {apiSlice} from './apiSlice';

export const messageApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    createMessage: builder.mutation({
      query: ({chatId, ...messageData}) => {
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
      invalidatesTags: ['Messages'],
    }),

    getMessages: builder.query({
      query: ({chatId}) => {
        return {
          url: `messages/${chatId}`,
          method: 'GET',
        };
      },
      providesTags: ['Messages'],
    }),
  }),
});

export const {useCreateMessageMutation, useGetMessagesQuery} = messageApiSlice;
