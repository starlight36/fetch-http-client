module.exports = {

  output: {
    library: 'FetchHttpClient',
    libraryTarget: 'umd',
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' },
    ],
  },

};
