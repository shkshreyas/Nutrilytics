module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Optimize bundle size - remove console logs in production
      process.env.NODE_ENV === 'production' && 'transform-remove-console',
      'react-native-reanimated/plugin',
    ].filter(Boolean),
  };
}; 