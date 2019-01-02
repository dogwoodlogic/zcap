/**
 * ocapld webpack build rules.
 *
 * @author Digital Bazaar, Inc.
 *
 * Copyright 2010-2017 Digital Bazaar, Inc.
 */
const path = require('path');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');

// build multiple outputs
module.exports = [];

// custom setup for each output
// all built files will export the "ocapld" library but with
// different content
const outputs = [
  // core ocapld library
  {
    entry: [
      // 'babel-polyfill' is very large, list features explicitly
      'regenerator-runtime/runtime',
      //'core-js/fn/array/includes',
      'core-js/fn/object/assign',
      'core-js/fn/promise',
      // main lib
      './lib/index.js'
    ],
    filenameBase: 'ocapld'
  },
  /*
  // core jsonld library + extra utils and networking support
  {
    entry: ['./lib/index.all.js'],
    filenameBase: 'jsonld.all'
  }
  */
  // custom builds can be created by specifying the high level files you need
  // webpack will pull in dependencies as needed
  // Note: if using UMD or similar, add jsonld.js *last* to properly export
  // the top level jsonld namespace.
  //{
  //  entry: ['./lib/FOO.js', ..., './lib/jsonld.js'],
  //  filenameBase: 'jsonld.custom'
  //  libraryTarget: 'umd'
  //}
];

outputs.forEach((info) => {
  // common to bundle and minified
  const common = {
    // each output uses the "jsonld" name but with different contents
    entry: {
      'ocapld': info.entry
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          include: [{
            // exclude node_modules by default
            exclude: /(node_modules)/
          }/*, {
            // include jsonld
            include: /(node_modules\/jsonld)/
          }, {
            // include jsonld-signatures
            include: /(node_modules\/jsonld-signatures)/
          }*/],
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['env'],
              plugins: [
                ['transform-object-rest-spread', {useBuiltIns: true}]
              ]
            }
          }
        }
      ]
    },
    plugins: [
      //new webpack.DefinePlugin({
      //})
    ],
    // disable various node shims as jsonld handles this manually
    node: {
      Buffer: false,
      crypto: false,
      process: false,
      setImmediate: false
    },
    resolve: {
      alias: {
        'bitcore-message':
          require.resolve('bitcore-message/dist/bitcore-message.js'),
        jsonld: require.resolve('jsonld/dist/jsonld.js'),
//        'jsonld-signatures': require.resolve(
//          'jsonld-signatures/dist/jsonld-signatures.js')
      }
    }
  };

  // plain unoptimized unminified bundle
  const bundle = webpackMerge(common, {
    output: {
      path: path.join(__dirname, 'dist'),
      filename: info.filenameBase + '.js',
      library: info.library || '[name]',
      libraryTarget: info.libraryTarget || 'umd'
    }
  });
  if(info.library === null) {
    delete bundle.output.library;
  }
  if(info.libraryTarget === null) {
    delete bundle.output.libraryTarget;
  }

  // optimized and minified bundle
  const minify = webpackMerge(common, {
    output: {
      path: path.join(__dirname, 'dist'),
      filename: info.filenameBase + '.min.js',
      library: info.library || '[name]',
      libraryTarget: info.libraryTarget || 'umd'
    },
    devtool: 'cheap-module-source-map',
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: true
        },
        output: {
          comments: false
        }
        //beautify: true
      })
    ]
  });
  if(info.library === null) {
    delete minify.output.library;
  }
  if(info.libraryTarget === null) {
    delete minify.output.libraryTarget;
  }

  module.exports.push(bundle);
  module.exports.push(minify);
});
