module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Required for react-native-reanimated
    'react-native-reanimated/plugin',

    // Module resolver for path aliases
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.jsx',
          '.js',
          '.json',
        ],
        alias: {
          '@': './src',
          '@screens': './src/screens',
          '@components': './src/components',
          '@navigation': './src/navigation',
          '@native': './src/native',
          '@stores': './src/stores',
          '@api': './src/api',
          '@hooks': './src/hooks',
          '@theme': './src/theme',
          '@shared': '../src/shared',
        },
      },
    ],
  ],
}
