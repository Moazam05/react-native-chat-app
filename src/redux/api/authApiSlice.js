import {apiSlice} from './apiSlice';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    signup: builder.mutation({
      query: data => {
        return {
          url: 'users/signup',
          method: 'POST',
          body: data,
        };
      },
    }),
    login: builder.mutation({
      query: data => {
        return {
          url: 'users/login',
          method: 'POST',
          body: data,
        };
      },
    }),

    logout: builder.mutation({
      query: data => {
        return {
          url: 'users/logout',
          method: 'POST',
          body: data,
        };
      },
    }),
  }),
});

export const {useSignupMutation, useLoginMutation, useLogoutMutation} =
  authApiSlice;
