"use strict";
Object.defineProperties(exports, {
  generateTitle: {get: function() {
      return generateTitle;
    }},
  generateBody: {get: function() {
      return generateBody;
    }},
  generateHeader: {get: function() {
      return generateHeader;
    }},
  generateFooter: {get: function() {
      return generateFooter;
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
function generateTitle() {
  return Promise.resolve().then(function() {
    return '<title>' + Zygo.state.route.title + '</title>';
  });
}
function generateBody() {
  return Jspm.import(Zygo.pageComponent).then(function(component) {
    var element = React.createElement(component, Zygo.state);
    return React.renderToString(element);
  });
}
function generateHeader() {
  return Promise.resolve().then(function() {
    return "";
  });
}
function generateFooter() {
  return Promise.resolve().then(function() {
    return "<script>\n" + "System.paths['zygo/*'] = '/zygo_internals/zygo.js';" + "System.import('zygo').then(function(zygo) {\n" + "  zygo._setInitialState(\n" + JSON.stringify(Zygo.state) + "  );\n" + "});";
  });
}
//# sourceURL=attach.js