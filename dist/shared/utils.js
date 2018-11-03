"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validNick = validNick;
exports.findIndex = findIndex;
exports.sanitizeString = sanitizeString;

(function () {
  var enterModule = require('react-hot-loader').enterModule;

  enterModule && enterModule(module);
})();

function validNick(nickname) {
  var regex = /^\w*$/;
  return regex.exec(nickname) !== null;
}

function findIndex(arr, id) {
  var len = arr.length;

  while (len--) {
    if (arr[len].id === id) {
      return len;
    }
  }

  return -1;
}

function sanitizeString(message) {
  return message.replace(/(<([^>]+)>)/ig, '').substring(0, 35);
}

;

(function () {
  var reactHotLoader = require('react-hot-loader').default;

  var leaveModule = require('react-hot-loader').leaveModule;

  if (!reactHotLoader) {
    return;
  }

  reactHotLoader.register(validNick, "validNick", "D:\\Development\\roketz\\src\\shared\\utils.js");
  reactHotLoader.register(findIndex, "findIndex", "D:\\Development\\roketz\\src\\shared\\utils.js");
  reactHotLoader.register(sanitizeString, "sanitizeString", "D:\\Development\\roketz\\src\\shared\\utils.js");
  leaveModule(module);
})();

;