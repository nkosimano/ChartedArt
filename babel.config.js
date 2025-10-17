module.exports = function(api) {
  api.cache(true);
  
  const presets = [
    ['@babel/preset-env', {
      targets: {
        node: 'current',
      },
    }],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ];

  const plugins = [
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-nullish-coalescing-operator', { loose: true }],
    ['@babel/plugin-transform-optional-chaining', { loose: true }],
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    'react-native-reanimated/plugin'
  ];

  return {
    presets,
    plugins,
  };
};
