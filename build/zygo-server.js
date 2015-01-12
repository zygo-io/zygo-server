"use strict";
Object.defineProperties(exports, {
  default: {get: function() {
      return $__default;
    }},
  __esModule: {value: true}
});
var EventEmitter = require('events').EventEmitter;
var Config = require('./config');
var zygo = new EventEmitter();
zygo.initialise = function(configFile) {
  Zygo.config = new Config(configFile);
  try {
    Zygo.config.parse();
  } catch (error) {
    throw error;
  }
};
zygo.on('serialise', function() {});
var $__default = zygo;
//# sourceURL=zygo-server.js