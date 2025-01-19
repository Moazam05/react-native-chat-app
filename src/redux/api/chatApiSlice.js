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

    // todo: Group CHAT
    createGroupChat: builder.mutation({
      query: data => {
        return {
          url: 'chats/group',
          method: 'POST',
          body: data,
        };
      },
      invalidatesTags: ['Chats'],
    }),

    updateGroupChat: builder.mutation({
      query: ({chatId, data}) => {
        return {
          url: `chats/group/${chatId}`,
          method: 'PUT',
          body: data,
        };
      },
      invalidatesTags: ['Chats'],
    }),

    groupInfo: builder.query({
      query: id => {
        return {
          url: `chats/group/${id}`,
          method: 'GET',
        };
      },
    }),

    addGroupMember: builder.mutation({
      query: ({data, chatId}) => {
        return {
          url: `chats/group/${chatId}/add`,
          method: 'POST',
          body: data,
        };
      },
      invalidatesTags: ['Chats'],
    }),

    removeGroupMember: builder.mutation({
      query: ({data, chatId}) => {
        return {
          url: `chats/group/${chatId}`,
          method: 'DELETE',
          body: data,
        };
      },
      invalidatesTags: ['Chats'],
    }),
  }),
});

export const {
  useCreateChatMutation,
  useGetChatQuery,
  useCreateGroupChatMutation,
  useUpdateGroupChatMutation,
  useGroupInfoQuery,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
} = chatApiSlice;
