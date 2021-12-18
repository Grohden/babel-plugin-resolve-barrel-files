"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
Object.defineProperty(exports, "Bar", {
  enumerable: true,
  get: function() {
    return _fooBar.Bar;
  },
});
Object.defineProperty(exports, "Bazz", {
  enumerable: true,
  get: function() {
    return _bazz.Abc;
  },
});
Object.defineProperty(exports, "Buzz", {
  enumerable: true,
  get: function() {
    return _buzz.default;
  },
});
Object.defineProperty(exports, "Foo", {
  enumerable: true,
  get: function() {
    return _fooBar.Foo;
  },
});
Object.defineProperty(exports, "Unique", {
  enumerable: true,
  get: function() {
    return _wildcard.Unique;
  },
});
Object.defineProperty(exports, "Wildcard", {
  enumerable: true,
  get: function() {
    return _wildcard.default;
  },
});

var _fooBar = require("./foo-bar");

var _bazz = require("./bazz");

var _buzz = _interopRequireDefault(require("./buzz"));

var _wildcard = _interopRequireWildcard(require("./wildcard"));

function _getRequireWildcardCache(nodeInterop) {
  if (typeof WeakMap !== "function") return null;
  var cacheBabelInterop = new WeakMap();
  var cacheNodeInterop = new WeakMap();
  return (_getRequireWildcardCache = function(nodeInterop) {
    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
  })(nodeInterop);
}

function _interopRequireWildcard(obj, nodeInterop) {
  if (!nodeInterop && obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== "object" && typeof obj !== "function")) {
    return { default: obj };
  }
  var cache = _getRequireWildcardCache(nodeInterop);
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
