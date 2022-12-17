const path = require('path');
const { DefinePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const publicPath = path.resolve(__dirname, 'public');
const srcPath = path.resolve(__dirname, 'src');
const buildPath = path.resolve(__dirname, 'dist');

module.exports = (env, argv) => {
  const development = argv.mode === 'development' ?? false;
  
  return {
    entry: path.join(srcPath, 'index.ts'),

    output: {
      path: buildPath,
      filename: 'bundle.js',
    },

    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      compress: true,
      hot: true,
      server: 'http',
      headers: {
        'Access-Control-Allow-Origin': '*',
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
      },
      historyApiFallback: true
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        },
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          loader: 'ts-loader',
        },
      ],
    },

    resolve: {
      extensions: ['*', '.js', '.ts', '.css'],
      alias: {
        config$: path.resolve(__dirname, development ? 'config.ts' : 'empty-config.ts' )
      }
    },

    devtool: 'inline-source-map',

    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(publicPath, 'index.html'),
        filename: 'index.html',
      }),
    ],
  }
};
