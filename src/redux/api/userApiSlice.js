import {apiSlice} from './apiSlice';

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getAllUsers: builder.query({
      query: () => {
        return {
          url: 'users',
          method: 'GET',
        };
      },
    }),

    updateUser: builder.mutation({
      query: ({...userData}) => {
        // Check if userData contains an avatar
        if (userData.avatar) {
          const formData = new FormData();

          if (userData.username) {
            formData.append('username', userData.username);
          }

          // Append avatar file
          formData.append('avatar', userData.avatar);

          return {
            url: 'users/updateMe',
            method: 'PUT',
            body: formData,
          };
        }

        // For username update only
        return {
          url: 'users/updateMe',
          method: 'PUT',
          body: userData,
        };
      },
    }),
  }),
});

export const {useGetAllUsersQuery, useUpdateUserMutation} = userApiSlice;
