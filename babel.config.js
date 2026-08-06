// Babel config standard per Expo + supporto ai path assoluti "@/..."
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: { '@': './src' },
          extensions: ['.ts', '.tsx', '.js', '.json'],
        },
      ],
    ],
  };
};
