require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){

var Result = require('result')
var ResultType = Result.Type
var when = Result.read

/**
 * Teach a node function all about the Result type
 *
 *   var readFile = resultify(fs.readFile)
 *   readFile('/path/to/file.js', 'utf8').then(function(src){
 *     process.stdout.write(src)
 *   })
 *
 * @param {Function} fn must take a callback as its last parameter
 * @return {Result}
 */

module.exports = function(fn){
  return function(){
    var result = new Result
    var i = arguments.length

    // scan for Result parameters
    while (i--) if (arguments[i] instanceof ResultType) {
      var args = arguments
      var self = this
      var fail = function(e){
        result.error(e)
      }
      var next = function(value){
        args[i] = value
        if (i > 0) return when(args[--i], next, fail)
        // call `fn` (apply is slow)
        try { switch (args.length) {
          case 0: fn.call(self, cb); break;
          case 1: fn.call(self, args[0], cb); break;
          case 2: fn.call(self, args[0], args[1], cb); break;
          case 3: fn.call(self, args[0], args[1], args[2], cb); break;
          default:
            args[args.length++] = cb
            fn.apply(self, args)
        } } catch (e) { result.error(e) }
      }
      args[i].read(next, fail)
      return result
    }

    // call `fn` (apply is slow)
    try { switch (arguments.length) {
      case 0: fn.call(this, cb); break;
      case 1: fn.call(this, arguments[0], cb); break;
      case 2: fn.call(this, arguments[0], arguments[1], cb); break;
      case 3: fn.call(this, arguments[0], arguments[1], arguments[2], cb); break;
      default:
        arguments[arguments.length++] = cb
        fn.apply(this, arguments)
    } } catch (e) { result.error (e) }

    function cb(error, value){
      if (error) result.error(error)
      else result.write(value)
    }

    return result
  }
}

},{"result":5}],5:[function(require,module,exports){

var ResultType = require('result-type')
var ResultCore = require('result-core')
var listen = ResultCore.prototype.listen

/**
 * expose `Result`
 */

module.exports = exports = Result

/**
 * expose helpers
 */

exports.wrap = exports.done = wrap
exports.transfer = transfer
exports.Type = ResultType
exports.coerce = coerce
exports.failed = failed
exports.unbox = unbox
exports.when = when
exports.read = read

/**
 * the Result class
 */

function Result(){}

/**
 * inherit from ResultCore
 */

Result.prototype = new ResultCore
Result.prototype.constructor = Result

/**
 * Create a Result for a transformation of the value
 * of `this` Result
 *
 * @param  {Function} onValue
 * @param  {Function} onError
 * @return {Result}
 */

Result.prototype.then = function(onValue, onError) {
  switch (this.state) {
    case 'fail': onValue = onError // falls through
    case 'done':
      if (!onValue) return this
      try {
        return coerce(onValue.call(this, this.value))
      } catch (e) {
        return failed(e)
      }
    default:
      var x = new Result
      this.listen(
        handle(x, onValue, 'write', this),
        handle(x, onError, 'error', this))
      return x
  }
}

/**
 * read using a node style function
 *
 *   result.node(function(err, value){})
 *
 * @param  {Function} [callback(error, value)]
 * @return {this}
 */

Result.prototype.node = function(fn){
  if (typeof fn != 'function') return this
  return this.read(function(v){ fn(null, v) }, fn)
}

/**
 * Create a child Result destined to fulfill with `value`
 *
 *   return result.then(function(value){
 *     // some side effect
 *   }).yield(e)
 *
 * @param  {x} value
 * @return {Result}
 */

Result.prototype.yield = function(value){
  return this.then(function(){ return value })
}

/**
 * return a Result for `this[attr]`
 *
 * @param {String} attr
 * @return {Result}
 */

Result.prototype.get = function(attr){
  return this.then(function(obj){ return obj[attr] })
}

/**
 * wrap `reason` in a "failed" result
 *
 * @param {x} reason
 * @return {Result}
 * @api public
 */

function failed(reason){
  var res = new Result
  res.value = reason
  res.state = 'fail'
  return res
}

/**
 * wrap `value` in a "done" Result
 *
 * @param {x} value
 * @return {Result}
 * @api public
 */

function wrap(value){
  var res = new Result
  res.value = value
  res.state = 'done'
  return res
}

/**
 * coerce `value` to a Result
 *
 * @param {x} value
 * @return {Result}
 * @api public
 */

function coerce(value){
  if (!(value instanceof ResultType)) return wrap(value)
  if (value instanceof Result) return value
  var result = new Result
  switch (value.state) {
    case 'done': result.write(value.value); break
    case 'fail': result.error(value.value); break
    default:
      (value.listen || listen).call(value,
        function(value){ result.write(value) },
        function(error){ result.error(error) })
  }
  return result
}

/**
 * create a function which will propagate a value/error
 * onto `result` when called. If `fn` is present it
 * will transform the value/error before assigning the
 * result to `result`
 *
 * @param {Function} result
 * @param {Function} fn
 * @param {String} method
 * @param {Any} [ctx]
 * @return {Function}
 * @api private
 */

function handle(result, fn, method, ctx){
  return typeof fn != 'function'
    ? function(x){ return result[method](x) }
    : function(x){
      try { transfer(fn.call(ctx, x), result) }
      catch (e) { result.error(e) }
    }
}

/**
 * run `value` through `onValue`. If `value` is a
 * "failed" promise it will be passed to `onError`
 * instead. Any errors will result in a "failed"
 * promise being returned rather than an error
 * thrown so you don't have to use a try catch
 *
 * @param {Any} result
 * @param {Function} onValue
 * @param {Function} onError
 * @return {Any}
 */

function when(value, onValue, onError){
  if (value instanceof ResultType) switch (value.state) {
    case 'fail':
      if (!onError) return value
      onValue = onError
      value = value.value
      break
    case 'done':
      value = value.value
      break
    default:
      var x = new Result
      var fn = value.listen || listen // backwards compat
      fn.call(value,
        handle(x, onValue, 'write', this),
        handle(x, onError, 'error', this))
      // unbox if possible
      return x.state == 'done' ? x.value : x
  }
  if (!onValue) return value
  try { return onValue.call(this, value)  }
  catch (e) { return failed.call(this, e) }
}

/**
 * read `value` even if its within a promise
 *
 * @param {x} value
 * @param {Function} onValue
 * @param {Function} onError
 */

function read(value, onValue, onError){
  if (value instanceof ResultType) value.read(onValue, onError)
  else onValue(value)
}

/**
 * transfer the value of `a` to `b`
 *
 * @param {Any} a
 * @param {Result} b
 */

function transfer(a, b){
  if (a instanceof ResultType) switch (a.state) {
    case 'done': b.write(a.value); break
    case 'fail': b.error(a.value); break
    default:
      var fn = a.listen || listen // backwards compat
      fn.call(a,
        function(value){ b.write(value) },
        function(error){ b.error(error) })
  } else {
    b.write(a)
  }
}

/**
 * attempt to unbox a value synchronously
 *
 * @param {Any} value
 * @return {Any}
 * @throws {Error} If given a pending result
 * @throws {Any} If given a failed result
 */

function unbox(value){
  if (!(value instanceof ResultType)) return value
  if (value.state == 'done') return value.value
  if (value.state == 'fail') throw value.value
  throw new Error('can\'t unbox a pending result')
}

},{"result-core":6,"result-type":9}],6:[function(require,module,exports){

var ResultType = require('result-type')
var nextTick = require('next-tick')

module.exports = Result

/**
 * the result class
 */

function Result(){}

/**
 * inherit from ResultType
 */

Result.prototype = new ResultType

/**
 * default state
 * @type {String}
 */

Result.prototype.state = 'pending'

/**
 * give `this` its value
 *
 * @param {x} value
 * @return {this}
 */

Result.prototype.write = function(value){
  if (this.state == 'pending') {
    this.state = 'done'
    this.value = value
    this._onValue && run(this, this._onValue)
  }
  return this
}

/**
 * give `this` its reason for failure
 *
 * @param {x} reason
 * @return {this}
 */

Result.prototype.error = function(reason){
  if (this.state == 'pending') {
    this.state = 'fail'
    this.value = reason
    this._onError && run(this, this._onError)
  }
  return this
}

/**
 * access the result of `this`
 *
 * @param {Function} onValue
 * @param {Function} onError
 * @return {this}
 */

Result.prototype.read = function(onValue, onError){
  switch (this.state) {
    case 'done':
      onValue && runFn(this, onValue)
      break
    case 'fail':
      if (onError) runFn(this, onError)
      else rethrow(this.value)
      break
    default:
      this.listen(onValue, onError || rethrow)
  }
  return this
}

/**
 * add listeners for the result
 *
 * @param {Function} onValue
 * @param {Function} onError
 * @return {this}
 */

Result.prototype.listen = function(onValue, onError){
  onValue && listen(this, '_onValue', onValue)
  onError && listen(this, '_onError', onError)
}

function listen(obj, prop, fn){
  var fns = obj[prop]
  if (!fns) obj[prop] = fn
  else if (typeof fns == 'function') obj[prop] = [fns, fn]
  else obj[prop].push(fn)
}

/**
 * dispatch to `runFn` on the type of `fns`
 *
 * @param {Function} fns
 * @param {ctx} Result
 * @api private
 */

function run(ctx, fns){
  if (typeof fns == 'function') runFn(ctx, fns)
  else for (var i = 0, len = fns.length; i < len;) {
    runFn(ctx, fns[i++])
  }
}

/**
 * run `fn` and re-throw any errors with a clean
 * stack to ensure they aren't caught unwittingly.
 * since readers are sometimes run now and sometimes
 * later the following would be non-deterministic
 *
 *   try {
 *     result.read(function(){
 *       throw(new Error('boom'))
 *     })
 *   } catch (e) {
 *     // if result is "done" boom is caught, while
 *     // if result is "pending" it won't be caught
 *   }
 *
 * @param {Function} fn
 * @param {Result} ctx
 * @api private
 */

function runFn(ctx, fn){
  try { fn.call(ctx, ctx.value) }
  catch (e) { rethrow(e) }
}

function rethrow(error){
  nextTick(function(){ throw error })
}

},{"next-tick":7,"result-type":9}],7:[function(require,module,exports){
(function (process){
"use strict"

if (typeof setImmediate == 'function') {
  module.exports = function(f){ setImmediate(f) }
}
// legacy node.js
else if (typeof process != 'undefined' && typeof process.nextTick == 'function') {
  module.exports = process.nextTick
}
// fallback for other environments / postMessage behaves badly on IE8
else if (typeof window == 'undefined' || window.ActiveXObject || !window.postMessage) {
  module.exports = function(f){ setTimeout(f) };
} else {
  var q = [];

  window.addEventListener('message', function(){
    var i = 0;
    while (i < q.length) {
      try { q[i++](); }
      catch (e) {
        q = q.slice(i);
        window.postMessage('tic!', '*');
        throw e;
      }
    }
    q.length = 0;
  }, true);

  module.exports = function(fn){
    if (!q.length) window.postMessage('tic!', '*');
    q.push(fn);
  }
}

}).call(this,require('_process'))
},{"_process":3}],8:[function(require,module,exports){
(function (process){
var path = require('path');
var fs = require('fs');
var _0777 = parseInt('0777', 8);

module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

function mkdirP (p, opts, f, made) {
    if (typeof opts === 'function') {
        f = opts;
        opts = {};
    }
    else if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs;
    
    if (mode === undefined) {
        mode = _0777 & (~process.umask());
    }
    if (!made) made = null;
    
    var cb = f || function () {};
    p = path.resolve(p);
    
    xfs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                mkdirP(path.dirname(p), opts, function (er, made) {
                    if (er) cb(er, made);
                    else mkdirP(p, opts, cb, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                xfs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er, made)
                    else cb(null, made);
                });
                break;
        }
    });
}

mkdirP.sync = function sync (p, opts, made) {
    if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs;
    
    if (mode === undefined) {
        mode = _0777 & (~process.umask());
    }
    if (!made) made = null;

    p = path.resolve(p);

    try {
        xfs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = sync(path.dirname(p), opts, made);
                sync(p, opts, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                var stat;
                try {
                    stat = xfs.statSync(p);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }

    return made;
};

}).call(this,require('_process'))
},{"_process":3,"fs":1,"path":2}],9:[function(require,module,exports){
module.exports = function Result(){}
},{}],"writefile":[function(require,module,exports){

var lift = require('lift-result/cps')
var dirname = require('path').dirname
var write = require('fs').writeFile
var mkdirp = require('mkdirp')

/**
 * fs.writeFile but makes parent directories if required
 *
 * @param {String} path
 * @param {String} text
 * @param {Function} cb
 */

module.exports = lift(function(path, text, cb){
  write(path, text, function(e){
    if (!e) return cb(null)
    if (e.code == 'ENOENT') {

      return mkdirp(dirname(path), function(e){
        if (e) cb(e)
        else write(path, text, cb)
      })
    }
    cb(e)
  })
})

},{"fs":1,"lift-result/cps":4,"mkdirp":8,"path":2}],"writefile":[function(require,module,exports){

/*
*   Set Yeditor object settings and methods 
*/

var yeditor = new function() {
    
    //editor settings 
    this.editorMode = "python";
    this.editorTheme = "monokai";
   
    //this.editorMode = "";
    
    /*
    *   get editor and return the editor object
    */
    this.editor = function(){
      window.editor = ace.edit("editor");
      return window.editor
  };
  
    /*
    *   Change current mode of editor to the passing mode
    */
    this.changeMode = function(mode){
      this.editorMode = mode;
      this.editor().session.setMode("ace/mode/" + this.editorMode);
  };
    /*
    *   Get the current text in the editor 
    */
    this.getCurrentText = function(){
       
       console.log("getting editor text");
       var text = this.editor().getSession().toString();
       return text
  };
    /*
    *
    *   Insert New text to editor
    */
    this.insertText = function(text){
        
        this.editor().session.insert("alert");
    }
    /*
    *   Start editor with default mode
    */
    this.startEditor = function(){
        
     console.log("editor started");
     this.editor().session.setMode("ace/mode/" + this.editorMode);
     this.editor().setTheme("ace/theme/" + this.editorTheme);
      
  };
  
  /*
  * Download current content in the editor
  */
  this.getContentUrl = function() {
    
        this.editorContent = this.getCurrentText();
        this.encodedURI = encodeURIComponent(this.editorContent);
        /*
        //create invisible link 
        this.link = document.createElement("a");
        this.link.setAttribute("href", this.encodedURI);
        this.link.setAttribute("download", "code.txt");
        */
        if (this.editorContent != "") {
            //console.log('generated content url..')
            this.contentUrl = "https://yeditor-ysfdev.c9users.io/index.html?url=" + this.encodedURI
            return this.contentUrl
        }
        else {
            console.log('got nothing')
        }

  }
  
    //this.saveFile = function() {
        
        /*
        
        //fs.writeFile("/editorContent/", "test file ", function(err){
          /  if(err) {
                return console.log('Error Sacing File: ' + err)
            }
            
            console.log("File saved")
        });
        
    }
    */
  
    
}


$(document).ready(function(){
    
    function saveFile(){
        
        fs.writeFile("/editorContent/", "test file ", function(err){
            if(err) {
                return console.log('Error Sacing File: ' + err)
            }
            
            console.log("File saved")
        });
        
    }
    
    yeditor.startEditor();
    //yeditor.changeMode('javascript');
    
     $("#jsButton").click(function(){
        console.log('jseditor');
        yeditor.changeMode('javascript');
    });
    
    $("#pyButton").click(function(){
        yeditor.changeMode('python');
        console.log('python');
    });
    
     $("#phpButton").click(function(){
        yeditor.changeMode('PHP');
    });
    
     $("#perlButton").click(function(){
        yeditor.changeMode('perl');
    });
    
     $("#rubyButton").click(function(){
        //yeditor.changeMode('ruby');
       saveFile();
       //console.log(yeditor.getContentUrl());
    });



});


$(document).ready((function () {
    
   
    
    $('#render-link').click(function (){
      
        var downloadUrl = " '" + yeditor.getContentUrl() + "'";
        console.log(downloadUrl);
        gapi.savetodrive.render('savetodrive-btn', {
            src:downloadUrl,
            filename: 'My Statement.pdf',
            sitename: 'My Company Name'
        });
         console.log('drive render started');
    })
    
    


}));

var client_id = '764640353236-2euqfn592tab7h3c3ulencphqde5age4.apps.googleusercontent.com'
var oauthToken;

function onApiLoad(){
    
    gapi.load('auth', {'callback':onAuthApiLoad()});
    gapi.load('picker');
}

function onAuthApiLoad(){
    
    window.gapi.auth.authorize({
    'client_id':client_id,
    'scope':['https://www.googleapis.com/auth/drive']
    }, handleAuthResult);
    
}


function handleAuthResult(authResult){
    if (authResult && !authResult.error){
        oauthToken = authResult.access_token;
        createPicker();
    }
}



function createPicker(){
    
    var picker = new google.picker.PickerBuilder()
        .setOAuthToken(oauthToken)
        .setDeveloperKey(client_id)
        .build();
        picker.setVisible(true);
     
     // add upload docs view 
     //.addView(new google.picker.DocsUploadView())
     
}


/*
function downloadCurrentContent () {
    
    var editorContent = yeditor.getCurrentText();
    var encodedURI = encodeURIComponent(editorContent);
    
    
   // console.log(var encodedURI)
    //create invisible link 
    var link = document.createElement("a");
    link.href = 'data:attachment/py,' + encodedURI;
    link.download = "code.py";
    link.target = "_self";
    console.log(link)
    
    console.log(editorContent);
    if (yeditor.editorContent != "") {
        document.body.appendChild(link)
        // link.click();
        console.log('download started..')
    }
    else {
        console.log('got nothing')
        
    }
}

*/


var fs = require('fs'); 
},{"fs":1}]},{},[]);
