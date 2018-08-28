/**
 * @file webpack config for swan
 * @author houyu(houyu01@baidu.com)
 */
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const pkg = require('./package.json');
const webpack = require('webpack');
module.exports = {
    entry: {
        master: __dirname + '/src/master/index.js',
        slaves: __dirname + '/src/slave/index.js'
    },
    output: {
        path: __dirname + '/dist/box/',
        filename: '[name]/index.js',
        libraryTarget: "umd"
    },
    // devtool: 'source-map',
    plugins: [
        new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false
        }),
        new webpack.optimize.UglifyJsPlugin({
            // sourceMap: true,
            compress: {
                warnings: false,
                /* eslint-disable fecs-camelcase */
                drop_console: false
                /* eslint-disable fecs-camelcase */
            },
            // sourceMap: true,
            comments: false
        }),
        
        new CopyWebpackPlugin([{
            from: __dirname + '/src/templates/**/*',
            to: __dirname + '/dist/box/[1]/[name].[ext]',
            test: /([^/]+)\/([^/]+)\.[^.]+$/
        }])
    ],
    // devtool: '#source-map',
    module: {
        loaders: [{
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: ['env'],
                    plugins: [
                        'transform-class-properties', ['transform-object-rest-spread', {'useBuiltIns': true}],
                        'transform-decorators-legacy',
                        'transform-object-assign',
                        ['istanbul', {
                            'exclude': [
                                'src/utils/**/*.js',
                                'test/spec/*.js',
                                'src/master/custom-component/index.js'
                            ]
                        }]
                    ]
                }
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader?modules&localIdentName=[local]'
                })
            },
            {
                test: /\.(png|jpg|ttf|woff|eot|svg)$/,
                loader: 'url-loader'
            }
        ]
    }
};
