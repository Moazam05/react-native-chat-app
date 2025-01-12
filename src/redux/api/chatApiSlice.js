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
  }),
});

export const {useGetMessageByChatIdQuery} = chatApiSlice;
