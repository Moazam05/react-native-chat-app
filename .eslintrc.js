module.exports = {
  root: true,
  extends: '@react-native',

  rules: {
    'no-unused-vars': 'error',
    'react/prop-types': 'off', // Disable prop types as error
    'no-constant-condition': 'off', // Disable the constant condition error
    'react/no-unescaped-entities': 'off', // Disable unescaped entities error
    'react-hooks/exhaustive-deps': 'off', // Disable exhaustive deps warning
    'react-native/no-unused-styles': 'error', // Add this rule
  },
};
