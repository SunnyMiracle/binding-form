'use strict';

const {injectBabelPlugin} = require('react-app-rewired');
const rewireLessWithModule = require('react-app-rewire-less-with-modules');

module.exports = function override(config, env) {

  // 增加 './' 解决 less 上 background-image: url('./xxx.png') 找不到图片的错误
  // https://github.com/webpack-contrib/css-loader/issues/74
  // TODO 业务站点不支持 less 加载图片，关闭此兼容方法
  // config.resolve.modules.push('./');

  config = injectBabelPlugin('babel-plugin-transform-decorators-legacy', config);

  // supports css-module
  config = rewireLessWithModule(config, env, {
    modifyVars: {
      // '@primary-color': 'red', // 仅测试用
    },
  });

  return config

};
