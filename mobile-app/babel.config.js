module.exports = function (api) {
  api.cache(true);

  const plugins = [];
  const presets = ['babel-preset-expo'];

  // Only include nativewind/babel plugin if not in test environment
  if (process.env.NODE_ENV !== 'test') {
    plugins.push('nativewind/babel');
  } else {
    // In test environment, add Flow preset to handle React Native's Flow syntax
    presets.push('@babel/preset-flow');
  }

  return {
    presets,
    plugins,
  };
};
