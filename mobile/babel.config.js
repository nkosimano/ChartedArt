module.exports = function(api) {
  api.cache(true);
  
  const presets = [
    'babel-preset-expo',
    '@babel/preset-typescript',
  ];

  const plugins = [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src'
        }
      }
    ],
    'react-native-reanimated/plugin',
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['@babel/plugin-transform-nullish-coalescing-operator', { loose: true }],
    ['@babel/plugin-transform-optional-chaining', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }]
  ];

  return {
    presets,
    plugins,
  };
};