const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize bundle size
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver configuration for better module resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Exclude unnecessary files from bundle
config.resolver.blockList = [
  /.*\/node_modules\/.*\/node_modules\/react-native\/.*/,
  /.*\/node_modules\/.*\/node_modules\/@expo\/.*/,
];

// Optimize asset handling
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

module.exports = config; 