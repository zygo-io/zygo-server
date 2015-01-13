"use strict";
Object.defineProperties(exports, {
  renderComponent: {get: function() {
      return renderComponent;
    }},
  __esModule: {value: true}
});
var $__jspm__,
    $__react__,
    $__zygo_45_server__,
    $__fs__;
var Jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var React = ($__react__ = require("react"), $__react__ && $__react__.__esModule && $__react__ || {default: $__react__}).default;
var zygo = ($__zygo_45_server__ = require("./zygo-server"), $__zygo_45_server__ && $__zygo_45_server__.__esModule && $__zygo_45_server__ || {default: $__zygo_45_server__});
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
function renderComponent(component, state) {
  var result = {
    zygoBody: null,
    zygoHeader: null,
    zygoFooter: null
  };
  return Promise.resolve().then((function() {
    return getBody(component, title);
  })).then((function(body) {
    return result.body = body;
  })).then((function() {
    return getHeader();
  })).then((function(header) {
    return result.zygoHeader = header;
  })).then((function() {
    return getFooter();
  })).then((function(footer) {
    return result.zygoFooter = footer;
  })).then((function() {
    return result;
  }));
}
function getBody(component, title) {
  return Promise.resolve();
}
function getHeader() {
  return Promise.resolve();
}
function getFooter() {
  return Promise.resolve();
}
//# sourceURL=render.js