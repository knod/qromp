var CLOSURE_NO_DEPS = true;
var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return value
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.string.StringBuffer");
goog.string.StringBuffer = function(opt_a1, var_args) {
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.buffer_ = "";
goog.string.StringBuffer.prototype.set = function(s) {
  this.buffer_ = "" + s
};
goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  this.buffer_ += a1;
  if(opt_a2 != null) {
    for(var i = 1;i < arguments.length;i++) {
      this.buffer_ += arguments[i]
    }
  }
  return this
};
goog.string.StringBuffer.prototype.clear = function() {
  this.buffer_ = ""
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.buffer_.length
};
goog.string.StringBuffer.prototype.toString = function() {
  return this.buffer_
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__$1 = x == null ? null : x;
  if(p[goog.typeOf(x__$1)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__3134__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__3134 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3134__delegate.call(this, array, i, idxs)
    };
    G__3134.cljs$lang$maxFixedArity = 2;
    G__3134.cljs$lang$applyTo = function(arglist__3135) {
      var array = cljs.core.first(arglist__3135);
      var i = cljs.core.first(cljs.core.next(arglist__3135));
      var idxs = cljs.core.rest(cljs.core.next(arglist__3135));
      return G__3134__delegate(array, i, idxs)
    };
    G__3134.cljs$lang$arity$variadic = G__3134__delegate;
    return G__3134
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.Fn = {};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2514__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._count[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._count["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._empty[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._empty["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._conj[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._conj["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2514__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._nth[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._nth["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2514__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._nth[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._nth["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._first[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._rest[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._rest["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._next[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._next["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3941__auto__ = o;
      if(and__3941__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2514__auto__ = o == null ? null : o;
      return function() {
        var or__3943__auto__ = cljs.core._lookup[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._lookup["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3941__auto__ = o;
      if(and__3941__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2514__auto__ = o == null ? null : o;
      return function() {
        var or__3943__auto__ = cljs.core._lookup[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._lookup["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._contains_key_QMARK_[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._contains_key_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._dissoc[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dissoc["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._key[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._key["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._val[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._val["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._disjoin[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._disjoin["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._peek[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._peek["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._pop[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pop["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_n[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_n["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2514__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._deref[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._deref["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2514__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._deref_with_timeout[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._deref_with_timeout["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2514__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._meta[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._meta["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2514__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._with_meta[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._with_meta["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2514__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._reduce[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._reduce["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2514__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._reduce[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._reduce["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._kv_reduce[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._kv_reduce["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2514__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._equiv[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._equiv["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2514__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._hash[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._hash["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2514__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._seq[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._seq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._rseq[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._rseq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._sorted_seq[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._sorted_seq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._sorted_seq_from[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._sorted_seq_from["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._entry_key[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._entry_key["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._comparator[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._comparator["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2514__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._pr_seq[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pr_seq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IWriter = {};
cljs.core._write = function _write(writer, s) {
  if(function() {
    var and__3941__auto__ = writer;
    if(and__3941__auto__) {
      return writer.cljs$core$IWriter$_write$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_write$arity$2(writer, s)
  }else {
    var x__2514__auto__ = writer == null ? null : writer;
    return function() {
      var or__3943__auto__ = cljs.core._write[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._write["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-write", writer);
        }
      }
    }().call(null, writer, s)
  }
};
cljs.core._flush = function _flush(writer) {
  if(function() {
    var and__3941__auto__ = writer;
    if(and__3941__auto__) {
      return writer.cljs$core$IWriter$_flush$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_flush$arity$1(writer)
  }else {
    var x__2514__auto__ = writer == null ? null : writer;
    return function() {
      var or__3943__auto__ = cljs.core._flush[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._flush["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-flush", writer);
        }
      }
    }().call(null, writer)
  }
};
cljs.core.IPrintWithWriter = {};
cljs.core._pr_writer = function _pr_writer(o, writer, opts) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3(o, writer, opts)
  }else {
    var x__2514__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._pr_writer[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pr_writer["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintWithWriter.-pr-writer", o);
        }
      }
    }().call(null, o, writer, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3941__auto__ = d;
    if(and__3941__auto__) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2514__auto__ = d == null ? null : d;
    return function() {
      var or__3943__auto__ = cljs.core._realized_QMARK_[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._realized_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2514__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._notify_watches[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._notify_watches["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2514__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._add_watch[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._add_watch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2514__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._remove_watch[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._remove_watch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._as_transient[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._as_transient["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2514__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._conj_BANG_[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._conj_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2514__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._persistent_BANG_[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._persistent_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2514__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_BANG_[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2514__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._dissoc_BANG_[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dissoc_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2514__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_n_BANG_[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_n_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2514__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._pop_BANG_[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pop_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2514__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._disjoin_BANG_[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._disjoin_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2514__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._compare[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._compare["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._drop_first[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._drop_first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_first[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_rest[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_rest["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2514__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_next[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_next["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__3137 = coll;
      if(G__3137) {
        if(function() {
          var or__3943__auto__ = G__3137.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__3137.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__3137.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__3137)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__3137)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__3139 = coll;
      if(G__3139) {
        if(function() {
          var or__3943__auto__ = G__3139.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__3139.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__3139.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__3139)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__3139)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s = cljs.core.seq.call(null, coll);
      if(s == null) {
        return null
      }else {
        return cljs.core._first.call(null, s)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__3141 = coll;
      if(G__3141) {
        if(function() {
          var or__3943__auto__ = G__3141.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__3141.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__3141.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__3141)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__3141)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s = cljs.core.seq.call(null, coll);
      if(!(s == null)) {
        return cljs.core._rest.call(null, s)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__3143 = coll;
      if(G__3143) {
        if(function() {
          var or__3943__auto__ = G__3143.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__3143.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__3143.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__3143)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__3143)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3943__auto__ = x === y;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__3144__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__3145 = y;
            var G__3146 = cljs.core.first.call(null, more);
            var G__3147 = cljs.core.next.call(null, more);
            x = G__3145;
            y = G__3146;
            more = G__3147;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3144 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3144__delegate.call(this, x, y, more)
    };
    G__3144.cljs$lang$maxFixedArity = 2;
    G__3144.cljs$lang$applyTo = function(arglist__3148) {
      var x = cljs.core.first(arglist__3148);
      var y = cljs.core.first(cljs.core.next(arglist__3148));
      var more = cljs.core.rest(cljs.core.next(arglist__3148));
      return G__3144__delegate(x, y, more)
    };
    G__3144.cljs$lang$arity$variadic = G__3144__delegate;
    return G__3144
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__3149 = null;
  var G__3149__2 = function(o, k) {
    return null
  };
  var G__3149__3 = function(o, k, not_found) {
    return not_found
  };
  G__3149 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3149__2.call(this, o, k);
      case 3:
        return G__3149__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3149
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.IPrintWithWriter["null"] = true;
cljs.core._pr_writer["null"] = function(o, writer, _) {
  return cljs.core._write.call(null, writer, "nil")
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__3150 = null;
  var G__3150__2 = function(_, f) {
    return f.call(null)
  };
  var G__3150__3 = function(_, f, start) {
    return start
  };
  G__3150 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3150__2.call(this, _, f);
      case 3:
        return G__3150__3.call(this, _, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3150
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__3151 = null;
  var G__3151__2 = function(_, n) {
    return null
  };
  var G__3151__3 = function(_, n, not_found) {
    return not_found
  };
  G__3151 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3151__2.call(this, _, n);
      case 3:
        return G__3151__3.call(this, _, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3151
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3941__auto__ = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3941__auto__) {
    return o.toString() === other.toString()
  }else {
    return and__3941__auto__
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IWithMeta["function"] = true;
cljs.core._with_meta["function"] = function(f, meta) {
  return cljs.core.with_meta.call(null, function() {
    if(void 0 === cljs.core.t3152) {
      goog.provide("cljs.core.t3152");
      cljs.core.t3152 = function(meta, f, meta3153) {
        this.meta = meta;
        this.f = f;
        this.meta3153 = meta3153;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 393217
      };
      cljs.core.t3152.cljs$lang$type = true;
      cljs.core.t3152.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
        return cljs.core.list.call(null, "cljs.core/t3152")
      };
      cljs.core.t3152.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
        return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/t3152")
      };
      cljs.core.t3152.prototype.call = function() {
        var G__3156__delegate = function(self__, args) {
          var self____$1 = this;
          var _ = self____$1;
          return cljs.core.apply.call(null, self__.f, args)
        };
        var G__3156 = function(self__, var_args) {
          var self__ = this;
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
          }
          return G__3156__delegate.call(this, self__, args)
        };
        G__3156.cljs$lang$maxFixedArity = 1;
        G__3156.cljs$lang$applyTo = function(arglist__3157) {
          var self__ = cljs.core.first(arglist__3157);
          var args = cljs.core.rest(arglist__3157);
          return G__3156__delegate(self__, args)
        };
        G__3156.cljs$lang$arity$variadic = G__3156__delegate;
        return G__3156
      }();
      cljs.core.t3152.prototype.apply = function(self__, args3155) {
        var self__ = this;
        return self__.call.apply(self__, [self__].concat(args3155.slice()))
      };
      cljs.core.t3152.prototype.cljs$core$Fn$ = true;
      cljs.core.t3152.prototype.cljs$core$IMeta$_meta$arity$1 = function(_3154) {
        var self__ = this;
        return self__.meta3153
      };
      cljs.core.t3152.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_3154, meta3153__$1) {
        var self__ = this;
        return new cljs.core.t3152(self__.meta, self__.f, meta3153__$1)
      }
    }else {
    }
    return new cljs.core.t3152(meta, f, null)
  }(), meta)
};
cljs.core.IMeta["function"] = true;
cljs.core._meta["function"] = function(_) {
  return null
};
cljs.core.Fn["function"] = true;
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
goog.provide("cljs.core.Reduced");
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var self__ = this;
  return self__.val
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt = cljs.core._count.call(null, cicoll);
    if(cnt === 0) {
      return f.call(null)
    }else {
      var val = cljs.core._nth.call(null, cicoll, 0);
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.call(null, val, cljs.core._nth.call(null, cicoll, n));
          if(cljs.core.reduced_QMARK_.call(null, nval)) {
            return cljs.core.deref.call(null, nval)
          }else {
            var G__3158 = nval;
            var G__3159 = n + 1;
            val = G__3158;
            n = G__3159;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt = cljs.core._count.call(null, cicoll);
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, cljs.core._nth.call(null, cicoll, n));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__3160 = nval;
          var G__3161 = n + 1;
          val__$1 = G__3160;
          n = G__3161;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt = cljs.core._count.call(null, cicoll);
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, cljs.core._nth.call(null, cicoll, n));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__3162 = nval;
          var G__3163 = n + 1;
          val__$1 = G__3162;
          n = G__3163;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val = arr[0];
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.call(null, val, arr[n]);
          if(cljs.core.reduced_QMARK_.call(null, nval)) {
            return cljs.core.deref.call(null, nval)
          }else {
            var G__3164 = nval;
            var G__3165 = n + 1;
            val = G__3164;
            n = G__3165;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__3166 = nval;
          var G__3167 = n + 1;
          val__$1 = G__3166;
          n = G__3167;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__3168 = nval;
          var G__3169 = n + 1;
          val__$1 = G__3168;
          n = G__3169;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__3171 = x;
  if(G__3171) {
    if(function() {
      var or__3943__auto__ = G__3171.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__3171.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__3171.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__3171)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__3171)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__3173 = x;
  if(G__3173) {
    if(function() {
      var or__3943__auto__ = G__3173.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__3173.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__3173.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__3173)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__3173)
  }
};
goog.provide("cljs.core.IndexedSeq");
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199550
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var self__ = this;
  if(self__.i + 1 < self__.a.length) {
    return new cljs.core.IndexedSeq(self__.a, self__.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  var c = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c > 0) {
    return new cljs.core.RSeq(coll, c - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  if(cljs.core.counted_QMARK_.call(null, self__.a)) {
    return cljs.core.ci_reduce.call(null, self__.a, f, self__.a[self__.i], self__.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, self__.a[self__.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  if(cljs.core.counted_QMARK_.call(null, self__.a)) {
    return cljs.core.ci_reduce.call(null, self__.a, f, start, self__.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.a.length - self__.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var self__ = this;
  return self__.a[self__.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var self__ = this;
  if(self__.i + 1 < self__.a.length) {
    return new cljs.core.IndexedSeq(self__.a, self__.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.a.length) {
    return self__.a[i__$1]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.a.length) {
    return self__.a[i__$1]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(i < prim.length) {
      return new cljs.core.IndexedSeq(prim, i)
    }else {
      return null
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__3174 = null;
  var G__3174__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__3174__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__3174 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3174__2.call(this, array, f);
      case 3:
        return G__3174__3.call(this, array, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3174
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__3175 = null;
  var G__3175__2 = function(array, k) {
    return array[k]
  };
  var G__3175__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__3175 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3175__2.call(this, array, k);
      case 3:
        return G__3175__3.call(this, array, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3175
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__3176 = null;
  var G__3176__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__3176__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__3176 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3176__2.call(this, array, n);
      case 3:
        return G__3176__3.call(this, array, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3176
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
goog.provide("cljs.core.RSeq");
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.ci, self__.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.i > 0) {
    return new cljs.core.RSeq(self__.ci, self__.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  return new cljs.core.RSeq(self__.ci, self__.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.RSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn = cljs.core.next.call(null, s);
    if(!(sn == null)) {
      var G__3177 = sn;
      s = G__3177;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__3178__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__3179 = conj.call(null, coll, x);
          var G__3180 = cljs.core.first.call(null, xs);
          var G__3181 = cljs.core.next.call(null, xs);
          coll = G__3179;
          x = G__3180;
          xs = G__3181;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__3178 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3178__delegate.call(this, coll, x, xs)
    };
    G__3178.cljs$lang$maxFixedArity = 2;
    G__3178.cljs$lang$applyTo = function(arglist__3182) {
      var coll = cljs.core.first(arglist__3182);
      var x = cljs.core.first(cljs.core.next(arglist__3182));
      var xs = cljs.core.rest(cljs.core.next(arglist__3182));
      return G__3178__delegate(coll, x, xs)
    };
    G__3178.cljs$lang$arity$variadic = G__3178__delegate;
    return G__3178
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s = cljs.core.seq.call(null, coll);
  var acc = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s)) {
      return acc + cljs.core._count.call(null, s)
    }else {
      var G__3183 = cljs.core.next.call(null, s);
      var G__3184 = acc + 1;
      s = G__3183;
      acc = G__3184;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    while(true) {
      if(coll == null) {
        throw new Error("Index out of bounds");
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            throw new Error("Index out of bounds");
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__3185 = cljs.core.next.call(null, coll);
              var G__3186 = n - 1;
              coll = G__3185;
              n = G__3186;
              continue
            }else {
              if("\ufdd0'else") {
                throw new Error("Index out of bounds");
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    while(true) {
      if(coll == null) {
        return not_found
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            return not_found
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n, not_found)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__3187 = cljs.core.next.call(null, coll);
              var G__3188 = n - 1;
              var G__3189 = not_found;
              coll = G__3187;
              n = G__3188;
              not_found = G__3189;
              continue
            }else {
              if("\ufdd0'else") {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__3192 = coll;
        if(G__3192) {
          if(function() {
            var or__3943__auto__ = G__3192.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__3192.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__3192.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__3192)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__3192)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__3193 = coll;
        if(G__3193) {
          if(function() {
            var or__3943__auto__ = G__3193.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__3193.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__3193.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__3193)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__3193)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__3194__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__3195 = ret;
          var G__3196 = cljs.core.first.call(null, kvs);
          var G__3197 = cljs.core.second.call(null, kvs);
          var G__3198 = cljs.core.nnext.call(null, kvs);
          coll = G__3195;
          k = G__3196;
          v = G__3197;
          kvs = G__3198;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__3194 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3194__delegate.call(this, coll, k, v, kvs)
    };
    G__3194.cljs$lang$maxFixedArity = 3;
    G__3194.cljs$lang$applyTo = function(arglist__3199) {
      var coll = cljs.core.first(arglist__3199);
      var k = cljs.core.first(cljs.core.next(arglist__3199));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3199)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3199)));
      return G__3194__delegate(coll, k, v, kvs)
    };
    G__3194.cljs$lang$arity$variadic = G__3194__delegate;
    return G__3194
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__3200__delegate = function(coll, k, ks) {
      while(true) {
        var ret = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3201 = ret;
          var G__3202 = cljs.core.first.call(null, ks);
          var G__3203 = cljs.core.next.call(null, ks);
          coll = G__3201;
          k = G__3202;
          ks = G__3203;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__3200 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3200__delegate.call(this, coll, k, ks)
    };
    G__3200.cljs$lang$maxFixedArity = 2;
    G__3200.cljs$lang$applyTo = function(arglist__3204) {
      var coll = cljs.core.first(arglist__3204);
      var k = cljs.core.first(cljs.core.next(arglist__3204));
      var ks = cljs.core.rest(cljs.core.next(arglist__3204));
      return G__3200__delegate(coll, k, ks)
    };
    G__3200.cljs$lang$arity$variadic = G__3200__delegate;
    return G__3200
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__3206 = o;
    if(G__3206) {
      if(function() {
        var or__3943__auto__ = G__3206.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__3206.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__3206.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__3206)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__3206)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__3207__delegate = function(coll, k, ks) {
      while(true) {
        var ret = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__3208 = ret;
          var G__3209 = cljs.core.first.call(null, ks);
          var G__3210 = cljs.core.next.call(null, ks);
          coll = G__3208;
          k = G__3209;
          ks = G__3210;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__3207 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3207__delegate.call(this, coll, k, ks)
    };
    G__3207.cljs$lang$maxFixedArity = 2;
    G__3207.cljs$lang$applyTo = function(arglist__3211) {
      var coll = cljs.core.first(arglist__3211);
      var k = cljs.core.first(cljs.core.next(arglist__3211));
      var ks = cljs.core.rest(cljs.core.next(arglist__3211));
      return G__3207__delegate(coll, k, ks)
    };
    G__3207.cljs$lang$arity$variadic = G__3207__delegate;
    return G__3207
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h = cljs.core.string_hash_cache[k];
  if(!(h == null)) {
    return h
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3941__auto__ = goog.isString(o);
      if(and__3941__auto__) {
        return check_cache
      }else {
        return and__3941__auto__
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  var or__3943__auto__ = coll == null;
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
  }
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__3213 = x;
    if(G__3213) {
      if(function() {
        var or__3943__auto__ = G__3213.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__3213.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__3213.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__3213)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__3213)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__3215 = x;
    if(G__3215) {
      if(function() {
        var or__3943__auto__ = G__3215.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__3215.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__3215.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__3215)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__3215)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__3217 = x;
  if(G__3217) {
    if(function() {
      var or__3943__auto__ = G__3217.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__3217.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__3217.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__3217)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__3217)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__3219 = x;
  if(G__3219) {
    if(function() {
      var or__3943__auto__ = G__3219.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__3219.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__3219.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__3219)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__3219)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__3221 = x;
  if(G__3221) {
    if(function() {
      var or__3943__auto__ = G__3221.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__3221.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__3221.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__3221)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__3221)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__3223 = x;
    if(G__3223) {
      if(function() {
        var or__3943__auto__ = G__3223.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__3223.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__3223.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__3223)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__3223)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__3225 = x;
  if(G__3225) {
    if(function() {
      var or__3943__auto__ = G__3225.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__3225.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__3225.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__3225)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__3225)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__3227 = x;
  if(G__3227) {
    if(function() {
      var or__3943__auto__ = G__3227.cljs$lang$protocol_mask$partition1$ & 512;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__3227.cljs$core$IChunkedSeq$
      }
    }()) {
      return true
    }else {
      if(!G__3227.cljs$lang$protocol_mask$partition1$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__3227)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__3227)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__3228__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__3228 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3228__delegate.call(this, keyvals)
    };
    G__3228.cljs$lang$maxFixedArity = 0;
    G__3228.cljs$lang$applyTo = function(arglist__3229) {
      var keyvals = cljs.core.seq(arglist__3229);
      return G__3228__delegate(keyvals)
    };
    G__3228.cljs$lang$arity$variadic = G__3228__delegate;
    return G__3228
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys = [];
  goog.object.forEach(obj, function(val, key, obj__$1) {
    return keys.push(key)
  });
  return keys
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__$1 = i;
  var j__$1 = j;
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__3230 = i__$1 + 1;
      var G__3231 = j__$1 + 1;
      var G__3232 = len__$1 - 1;
      i__$1 = G__3230;
      j__$1 = G__3231;
      len__$1 = G__3232;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__$1 = i + (len - 1);
  var j__$1 = j + (len - 1);
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__3233 = i__$1 - 1;
      var G__3234 = j__$1 - 1;
      var G__3235 = len__$1 - 1;
      i__$1 = G__3233;
      j__$1 = G__3234;
      len__$1 = G__3235;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__3237 = s;
    if(G__3237) {
      if(function() {
        var or__3943__auto__ = G__3237.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__3237.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__3237.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__3237)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__3237)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__3239 = s;
  if(G__3239) {
    if(function() {
      var or__3943__auto__ = G__3239.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__3239.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__3239.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__3239)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__3239)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3941__auto__ = goog.isString(x);
  if(and__3941__auto__) {
    return!function() {
      var or__3943__auto__ = x.charAt(0) === "\ufdd0";
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3941__auto__
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3941__auto__ = goog.isString(x);
  if(and__3941__auto__) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3941__auto__
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3941__auto__ = goog.isString(x);
  if(and__3941__auto__) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3941__auto__
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  var or__3943__auto__ = goog.isFunction(f);
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    var G__3241 = f;
    if(G__3241) {
      if(cljs.core.truth_(function() {
        var or__3943__auto____$1 = null;
        if(cljs.core.truth_(or__3943__auto____$1)) {
          return or__3943__auto____$1
        }else {
          return G__3241.cljs$core$Fn$
        }
      }())) {
        return true
      }else {
        if(!G__3241.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.Fn, G__3241)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.Fn, G__3241)
    }
  }
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3943__auto__ = cljs.core.fn_QMARK_.call(null, f);
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    var G__3243 = f;
    if(G__3243) {
      if(function() {
        var or__3943__auto____$1 = G__3243.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          return G__3243.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__3243.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__3243)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__3243)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3941__auto__ = cljs.core.number_QMARK_.call(null, n);
  if(and__3941__auto__) {
    var and__3941__auto____$1 = !isNaN(n);
    if(and__3941__auto____$1) {
      var and__3941__auto____$2 = !(n === Infinity);
      if(and__3941__auto____$2) {
        return parseFloat(n) === parseInt(n, 10)
      }else {
        return and__3941__auto____$2
      }
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(function() {
    var and__3941__auto__ = !(coll == null);
    if(and__3941__auto__) {
      var and__3941__auto____$1 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3941__auto____$1) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3941__auto____$1
      }
    }else {
      return and__3941__auto__
    }
  }()) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__3244__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs = more;
        while(true) {
          var x__$1 = cljs.core.first.call(null, xs);
          var etc = cljs.core.next.call(null, xs);
          if(cljs.core.truth_(xs)) {
            if(cljs.core.contains_QMARK_.call(null, s, x__$1)) {
              return false
            }else {
              var G__3245 = cljs.core.conj.call(null, s, x__$1);
              var G__3246 = etc;
              s = G__3245;
              xs = G__3246;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__3244 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3244__delegate.call(this, x, y, more)
    };
    G__3244.cljs$lang$maxFixedArity = 2;
    G__3244.cljs$lang$applyTo = function(arglist__3247) {
      var x = cljs.core.first(arglist__3247);
      var y = cljs.core.first(cljs.core.next(arglist__3247));
      var more = cljs.core.rest(cljs.core.next(arglist__3247));
      return G__3244__delegate(x, y, more)
    };
    G__3244.cljs$lang$arity$variadic = G__3244__delegate;
    return G__3244
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__3249 = x;
            if(G__3249) {
              if(function() {
                var or__3943__auto__ = G__3249.cljs$lang$protocol_mask$partition1$ & 2048;
                if(or__3943__auto__) {
                  return or__3943__auto__
                }else {
                  return G__3249.cljs$core$IComparable$
                }
              }()) {
                return true
              }else {
                if(!G__3249.cljs$lang$protocol_mask$partition1$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__3249)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__3249)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl = cljs.core.count.call(null, xs);
    var yl = cljs.core.count.call(null, ys);
    if(xl < yl) {
      return-1
    }else {
      if(xl > yl) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3941__auto__ = d === 0;
        if(and__3941__auto__) {
          return n + 1 < len
        }else {
          return and__3941__auto__
        }
      }()) {
        var G__3250 = xs;
        var G__3251 = ys;
        var G__3252 = len;
        var G__3253 = n + 1;
        xs = G__3250;
        ys = G__3251;
        len = G__3252;
        n = G__3253;
        continue
      }else {
        return d
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r)) {
        return r
      }else {
        if(cljs.core.truth_(r)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__4090__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4090__auto__) {
      var s = temp__4090__auto__;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s), cljs.core.next.call(null, s))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__$1 = val;
    var coll__$1 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__$1) {
        var nval = f.call(null, val__$1, cljs.core.first.call(null, coll__$1));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__3254 = nval;
          var G__3255 = cljs.core.next.call(null, coll__$1);
          val__$1 = G__3254;
          coll__$1 = G__3255;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a);
  return cljs.core.vec.call(null, a)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__3258 = coll;
      if(G__3258) {
        if(function() {
          var or__3943__auto__ = G__3258.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__3258.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__3258.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__3258)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__3258)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__3259 = coll;
      if(G__3259) {
        if(function() {
          var or__3943__auto__ = G__3259.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__3259.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__3259.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__3259)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__3259)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__3260__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__3260 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3260__delegate.call(this, x, y, more)
    };
    G__3260.cljs$lang$maxFixedArity = 2;
    G__3260.cljs$lang$applyTo = function(arglist__3261) {
      var x = cljs.core.first(arglist__3261);
      var y = cljs.core.first(cljs.core.next(arglist__3261));
      var more = cljs.core.rest(cljs.core.next(arglist__3261));
      return G__3260__delegate(x, y, more)
    };
    G__3260.cljs$lang$arity$variadic = G__3260__delegate;
    return G__3260
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__3262__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__3262 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3262__delegate.call(this, x, y, more)
    };
    G__3262.cljs$lang$maxFixedArity = 2;
    G__3262.cljs$lang$applyTo = function(arglist__3263) {
      var x = cljs.core.first(arglist__3263);
      var y = cljs.core.first(cljs.core.next(arglist__3263));
      var more = cljs.core.rest(cljs.core.next(arglist__3263));
      return G__3262__delegate(x, y, more)
    };
    G__3262.cljs$lang$arity$variadic = G__3262__delegate;
    return G__3262
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__3264__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__3264 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3264__delegate.call(this, x, y, more)
    };
    G__3264.cljs$lang$maxFixedArity = 2;
    G__3264.cljs$lang$applyTo = function(arglist__3265) {
      var x = cljs.core.first(arglist__3265);
      var y = cljs.core.first(cljs.core.next(arglist__3265));
      var more = cljs.core.rest(cljs.core.next(arglist__3265));
      return G__3264__delegate(x, y, more)
    };
    G__3264.cljs$lang$arity$variadic = G__3264__delegate;
    return G__3264
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__3266__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__3266 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3266__delegate.call(this, x, y, more)
    };
    G__3266.cljs$lang$maxFixedArity = 2;
    G__3266.cljs$lang$applyTo = function(arglist__3267) {
      var x = cljs.core.first(arglist__3267);
      var y = cljs.core.first(cljs.core.next(arglist__3267));
      var more = cljs.core.rest(cljs.core.next(arglist__3267));
      return G__3266__delegate(x, y, more)
    };
    G__3266.cljs$lang$arity$variadic = G__3266__delegate;
    return G__3266
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__3268__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__3269 = y;
            var G__3270 = cljs.core.first.call(null, more);
            var G__3271 = cljs.core.next.call(null, more);
            x = G__3269;
            y = G__3270;
            more = G__3271;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3268 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3268__delegate.call(this, x, y, more)
    };
    G__3268.cljs$lang$maxFixedArity = 2;
    G__3268.cljs$lang$applyTo = function(arglist__3272) {
      var x = cljs.core.first(arglist__3272);
      var y = cljs.core.first(cljs.core.next(arglist__3272));
      var more = cljs.core.rest(cljs.core.next(arglist__3272));
      return G__3268__delegate(x, y, more)
    };
    G__3268.cljs$lang$arity$variadic = G__3268__delegate;
    return G__3268
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__3273__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__3274 = y;
            var G__3275 = cljs.core.first.call(null, more);
            var G__3276 = cljs.core.next.call(null, more);
            x = G__3274;
            y = G__3275;
            more = G__3276;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3273 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3273__delegate.call(this, x, y, more)
    };
    G__3273.cljs$lang$maxFixedArity = 2;
    G__3273.cljs$lang$applyTo = function(arglist__3277) {
      var x = cljs.core.first(arglist__3277);
      var y = cljs.core.first(cljs.core.next(arglist__3277));
      var more = cljs.core.rest(cljs.core.next(arglist__3277));
      return G__3273__delegate(x, y, more)
    };
    G__3273.cljs$lang$arity$variadic = G__3273__delegate;
    return G__3273
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__3278__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__3279 = y;
            var G__3280 = cljs.core.first.call(null, more);
            var G__3281 = cljs.core.next.call(null, more);
            x = G__3279;
            y = G__3280;
            more = G__3281;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3278 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3278__delegate.call(this, x, y, more)
    };
    G__3278.cljs$lang$maxFixedArity = 2;
    G__3278.cljs$lang$applyTo = function(arglist__3282) {
      var x = cljs.core.first(arglist__3282);
      var y = cljs.core.first(cljs.core.next(arglist__3282));
      var more = cljs.core.rest(cljs.core.next(arglist__3282));
      return G__3278__delegate(x, y, more)
    };
    G__3278.cljs$lang$arity$variadic = G__3278__delegate;
    return G__3278
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__3283__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__3284 = y;
            var G__3285 = cljs.core.first.call(null, more);
            var G__3286 = cljs.core.next.call(null, more);
            x = G__3284;
            y = G__3285;
            more = G__3286;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3283 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3283__delegate.call(this, x, y, more)
    };
    G__3283.cljs$lang$maxFixedArity = 2;
    G__3283.cljs$lang$applyTo = function(arglist__3287) {
      var x = cljs.core.first(arglist__3287);
      var y = cljs.core.first(cljs.core.next(arglist__3287));
      var more = cljs.core.rest(cljs.core.next(arglist__3287));
      return G__3283__delegate(x, y, more)
    };
    G__3283.cljs$lang$arity$variadic = G__3283__delegate;
    return G__3283
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__3288__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__3288 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3288__delegate.call(this, x, y, more)
    };
    G__3288.cljs$lang$maxFixedArity = 2;
    G__3288.cljs$lang$applyTo = function(arglist__3289) {
      var x = cljs.core.first(arglist__3289);
      var y = cljs.core.first(cljs.core.next(arglist__3289));
      var more = cljs.core.rest(cljs.core.next(arglist__3289));
      return G__3288__delegate(x, y, more)
    };
    G__3288.cljs$lang$arity$variadic = G__3288__delegate;
    return G__3288
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__3290__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__3290 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3290__delegate.call(this, x, y, more)
    };
    G__3290.cljs$lang$maxFixedArity = 2;
    G__3290.cljs$lang$applyTo = function(arglist__3291) {
      var x = cljs.core.first(arglist__3291);
      var y = cljs.core.first(cljs.core.next(arglist__3291));
      var more = cljs.core.rest(cljs.core.next(arglist__3291));
      return G__3290__delegate(x, y, more)
    };
    G__3290.cljs$lang$arity$variadic = G__3290__delegate;
    return G__3290
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.js_mod = function js_mod(n, d) {
  return n % d
};
cljs.core.mod = function mod(n, d) {
  return(n % d + d) % d
};
cljs.core.quot = function quot(n, d) {
  var rem = n % d;
  return cljs.core.fix.call(null, (n - rem) / d)
};
cljs.core.rem = function rem(n, d) {
  var q = cljs.core.quot.call(null, n, d);
  return n - d * q
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__$1 = v - (v >> 1 & 1431655765);
  var v__$2 = (v__$1 & 858993459) + (v__$1 >> 2 & 858993459);
  return(v__$2 + (v__$2 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__3292__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__3293 = y;
            var G__3294 = cljs.core.first.call(null, more);
            var G__3295 = cljs.core.next.call(null, more);
            x = G__3293;
            y = G__3294;
            more = G__3295;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__3292 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3292__delegate.call(this, x, y, more)
    };
    G__3292.cljs$lang$maxFixedArity = 2;
    G__3292.cljs$lang$applyTo = function(arglist__3296) {
      var x = cljs.core.first(arglist__3296);
      var y = cljs.core.first(cljs.core.next(arglist__3296));
      var more = cljs.core.rest(cljs.core.next(arglist__3296));
      return G__3292__delegate(x, y, more)
    };
    G__3292.cljs$lang$arity$variadic = G__3292__delegate;
    return G__3292
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__$1 = n;
  var xs = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3941__auto__ = xs;
      if(and__3941__auto__) {
        return n__$1 > 0
      }else {
        return and__3941__auto__
      }
    }())) {
      var G__3297 = n__$1 - 1;
      var G__3298 = cljs.core.next.call(null, xs);
      n__$1 = G__3297;
      xs = G__3298;
      continue
    }else {
      return xs
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__3299__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__3300 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__3301 = cljs.core.next.call(null, more);
            sb = G__3300;
            more = G__3301;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__3299 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3299__delegate.call(this, x, ys)
    };
    G__3299.cljs$lang$maxFixedArity = 1;
    G__3299.cljs$lang$applyTo = function(arglist__3302) {
      var x = cljs.core.first(arglist__3302);
      var ys = cljs.core.rest(arglist__3302);
      return G__3299__delegate(x, ys)
    };
    G__3299.cljs$lang$arity$variadic = G__3299__delegate;
    return G__3299
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__3303__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__3304 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__3305 = cljs.core.next.call(null, more);
            sb = G__3304;
            more = G__3305;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__3303 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3303__delegate.call(this, x, ys)
    };
    G__3303.cljs$lang$maxFixedArity = 1;
    G__3303.cljs$lang$applyTo = function(arglist__3306) {
      var x = cljs.core.first(arglist__3306);
      var ys = cljs.core.rest(arglist__3306);
      return G__3303__delegate(x, ys)
    };
    G__3303.cljs$lang$arity$variadic = G__3303__delegate;
    return G__3303
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    var args__$1 = cljs.core.map.call(null, function(x) {
      if(function() {
        var or__3943__auto__ = cljs.core.keyword_QMARK_.call(null, x);
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return cljs.core.symbol_QMARK_.call(null, x)
        }
      }()) {
        return[cljs.core.str(x)].join("")
      }else {
        return x
      }
    }, args);
    return cljs.core.apply.call(null, goog.string.format, fmt, args__$1)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__3307) {
    var fmt = cljs.core.first(arglist__3307);
    var args = cljs.core.rest(arglist__3307);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs = cljs.core.seq.call(null, x);
    var ys = cljs.core.seq.call(null, y);
    while(true) {
      if(xs == null) {
        return ys == null
      }else {
        if(ys == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs), cljs.core.first.call(null, ys))) {
            var G__3308 = cljs.core.next.call(null, xs);
            var G__3309 = cljs.core.next.call(null, ys);
            xs = G__3308;
            ys = G__3309;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__3310_SHARP_, p2__3311_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__3310_SHARP_, cljs.core.hash.call(null, p2__3311_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h = 0;
  var s = cljs.core.seq.call(null, m);
  while(true) {
    if(s) {
      var e = cljs.core.first.call(null, s);
      var G__3312 = (h + (cljs.core.hash.call(null, cljs.core.key.call(null, e)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e)))) % 4503599627370496;
      var G__3313 = cljs.core.next.call(null, s);
      h = G__3312;
      s = G__3313;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h = 0;
  var s__$1 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__$1) {
      var e = cljs.core.first.call(null, s__$1);
      var G__3314 = (h + cljs.core.hash.call(null, e)) % 4503599627370496;
      var G__3315 = cljs.core.next.call(null, s__$1);
      h = G__3314;
      s__$1 = G__3315;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__3318_3320 = cljs.core.seq.call(null, fn_map);
  while(true) {
    if(G__3318_3320) {
      var vec__3319_3321 = cljs.core.first.call(null, G__3318_3320);
      var key_name_3322 = cljs.core.nth.call(null, vec__3319_3321, 0, null);
      var f_3323 = cljs.core.nth.call(null, vec__3319_3321, 1, null);
      var str_name_3324 = cljs.core.name.call(null, key_name_3322);
      obj[str_name_3324] = f_3323;
      var G__3325 = cljs.core.next.call(null, G__3318_3320);
      G__3318_3320 = G__3325;
      continue
    }else {
    }
    break
  }
  return obj
};
goog.provide("cljs.core.List");
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count === 1) {
    return null
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.List(self__.meta, o, coll, self__.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.List(meta__$1, self__.first, self__.rest, self__.count, self__.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
goog.provide("cljs.core.EmptyList");
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.List(self__.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.EmptyList(meta__$1)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__3327 = coll;
  if(G__3327) {
    if(function() {
      var or__3943__auto__ = G__3327.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__3327.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__3327.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__3327)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__3327)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__3328__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__3328 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3328__delegate.call(this, x, y, z, items)
    };
    G__3328.cljs$lang$maxFixedArity = 3;
    G__3328.cljs$lang$applyTo = function(arglist__3329) {
      var x = cljs.core.first(arglist__3329);
      var y = cljs.core.first(cljs.core.next(arglist__3329));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3329)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3329)));
      return G__3328__delegate(x, y, z, items)
    };
    G__3328.cljs$lang$arity$variadic = G__3328__delegate;
    return G__3328
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
goog.provide("cljs.core.Cons");
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, self__.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.Cons(null, o, coll, self__.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.Cons(meta__$1, self__.first, self__.rest, self__.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3943__auto__ = coll == null;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      var G__3331 = coll;
      if(G__3331) {
        if(function() {
          var or__3943__auto____$1 = G__3331.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            return G__3331.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__3331.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__3331)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__3331)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__3333 = x;
  if(G__3333) {
    if(function() {
      var or__3943__auto__ = G__3333.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__3333.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__3333.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__3333)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__3333)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__3334 = null;
  var G__3334__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__3334__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__3334 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3334__2.call(this, string, f);
      case 3:
        return G__3334__3.call(this, string, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3334
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__3335 = null;
  var G__3335__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__3335__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__3335 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3335__2.call(this, string, k);
      case 3:
        return G__3335__3.call(this, string, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3335
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__3336 = null;
  var G__3336__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__3336__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__3336 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3336__2.call(this, string, n);
      case 3:
        return G__3336__3.call(this, string, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3336
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
goog.provide("cljs.core.Keyword");
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__3338 = null;
  var G__3338__2 = function(self__, coll) {
    var self__ = this;
    var self____$1 = this;
    var _ = self____$1;
    if(coll == null) {
      return null
    }else {
      var strobj = coll.strobj;
      if(strobj == null) {
        return cljs.core._lookup.call(null, coll, self__.k, null)
      }else {
        return strobj[self__.k]
      }
    }
  };
  var G__3338__3 = function(self__, coll, not_found) {
    var self__ = this;
    var self____$1 = this;
    var _ = self____$1;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, self__.k, not_found)
    }
  };
  G__3338 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3338__2.call(this, self__, coll);
      case 3:
        return G__3338__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3338
}();
cljs.core.Keyword.prototype.apply = function(self__, args3337) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3337.slice()))
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__3340 = null;
  var G__3340__2 = function(self__, coll) {
    var self____$1 = this;
    var this$ = self____$1;
    return cljs.core._lookup.call(null, coll, this$.toString(), null)
  };
  var G__3340__3 = function(self__, coll, not_found) {
    var self____$1 = this;
    var this$ = self____$1;
    return cljs.core._lookup.call(null, coll, this$.toString(), not_found)
  };
  G__3340 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3340__2.call(this, self__, coll);
      case 3:
        return G__3340__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3340
}();
String.prototype.apply = function(self__, args3339) {
  return self__.call.apply(self__, [self__].concat(args3339.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x = lazy_seq.x;
  if(lazy_seq.realized) {
    return x
  }else {
    lazy_seq.x = x.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
goog.provide("cljs.core.LazySeq");
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.LazySeq(meta__$1, self__.realized, self__.x, self__.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
goog.provide("cljs.core.ChunkBuffer");
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var self__ = this;
  var _ = this;
  self__.buf[self__.end] = o;
  return self__.end = self__.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var self__ = this;
  var _ = this;
  var ret = new cljs.core.ArrayChunk(self__.buf, 0, self__.end);
  self__.buf = null;
  return ret
};
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
goog.provide("cljs.core.ArrayChunk");
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, self__.arr[self__.off], self__.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, start, self__.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off === self__.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(self__.arr, self__.off + 1, self__.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var self__ = this;
  return self__.arr[self__.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = i >= 0;
    if(and__3941__auto__) {
      return i < self__.end - self__.off
    }else {
      return and__3941__auto__
    }
  }()) {
    return self__.arr[self__.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.end - self__.off
};
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
goog.provide("cljs.core.ChunkedCons");
cljs.core.ChunkedCons = function(chunk, more, meta, __hash) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31850604;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core._count.call(null, self__.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, self__.chunk), self__.more, self__.meta, null)
  }else {
    if(self__.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return self__.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.more == null) {
    return null
  }else {
    return self__.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  return new cljs.core.ChunkedCons(self__.chunk, self__.more, m, self__.__hash)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.more
  }
};
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__3342 = s;
    if(G__3342) {
      if(function() {
        var or__3943__auto__ = G__3342.cljs$lang$protocol_mask$partition1$ & 1024;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__3342.cljs$core$IChunkedNext$
        }
      }()) {
        return true
      }else {
        if(!G__3342.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__3342)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__3342)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary = [];
  var s__$1 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__$1)) {
      ary.push(cljs.core.first.call(null, s__$1));
      var G__3343 = cljs.core.next.call(null, s__$1);
      s__$1 = G__3343;
      continue
    }else {
      return ary
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i_3344 = 0;
  var xs_3345 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs_3345) {
      ret[i_3344] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs_3345));
      var G__3346 = i_3344 + 1;
      var G__3347 = cljs.core.next.call(null, xs_3345);
      i_3344 = G__3346;
      xs_3345 = G__3347;
      continue
    }else {
    }
    break
  }
  return ret
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__3348 = i + 1;
          var G__3349 = cljs.core.next.call(null, s__$1);
          i = G__3348;
          s__$1 = G__3349;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__2676__auto___3350 = size;
      var i_3351 = 0;
      while(true) {
        if(i_3351 < n__2676__auto___3350) {
          a[i_3351] = init_val_or_seq;
          var G__3352 = i_3351 + 1;
          i_3351 = G__3352;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__3353 = i + 1;
          var G__3354 = cljs.core.next.call(null, s__$1);
          i = G__3353;
          s__$1 = G__3354;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__2676__auto___3355 = size;
      var i_3356 = 0;
      while(true) {
        if(i_3356 < n__2676__auto___3355) {
          a[i_3356] = init_val_or_seq;
          var G__3357 = i_3356 + 1;
          i_3356 = G__3357;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__3358 = i + 1;
          var G__3359 = cljs.core.next.call(null, s__$1);
          i = G__3358;
          s__$1 = G__3359;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__2676__auto___3360 = size;
      var i_3361 = 0;
      while(true) {
        if(i_3361 < n__2676__auto___3360) {
          a[i_3361] = init_val_or_seq;
          var G__3362 = i_3361 + 1;
          i_3361 = G__3362;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__$1 = s;
    var i = n;
    var sum = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = i > 0;
        if(and__3941__auto__) {
          return cljs.core.seq.call(null, s__$1)
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__3363 = cljs.core.next.call(null, s__$1);
        var G__3364 = i - 1;
        var G__3365 = sum + 1;
        s__$1 = G__3363;
        i = G__3364;
        sum = G__3365;
        continue
      }else {
        return sum
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s = cljs.core.seq.call(null, x);
      if(s) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s), concat.call(null, cljs.core.chunk_rest.call(null, s), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s), concat.call(null, cljs.core.rest.call(null, s), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__3366__delegate = function(x, y, zs) {
      var cat = function cat(xys, zs__$1) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__$1 = cljs.core.seq.call(null, xys);
          if(xys__$1) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__$1)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__$1), cat.call(null, cljs.core.chunk_rest.call(null, xys__$1), zs__$1))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__$1), cat.call(null, cljs.core.rest.call(null, xys__$1), zs__$1))
            }
          }else {
            if(cljs.core.truth_(zs__$1)) {
              return cat.call(null, cljs.core.first.call(null, zs__$1), cljs.core.next.call(null, zs__$1))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat.call(null, concat.call(null, x, y), zs)
    };
    var G__3366 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3366__delegate.call(this, x, y, zs)
    };
    G__3366.cljs$lang$maxFixedArity = 2;
    G__3366.cljs$lang$applyTo = function(arglist__3367) {
      var x = cljs.core.first(arglist__3367);
      var y = cljs.core.first(cljs.core.next(arglist__3367));
      var zs = cljs.core.rest(cljs.core.next(arglist__3367));
      return G__3366__delegate(x, y, zs)
    };
    G__3366.cljs$lang$arity$variadic = G__3366__delegate;
    return G__3366
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__3368__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__3368 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3368__delegate.call(this, a, b, c, d, more)
    };
    G__3368.cljs$lang$maxFixedArity = 4;
    G__3368.cljs$lang$applyTo = function(arglist__3369) {
      var a = cljs.core.first(arglist__3369);
      var b = cljs.core.first(cljs.core.next(arglist__3369));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3369)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3369))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3369))));
      return G__3368__delegate(a, b, c, d, more)
    };
    G__3368.cljs$lang$arity$variadic = G__3368__delegate;
    return G__3368
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__$1 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a = cljs.core._first.call(null, args__$1);
    var args__$2 = cljs.core._rest.call(null, args__$1);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a)
      }else {
        return f.call(null, a)
      }
    }else {
      var b = cljs.core._first.call(null, args__$2);
      var args__$3 = cljs.core._rest.call(null, args__$2);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a, b)
        }else {
          return f.call(null, a, b)
        }
      }else {
        var c = cljs.core._first.call(null, args__$3);
        var args__$4 = cljs.core._rest.call(null, args__$3);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a, b, c)
          }else {
            return f.call(null, a, b, c)
          }
        }else {
          var d = cljs.core._first.call(null, args__$4);
          var args__$5 = cljs.core._rest.call(null, args__$4);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a, b, c, d)
            }else {
              return f.call(null, a, b, c, d)
            }
          }else {
            var e = cljs.core._first.call(null, args__$5);
            var args__$6 = cljs.core._rest.call(null, args__$5);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a, b, c, d, e)
              }else {
                return f.call(null, a, b, c, d, e)
              }
            }else {
              var f__$1 = cljs.core._first.call(null, args__$6);
              var args__$7 = cljs.core._rest.call(null, args__$6);
              if(argc === 6) {
                if(f__$1.cljs$lang$arity$6) {
                  return f__$1.cljs$lang$arity$6(a, b, c, d, e, f__$1)
                }else {
                  return f__$1.call(null, a, b, c, d, e, f__$1)
                }
              }else {
                var g = cljs.core._first.call(null, args__$7);
                var args__$8 = cljs.core._rest.call(null, args__$7);
                if(argc === 7) {
                  if(f__$1.cljs$lang$arity$7) {
                    return f__$1.cljs$lang$arity$7(a, b, c, d, e, f__$1, g)
                  }else {
                    return f__$1.call(null, a, b, c, d, e, f__$1, g)
                  }
                }else {
                  var h = cljs.core._first.call(null, args__$8);
                  var args__$9 = cljs.core._rest.call(null, args__$8);
                  if(argc === 8) {
                    if(f__$1.cljs$lang$arity$8) {
                      return f__$1.cljs$lang$arity$8(a, b, c, d, e, f__$1, g, h)
                    }else {
                      return f__$1.call(null, a, b, c, d, e, f__$1, g, h)
                    }
                  }else {
                    var i = cljs.core._first.call(null, args__$9);
                    var args__$10 = cljs.core._rest.call(null, args__$9);
                    if(argc === 9) {
                      if(f__$1.cljs$lang$arity$9) {
                        return f__$1.cljs$lang$arity$9(a, b, c, d, e, f__$1, g, h, i)
                      }else {
                        return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i)
                      }
                    }else {
                      var j = cljs.core._first.call(null, args__$10);
                      var args__$11 = cljs.core._rest.call(null, args__$10);
                      if(argc === 10) {
                        if(f__$1.cljs$lang$arity$10) {
                          return f__$1.cljs$lang$arity$10(a, b, c, d, e, f__$1, g, h, i, j)
                        }else {
                          return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j)
                        }
                      }else {
                        var k = cljs.core._first.call(null, args__$11);
                        var args__$12 = cljs.core._rest.call(null, args__$11);
                        if(argc === 11) {
                          if(f__$1.cljs$lang$arity$11) {
                            return f__$1.cljs$lang$arity$11(a, b, c, d, e, f__$1, g, h, i, j, k)
                          }else {
                            return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k)
                          }
                        }else {
                          var l = cljs.core._first.call(null, args__$12);
                          var args__$13 = cljs.core._rest.call(null, args__$12);
                          if(argc === 12) {
                            if(f__$1.cljs$lang$arity$12) {
                              return f__$1.cljs$lang$arity$12(a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }else {
                              return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }
                          }else {
                            var m = cljs.core._first.call(null, args__$13);
                            var args__$14 = cljs.core._rest.call(null, args__$13);
                            if(argc === 13) {
                              if(f__$1.cljs$lang$arity$13) {
                                return f__$1.cljs$lang$arity$13(a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }else {
                                return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }
                            }else {
                              var n = cljs.core._first.call(null, args__$14);
                              var args__$15 = cljs.core._rest.call(null, args__$14);
                              if(argc === 14) {
                                if(f__$1.cljs$lang$arity$14) {
                                  return f__$1.cljs$lang$arity$14(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }else {
                                  return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }
                              }else {
                                var o = cljs.core._first.call(null, args__$15);
                                var args__$16 = cljs.core._rest.call(null, args__$15);
                                if(argc === 15) {
                                  if(f__$1.cljs$lang$arity$15) {
                                    return f__$1.cljs$lang$arity$15(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }else {
                                    return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }
                                }else {
                                  var p = cljs.core._first.call(null, args__$16);
                                  var args__$17 = cljs.core._rest.call(null, args__$16);
                                  if(argc === 16) {
                                    if(f__$1.cljs$lang$arity$16) {
                                      return f__$1.cljs$lang$arity$16(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }else {
                                      return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }
                                  }else {
                                    var q = cljs.core._first.call(null, args__$17);
                                    var args__$18 = cljs.core._rest.call(null, args__$17);
                                    if(argc === 17) {
                                      if(f__$1.cljs$lang$arity$17) {
                                        return f__$1.cljs$lang$arity$17(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }else {
                                        return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }
                                    }else {
                                      var r = cljs.core._first.call(null, args__$18);
                                      var args__$19 = cljs.core._rest.call(null, args__$18);
                                      if(argc === 18) {
                                        if(f__$1.cljs$lang$arity$18) {
                                          return f__$1.cljs$lang$arity$18(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }else {
                                          return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }
                                      }else {
                                        var s = cljs.core._first.call(null, args__$19);
                                        var args__$20 = cljs.core._rest.call(null, args__$19);
                                        if(argc === 19) {
                                          if(f__$1.cljs$lang$arity$19) {
                                            return f__$1.cljs$lang$arity$19(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }else {
                                            return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }
                                        }else {
                                          var t = cljs.core._first.call(null, args__$20);
                                          var args__$21 = cljs.core._rest.call(null, args__$20);
                                          if(argc === 20) {
                                            if(f__$1.cljs$lang$arity$20) {
                                              return f__$1.cljs$lang$arity$20(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }else {
                                              return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, args, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__6 = function() {
    var G__3370__delegate = function(f, a, b, c, d, args) {
      var arglist = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity = f.cljs$lang$maxFixedArity;
      if(f.cljs$lang$applyTo) {
        var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
        if(bc <= fixed_arity) {
          return cljs.core.apply_to.call(null, f, bc, arglist)
        }else {
          return f.cljs$lang$applyTo(arglist)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist))
      }
    };
    var G__3370 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__3370__delegate.call(this, f, a, b, c, d, args)
    };
    G__3370.cljs$lang$maxFixedArity = 5;
    G__3370.cljs$lang$applyTo = function(arglist__3371) {
      var f = cljs.core.first(arglist__3371);
      var a = cljs.core.first(cljs.core.next(arglist__3371));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3371)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3371))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3371)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3371)))));
      return G__3370__delegate(f, a, b, c, d, args)
    };
    G__3370.cljs$lang$arity$variadic = G__3370__delegate;
    return G__3370
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__3372) {
    var obj = cljs.core.first(arglist__3372);
    var f = cljs.core.first(cljs.core.next(arglist__3372));
    var args = cljs.core.rest(cljs.core.next(arglist__3372));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__3373__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__3373 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3373__delegate.call(this, x, y, more)
    };
    G__3373.cljs$lang$maxFixedArity = 2;
    G__3373.cljs$lang$applyTo = function(arglist__3374) {
      var x = cljs.core.first(arglist__3374);
      var y = cljs.core.first(cljs.core.next(arglist__3374));
      var more = cljs.core.rest(cljs.core.next(arglist__3374));
      return G__3373__delegate(x, y, more)
    };
    G__3373.cljs$lang$arity$variadic = G__3373__delegate;
    return G__3373
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__3375 = pred;
        var G__3376 = cljs.core.next.call(null, coll);
        pred = G__3375;
        coll = G__3376;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3943__auto__ = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        var G__3377 = pred;
        var G__3378 = cljs.core.next.call(null, coll);
        pred = G__3377;
        coll = G__3378;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__3379 = null;
    var G__3379__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__3379__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__3379__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__3379__3 = function() {
      var G__3380__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__3380 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__3380__delegate.call(this, x, y, zs)
      };
      G__3380.cljs$lang$maxFixedArity = 2;
      G__3380.cljs$lang$applyTo = function(arglist__3381) {
        var x = cljs.core.first(arglist__3381);
        var y = cljs.core.first(cljs.core.next(arglist__3381));
        var zs = cljs.core.rest(cljs.core.next(arglist__3381));
        return G__3380__delegate(x, y, zs)
      };
      G__3380.cljs$lang$arity$variadic = G__3380__delegate;
      return G__3380
    }();
    G__3379 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__3379__0.call(this);
        case 1:
          return G__3379__1.call(this, x);
        case 2:
          return G__3379__2.call(this, x, y);
        default:
          return G__3379__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw new Error("Invalid arity: " + arguments.length);
    };
    G__3379.cljs$lang$maxFixedArity = 2;
    G__3379.cljs$lang$applyTo = G__3379__3.cljs$lang$applyTo;
    return G__3379
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__3382__delegate = function(args) {
      return x
    };
    var G__3382 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3382__delegate.call(this, args)
    };
    G__3382.cljs$lang$maxFixedArity = 0;
    G__3382.cljs$lang$applyTo = function(arglist__3383) {
      var args = cljs.core.seq(arglist__3383);
      return G__3382__delegate(args)
    };
    G__3382.cljs$lang$arity$variadic = G__3382__delegate;
    return G__3382
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__3384 = null;
      var G__3384__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__3384__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__3384__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__3384__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__3384__4 = function() {
        var G__3385__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__3385 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3385__delegate.call(this, x, y, z, args)
        };
        G__3385.cljs$lang$maxFixedArity = 3;
        G__3385.cljs$lang$applyTo = function(arglist__3386) {
          var x = cljs.core.first(arglist__3386);
          var y = cljs.core.first(cljs.core.next(arglist__3386));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3386)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3386)));
          return G__3385__delegate(x, y, z, args)
        };
        G__3385.cljs$lang$arity$variadic = G__3385__delegate;
        return G__3385
      }();
      G__3384 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3384__0.call(this);
          case 1:
            return G__3384__1.call(this, x);
          case 2:
            return G__3384__2.call(this, x, y);
          case 3:
            return G__3384__3.call(this, x, y, z);
          default:
            return G__3384__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3384.cljs$lang$maxFixedArity = 3;
      G__3384.cljs$lang$applyTo = G__3384__4.cljs$lang$applyTo;
      return G__3384
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__3387 = null;
      var G__3387__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__3387__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__3387__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__3387__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__3387__4 = function() {
        var G__3388__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__3388 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3388__delegate.call(this, x, y, z, args)
        };
        G__3388.cljs$lang$maxFixedArity = 3;
        G__3388.cljs$lang$applyTo = function(arglist__3389) {
          var x = cljs.core.first(arglist__3389);
          var y = cljs.core.first(cljs.core.next(arglist__3389));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3389)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3389)));
          return G__3388__delegate(x, y, z, args)
        };
        G__3388.cljs$lang$arity$variadic = G__3388__delegate;
        return G__3388
      }();
      G__3387 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3387__0.call(this);
          case 1:
            return G__3387__1.call(this, x);
          case 2:
            return G__3387__2.call(this, x, y);
          case 3:
            return G__3387__3.call(this, x, y, z);
          default:
            return G__3387__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3387.cljs$lang$maxFixedArity = 3;
      G__3387.cljs$lang$applyTo = G__3387__4.cljs$lang$applyTo;
      return G__3387
    }()
  };
  var comp__4 = function() {
    var G__3390__delegate = function(f1, f2, f3, fs) {
      var fs__$1 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__3391__delegate = function(args) {
          var ret = cljs.core.apply.call(null, cljs.core.first.call(null, fs__$1), args);
          var fs__$2 = cljs.core.next.call(null, fs__$1);
          while(true) {
            if(fs__$2) {
              var G__3392 = cljs.core.first.call(null, fs__$2).call(null, ret);
              var G__3393 = cljs.core.next.call(null, fs__$2);
              ret = G__3392;
              fs__$2 = G__3393;
              continue
            }else {
              return ret
            }
            break
          }
        };
        var G__3391 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3391__delegate.call(this, args)
        };
        G__3391.cljs$lang$maxFixedArity = 0;
        G__3391.cljs$lang$applyTo = function(arglist__3394) {
          var args = cljs.core.seq(arglist__3394);
          return G__3391__delegate(args)
        };
        G__3391.cljs$lang$arity$variadic = G__3391__delegate;
        return G__3391
      }()
    };
    var G__3390 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3390__delegate.call(this, f1, f2, f3, fs)
    };
    G__3390.cljs$lang$maxFixedArity = 3;
    G__3390.cljs$lang$applyTo = function(arglist__3395) {
      var f1 = cljs.core.first(arglist__3395);
      var f2 = cljs.core.first(cljs.core.next(arglist__3395));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3395)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3395)));
      return G__3390__delegate(f1, f2, f3, fs)
    };
    G__3390.cljs$lang$arity$variadic = G__3390__delegate;
    return G__3390
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__3396__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__3396 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3396__delegate.call(this, args)
      };
      G__3396.cljs$lang$maxFixedArity = 0;
      G__3396.cljs$lang$applyTo = function(arglist__3397) {
        var args = cljs.core.seq(arglist__3397);
        return G__3396__delegate(args)
      };
      G__3396.cljs$lang$arity$variadic = G__3396__delegate;
      return G__3396
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__3398__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__3398 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3398__delegate.call(this, args)
      };
      G__3398.cljs$lang$maxFixedArity = 0;
      G__3398.cljs$lang$applyTo = function(arglist__3399) {
        var args = cljs.core.seq(arglist__3399);
        return G__3398__delegate(args)
      };
      G__3398.cljs$lang$arity$variadic = G__3398__delegate;
      return G__3398
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__3400__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__3400 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3400__delegate.call(this, args)
      };
      G__3400.cljs$lang$maxFixedArity = 0;
      G__3400.cljs$lang$applyTo = function(arglist__3401) {
        var args = cljs.core.seq(arglist__3401);
        return G__3400__delegate(args)
      };
      G__3400.cljs$lang$arity$variadic = G__3400__delegate;
      return G__3400
    }()
  };
  var partial__5 = function() {
    var G__3402__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__3403__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__3403 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3403__delegate.call(this, args)
        };
        G__3403.cljs$lang$maxFixedArity = 0;
        G__3403.cljs$lang$applyTo = function(arglist__3404) {
          var args = cljs.core.seq(arglist__3404);
          return G__3403__delegate(args)
        };
        G__3403.cljs$lang$arity$variadic = G__3403__delegate;
        return G__3403
      }()
    };
    var G__3402 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3402__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__3402.cljs$lang$maxFixedArity = 4;
    G__3402.cljs$lang$applyTo = function(arglist__3405) {
      var f = cljs.core.first(arglist__3405);
      var arg1 = cljs.core.first(cljs.core.next(arglist__3405));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3405)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3405))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3405))));
      return G__3402__delegate(f, arg1, arg2, arg3, more)
    };
    G__3402.cljs$lang$arity$variadic = G__3402__delegate;
    return G__3402
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__3406 = null;
      var G__3406__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__3406__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__3406__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__3406__4 = function() {
        var G__3407__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__3407 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3407__delegate.call(this, a, b, c, ds)
        };
        G__3407.cljs$lang$maxFixedArity = 3;
        G__3407.cljs$lang$applyTo = function(arglist__3408) {
          var a = cljs.core.first(arglist__3408);
          var b = cljs.core.first(cljs.core.next(arglist__3408));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3408)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3408)));
          return G__3407__delegate(a, b, c, ds)
        };
        G__3407.cljs$lang$arity$variadic = G__3407__delegate;
        return G__3407
      }();
      G__3406 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__3406__1.call(this, a);
          case 2:
            return G__3406__2.call(this, a, b);
          case 3:
            return G__3406__3.call(this, a, b, c);
          default:
            return G__3406__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3406.cljs$lang$maxFixedArity = 3;
      G__3406.cljs$lang$applyTo = G__3406__4.cljs$lang$applyTo;
      return G__3406
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__3409 = null;
      var G__3409__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__3409__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__3409__4 = function() {
        var G__3410__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__3410 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3410__delegate.call(this, a, b, c, ds)
        };
        G__3410.cljs$lang$maxFixedArity = 3;
        G__3410.cljs$lang$applyTo = function(arglist__3411) {
          var a = cljs.core.first(arglist__3411);
          var b = cljs.core.first(cljs.core.next(arglist__3411));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3411)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3411)));
          return G__3410__delegate(a, b, c, ds)
        };
        G__3410.cljs$lang$arity$variadic = G__3410__delegate;
        return G__3410
      }();
      G__3409 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3409__2.call(this, a, b);
          case 3:
            return G__3409__3.call(this, a, b, c);
          default:
            return G__3409__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3409.cljs$lang$maxFixedArity = 3;
      G__3409.cljs$lang$applyTo = G__3409__4.cljs$lang$applyTo;
      return G__3409
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__3412 = null;
      var G__3412__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__3412__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__3412__4 = function() {
        var G__3413__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__3413 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3413__delegate.call(this, a, b, c, ds)
        };
        G__3413.cljs$lang$maxFixedArity = 3;
        G__3413.cljs$lang$applyTo = function(arglist__3414) {
          var a = cljs.core.first(arglist__3414);
          var b = cljs.core.first(cljs.core.next(arglist__3414));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3414)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3414)));
          return G__3413__delegate(a, b, c, ds)
        };
        G__3413.cljs$lang$arity$variadic = G__3413__delegate;
        return G__3413
      }();
      G__3412 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3412__2.call(this, a, b);
          case 3:
            return G__3412__3.call(this, a, b, c);
          default:
            return G__3412__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3412.cljs$lang$maxFixedArity = 3;
      G__3412.cljs$lang$applyTo = G__3412__4.cljs$lang$applyTo;
      return G__3412
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi = function mapi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll__$1);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__2676__auto___3415 = size;
          var i_3416 = 0;
          while(true) {
            if(i_3416 < n__2676__auto___3415) {
              cljs.core.chunk_append.call(null, b, f.call(null, idx + i_3416, cljs.core._nth.call(null, c, i_3416)));
              var G__3417 = i_3416 + 1;
              i_3416 = G__3417;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), mapi.call(null, idx + size, cljs.core.chunk_rest.call(null, s)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
        var c = cljs.core.chunk_first.call(null, s);
        var size = cljs.core.count.call(null, c);
        var b = cljs.core.chunk_buffer.call(null, size);
        var n__2676__auto___3418 = size;
        var i_3419 = 0;
        while(true) {
          if(i_3419 < n__2676__auto___3418) {
            var x_3420 = f.call(null, cljs.core._nth.call(null, c, i_3419));
            if(x_3420 == null) {
            }else {
              cljs.core.chunk_append.call(null, b, x_3420)
            }
            var G__3421 = i_3419 + 1;
            i_3419 = G__3421;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), keep.call(null, f, cljs.core.chunk_rest.call(null, s)))
      }else {
        var x = f.call(null, cljs.core.first.call(null, s));
        if(x == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s))
        }else {
          return cljs.core.cons.call(null, x, keep.call(null, f, cljs.core.rest.call(null, s)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi = function keepi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll__$1);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__2676__auto___3428 = size;
          var i_3429 = 0;
          while(true) {
            if(i_3429 < n__2676__auto___3428) {
              var x_3430 = f.call(null, idx + i_3429, cljs.core._nth.call(null, c, i_3429));
              if(x_3430 == null) {
              }else {
                cljs.core.chunk_append.call(null, b, x_3430)
              }
              var G__3431 = i_3429 + 1;
              i_3429 = G__3431;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), keepi.call(null, idx + size, cljs.core.chunk_rest.call(null, s)))
        }else {
          var x = f.call(null, idx, cljs.core.first.call(null, s));
          if(x == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s))
          }else {
            return cljs.core.cons.call(null, x, keepi.call(null, idx + 1, cljs.core.rest.call(null, s)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            return p.call(null, y)
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return p.call(null, z)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep1__4 = function() {
        var G__3438__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto__ = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__3438 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3438__delegate.call(this, x, y, z, args)
        };
        G__3438.cljs$lang$maxFixedArity = 3;
        G__3438.cljs$lang$applyTo = function(arglist__3439) {
          var x = cljs.core.first(arglist__3439);
          var y = cljs.core.first(cljs.core.next(arglist__3439));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3439)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3439)));
          return G__3438__delegate(x, y, z, args)
        };
        G__3438.cljs$lang$arity$variadic = G__3438__delegate;
        return G__3438
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            return p2.call(null, x)
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p2.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                return p2.call(null, y)
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p1.call(null, z);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p2.call(null, x);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    return p2.call(null, z)
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__4 = function() {
        var G__3440__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto__ = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3422_SHARP_) {
                var and__3941__auto____$1 = p1.call(null, p1__3422_SHARP_);
                if(cljs.core.truth_(and__3941__auto____$1)) {
                  return p2.call(null, p1__3422_SHARP_)
                }else {
                  return and__3941__auto____$1
                }
              }, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__3440 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3440__delegate.call(this, x, y, z, args)
        };
        G__3440.cljs$lang$maxFixedArity = 3;
        G__3440.cljs$lang$applyTo = function(arglist__3441) {
          var x = cljs.core.first(arglist__3441);
          var y = cljs.core.first(cljs.core.next(arglist__3441));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3441)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3441)));
          return G__3440__delegate(x, y, z, args)
        };
        G__3440.cljs$lang$arity$variadic = G__3440__delegate;
        return G__3440
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return p3.call(null, x)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    return p3.call(null, y)
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    var and__3941__auto____$5 = p3.call(null, y);
                    if(cljs.core.truth_(and__3941__auto____$5)) {
                      var and__3941__auto____$6 = p1.call(null, z);
                      if(cljs.core.truth_(and__3941__auto____$6)) {
                        var and__3941__auto____$7 = p2.call(null, z);
                        if(cljs.core.truth_(and__3941__auto____$7)) {
                          return p3.call(null, z)
                        }else {
                          return and__3941__auto____$7
                        }
                      }else {
                        return and__3941__auto____$6
                      }
                    }else {
                      return and__3941__auto____$5
                    }
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__4 = function() {
        var G__3442__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto__ = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3423_SHARP_) {
                var and__3941__auto____$1 = p1.call(null, p1__3423_SHARP_);
                if(cljs.core.truth_(and__3941__auto____$1)) {
                  var and__3941__auto____$2 = p2.call(null, p1__3423_SHARP_);
                  if(cljs.core.truth_(and__3941__auto____$2)) {
                    return p3.call(null, p1__3423_SHARP_)
                  }else {
                    return and__3941__auto____$2
                  }
                }else {
                  return and__3941__auto____$1
                }
              }, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__3442 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3442__delegate.call(this, x, y, z, args)
        };
        G__3442.cljs$lang$maxFixedArity = 3;
        G__3442.cljs$lang$applyTo = function(arglist__3443) {
          var x = cljs.core.first(arglist__3443);
          var y = cljs.core.first(cljs.core.next(arglist__3443));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3443)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3443)));
          return G__3442__delegate(x, y, z, args)
        };
        G__3442.cljs$lang$arity$variadic = G__3442__delegate;
        return G__3442
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__3444__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__3424_SHARP_) {
            return p1__3424_SHARP_.call(null, x)
          }, ps__$1)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__3425_SHARP_) {
            var and__3941__auto__ = p1__3425_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto__)) {
              return p1__3425_SHARP_.call(null, y)
            }else {
              return and__3941__auto__
            }
          }, ps__$1)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__3426_SHARP_) {
            var and__3941__auto__ = p1__3426_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto__)) {
              var and__3941__auto____$1 = p1__3426_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3941__auto____$1)) {
                return p1__3426_SHARP_.call(null, z)
              }else {
                return and__3941__auto____$1
              }
            }else {
              return and__3941__auto__
            }
          }, ps__$1)
        };
        var epn__4 = function() {
          var G__3445__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3941__auto__ = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3941__auto__)) {
                return cljs.core.every_QMARK_.call(null, function(p1__3427_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__3427_SHARP_, args)
                }, ps__$1)
              }else {
                return and__3941__auto__
              }
            }())
          };
          var G__3445 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3445__delegate.call(this, x, y, z, args)
          };
          G__3445.cljs$lang$maxFixedArity = 3;
          G__3445.cljs$lang$applyTo = function(arglist__3446) {
            var x = cljs.core.first(arglist__3446);
            var y = cljs.core.first(cljs.core.next(arglist__3446));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3446)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3446)));
            return G__3445__delegate(x, y, z, args)
          };
          G__3445.cljs$lang$arity$variadic = G__3445__delegate;
          return G__3445
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__3444 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3444__delegate.call(this, p1, p2, p3, ps)
    };
    G__3444.cljs$lang$maxFixedArity = 3;
    G__3444.cljs$lang$applyTo = function(arglist__3447) {
      var p1 = cljs.core.first(arglist__3447);
      var p2 = cljs.core.first(cljs.core.next(arglist__3447));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3447)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3447)));
      return G__3444__delegate(p1, p2, p3, ps)
    };
    G__3444.cljs$lang$arity$variadic = G__3444__delegate;
    return G__3444
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3943__auto__ = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3943__auto__ = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__3449__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__3449 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3449__delegate.call(this, x, y, z, args)
        };
        G__3449.cljs$lang$maxFixedArity = 3;
        G__3449.cljs$lang$applyTo = function(arglist__3450) {
          var x = cljs.core.first(arglist__3450);
          var y = cljs.core.first(cljs.core.next(arglist__3450));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3450)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3450)));
          return G__3449__delegate(x, y, z, args)
        };
        G__3449.cljs$lang$arity$variadic = G__3449__delegate;
        return G__3449
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p2.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p1.call(null, z);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p2.call(null, x);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__3451__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some.call(null, function(p1__3432_SHARP_) {
              var or__3943__auto____$1 = p1.call(null, p1__3432_SHARP_);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                return p2.call(null, p1__3432_SHARP_)
              }
            }, args)
          }
        };
        var G__3451 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3451__delegate.call(this, x, y, z, args)
        };
        G__3451.cljs$lang$maxFixedArity = 3;
        G__3451.cljs$lang$applyTo = function(arglist__3452) {
          var x = cljs.core.first(arglist__3452);
          var y = cljs.core.first(cljs.core.next(arglist__3452));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3452)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3452)));
          return G__3451__delegate(x, y, z, args)
        };
        G__3451.cljs$lang$arity$variadic = G__3451__delegate;
        return G__3451
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  var or__3943__auto____$5 = p3.call(null, y);
                  if(cljs.core.truth_(or__3943__auto____$5)) {
                    return or__3943__auto____$5
                  }else {
                    var or__3943__auto____$6 = p1.call(null, z);
                    if(cljs.core.truth_(or__3943__auto____$6)) {
                      return or__3943__auto____$6
                    }else {
                      var or__3943__auto____$7 = p2.call(null, z);
                      if(cljs.core.truth_(or__3943__auto____$7)) {
                        return or__3943__auto____$7
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__3453__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some.call(null, function(p1__3433_SHARP_) {
              var or__3943__auto____$1 = p1.call(null, p1__3433_SHARP_);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                var or__3943__auto____$2 = p2.call(null, p1__3433_SHARP_);
                if(cljs.core.truth_(or__3943__auto____$2)) {
                  return or__3943__auto____$2
                }else {
                  return p3.call(null, p1__3433_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__3453 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3453__delegate.call(this, x, y, z, args)
        };
        G__3453.cljs$lang$maxFixedArity = 3;
        G__3453.cljs$lang$applyTo = function(arglist__3454) {
          var x = cljs.core.first(arglist__3454);
          var y = cljs.core.first(cljs.core.next(arglist__3454));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3454)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3454)));
          return G__3453__delegate(x, y, z, args)
        };
        G__3453.cljs$lang$arity$variadic = G__3453__delegate;
        return G__3453
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__3455__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__3434_SHARP_) {
            return p1__3434_SHARP_.call(null, x)
          }, ps__$1)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__3435_SHARP_) {
            var or__3943__auto__ = p1__3435_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return p1__3435_SHARP_.call(null, y)
            }
          }, ps__$1)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__3436_SHARP_) {
            var or__3943__auto__ = p1__3436_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              var or__3943__auto____$1 = p1__3436_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                return p1__3436_SHARP_.call(null, z)
              }
            }
          }, ps__$1)
        };
        var spn__4 = function() {
          var G__3456__delegate = function(x, y, z, args) {
            var or__3943__auto__ = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return cljs.core.some.call(null, function(p1__3437_SHARP_) {
                return cljs.core.some.call(null, p1__3437_SHARP_, args)
              }, ps__$1)
            }
          };
          var G__3456 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3456__delegate.call(this, x, y, z, args)
          };
          G__3456.cljs$lang$maxFixedArity = 3;
          G__3456.cljs$lang$applyTo = function(arglist__3457) {
            var x = cljs.core.first(arglist__3457);
            var y = cljs.core.first(cljs.core.next(arglist__3457));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3457)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3457)));
            return G__3456__delegate(x, y, z, args)
          };
          G__3456.cljs$lang$arity$variadic = G__3456__delegate;
          return G__3456
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__3455 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3455__delegate.call(this, p1, p2, p3, ps)
    };
    G__3455.cljs$lang$maxFixedArity = 3;
    G__3455.cljs$lang$applyTo = function(arglist__3458) {
      var p1 = cljs.core.first(arglist__3458);
      var p2 = cljs.core.first(cljs.core.next(arglist__3458));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3458)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3458)));
      return G__3455__delegate(p1, p2, p3, ps)
    };
    G__3455.cljs$lang$arity$variadic = G__3455__delegate;
    return G__3455
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__2676__auto___3459 = size;
          var i_3460 = 0;
          while(true) {
            if(i_3460 < n__2676__auto___3459) {
              cljs.core.chunk_append.call(null, b, f.call(null, cljs.core._nth.call(null, c, i_3460)));
              var G__3461 = i_3460 + 1;
              i_3460 = G__3461;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), map.call(null, f, cljs.core.chunk_rest.call(null, s)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s)), map.call(null, f, cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2__$1);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          return s2
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1), cljs.core.first.call(null, s2)), map.call(null, f, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2__$1, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2__$1);
      var s3 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          var and__3941__auto____$1 = s2;
          if(and__3941__auto____$1) {
            return s3
          }else {
            return and__3941__auto____$1
          }
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1), cljs.core.first.call(null, s2), cljs.core.first.call(null, s3)), map.call(null, f, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2), cljs.core.rest.call(null, s3)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__3462__delegate = function(f, c1, c2__$1, c3, colls) {
      var step = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss), step.call(null, map.call(null, cljs.core.rest, ss)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__3448_SHARP_) {
        return cljs.core.apply.call(null, f, p1__3448_SHARP_)
      }, step.call(null, cljs.core.conj.call(null, colls, c3, c2__$1, c1)))
    };
    var G__3462 = function(f, c1, c2__$1, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3462__delegate.call(this, f, c1, c2__$1, c3, colls)
    };
    G__3462.cljs$lang$maxFixedArity = 4;
    G__3462.cljs$lang$applyTo = function(arglist__3463) {
      var f = cljs.core.first(arglist__3463);
      var c1 = cljs.core.first(cljs.core.next(arglist__3463));
      var c2__$1 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3463)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3463))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3463))));
      return G__3462__delegate(f, c1, c2__$1, c3, colls)
    };
    G__3462.cljs$lang$arity$variadic = G__3462__delegate;
    return G__3462
  }();
  map = function(f, c1, c2__$1, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2__$1);
      case 4:
        return map__4.call(this, f, c1, c2__$1, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2__$1, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s), take.call(null, n - 1, cljs.core.rest.call(null, s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step = function(n__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq.call(null, coll__$1);
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = n__$1 > 0;
        if(and__3941__auto__) {
          return s
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__3464 = n__$1 - 1;
        var G__3465 = cljs.core.rest.call(null, s);
        n__$1 = G__3464;
        coll__$1 = G__3465;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s = cljs.core.seq.call(null, coll);
  var lead = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead) {
      var G__3466 = cljs.core.next.call(null, s);
      var G__3467 = cljs.core.next.call(null, lead);
      s = G__3466;
      lead = G__3467;
      continue
    }else {
      return s
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step = function(pred__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq.call(null, coll__$1);
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = s;
        if(and__3941__auto__) {
          return pred__$1.call(null, cljs.core.first.call(null, s))
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__3468 = pred__$1;
        var G__3469 = cljs.core.rest.call(null, s);
        pred__$1 = G__3468;
        coll__$1 = G__3469;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      return cljs.core.concat.call(null, s, cycle.call(null, s))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2__$1);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          return s2
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1), cljs.core.cons.call(null, cljs.core.first.call(null, s2), interleave.call(null, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__3470__delegate = function(c1, c2__$1, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2__$1, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss)))
        }else {
          return null
        }
      }, null)
    };
    var G__3470 = function(c1, c2__$1, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3470__delegate.call(this, c1, c2__$1, colls)
    };
    G__3470.cljs$lang$maxFixedArity = 2;
    G__3470.cljs$lang$applyTo = function(arglist__3471) {
      var c1 = cljs.core.first(arglist__3471);
      var c2__$1 = cljs.core.first(cljs.core.next(arglist__3471));
      var colls = cljs.core.rest(cljs.core.next(arglist__3471));
      return G__3470__delegate(c1, c2__$1, colls)
    };
    G__3470.cljs$lang$arity$variadic = G__3470__delegate;
    return G__3470
  }();
  interleave = function(c1, c2__$1, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2__$1);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2__$1, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat = function cat(coll, colls__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4090__auto__) {
        var coll__$1 = temp__4090__auto__;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__$1), cat.call(null, cljs.core.rest.call(null, coll__$1), colls__$1))
      }else {
        if(cljs.core.seq.call(null, colls__$1)) {
          return cat.call(null, cljs.core.first.call(null, colls__$1), cljs.core.rest.call(null, colls__$1))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__3472__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__3472 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3472__delegate.call(this, f, coll, colls)
    };
    G__3472.cljs$lang$maxFixedArity = 2;
    G__3472.cljs$lang$applyTo = function(arglist__3473) {
      var f = cljs.core.first(arglist__3473);
      var coll = cljs.core.first(cljs.core.next(arglist__3473));
      var colls = cljs.core.rest(cljs.core.next(arglist__3473));
      return G__3472__delegate(f, coll, colls)
    };
    G__3472.cljs$lang$arity$variadic = G__3472__delegate;
    return G__3472
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
        var c = cljs.core.chunk_first.call(null, s);
        var size = cljs.core.count.call(null, c);
        var b = cljs.core.chunk_buffer.call(null, size);
        var n__2676__auto___3474 = size;
        var i_3475 = 0;
        while(true) {
          if(i_3475 < n__2676__auto___3474) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c, i_3475)))) {
              cljs.core.chunk_append.call(null, b, cljs.core._nth.call(null, c, i_3475))
            }else {
            }
            var G__3476 = i_3475 + 1;
            i_3475 = G__3476;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), filter.call(null, pred, cljs.core.chunk_rest.call(null, s)))
      }else {
        var f = cljs.core.first.call(null, s);
        var r = cljs.core.rest.call(null, s);
        if(cljs.core.truth_(pred.call(null, f))) {
          return cljs.core.cons.call(null, f, filter.call(null, pred, r))
        }else {
          return filter.call(null, pred, r)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__3477_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__3477_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__3479 = to;
    if(G__3479) {
      if(function() {
        var or__3943__auto__ = G__3479.cljs$lang$protocol_mask$partition1$ & 4;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__3479.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__3479.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__3479)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__3479)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2__$1) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2__$1))
  };
  var mapv__4 = function(f, c1, c2__$1, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2__$1, c3))
  };
  var mapv__5 = function() {
    var G__3480__delegate = function(f, c1, c2__$1, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2__$1, c3, colls))
    };
    var G__3480 = function(f, c1, c2__$1, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3480__delegate.call(this, f, c1, c2__$1, c3, colls)
    };
    G__3480.cljs$lang$maxFixedArity = 4;
    G__3480.cljs$lang$applyTo = function(arglist__3481) {
      var f = cljs.core.first(arglist__3481);
      var c1 = cljs.core.first(cljs.core.next(arglist__3481));
      var c2__$1 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3481)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3481))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3481))));
      return G__3480__delegate(f, c1, c2__$1, c3, colls)
    };
    G__3480.cljs$lang$arity$variadic = G__3480__delegate;
    return G__3480
  }();
  mapv = function(f, c1, c2__$1, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2__$1);
      case 4:
        return mapv__4.call(this, f, c1, c2__$1, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2__$1, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        var p = cljs.core.take.call(null, n, s);
        if(n === cljs.core.count.call(null, p)) {
          return cljs.core.cons.call(null, p, partition.call(null, n, step, cljs.core.drop.call(null, step, s)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        var p = cljs.core.take.call(null, n, s);
        if(n === cljs.core.count.call(null, p)) {
          return cljs.core.cons.call(null, p, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel = cljs.core.lookup_sentinel;
    var m__$1 = m;
    var ks__$1 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__$1) {
        var m__$2 = cljs.core._lookup.call(null, m__$1, cljs.core.first.call(null, ks__$1), sentinel);
        if(sentinel === m__$2) {
          return not_found
        }else {
          var G__3482 = sentinel;
          var G__3483 = m__$2;
          var G__3484 = cljs.core.next.call(null, ks__$1);
          sentinel = G__3482;
          m__$1 = G__3483;
          ks__$1 = G__3484;
          continue
        }
      }else {
        return m__$1
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__3485, v) {
  var vec__3487 = p__3485;
  var k = cljs.core.nth.call(null, vec__3487, 0, null);
  var ks = cljs.core.nthnext.call(null, vec__3487, 1);
  if(cljs.core.truth_(ks)) {
    return cljs.core.assoc.call(null, m, k, assoc_in.call(null, cljs.core._lookup.call(null, m, k, null), ks, v))
  }else {
    return cljs.core.assoc.call(null, m, k, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__3488, f, args) {
    var vec__3490 = p__3488;
    var k = cljs.core.nth.call(null, vec__3490, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__3490, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k, null), ks, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k, null), args))
    }
  };
  var update_in = function(m, p__3488, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__3488, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__3491) {
    var m = cljs.core.first(arglist__3491);
    var p__3488 = cljs.core.first(cljs.core.next(arglist__3491));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3491)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3491)));
    return update_in__delegate(m, p__3488, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
goog.provide("cljs.core.Vector");
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var new_array = self__.array.slice();
  new_array[k] = v;
  return new cljs.core.Vector(self__.meta, new_array, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__3493 = null;
  var G__3493__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3493__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3493 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3493__2.call(this, self__, k);
      case 3:
        return G__3493__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3493
}();
cljs.core.Vector.prototype.apply = function(self__, args3492) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3492.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var new_array = self__.array.slice();
  new_array.push(o);
  return new cljs.core.Vector(self__.meta, new_array, null)
};
cljs.core.Vector.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, self__.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, self__.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.array.length > 0) {
    var vector_seq = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < self__.array.length) {
          return cljs.core.cons.call(null, self__.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  var count = self__.array.length;
  if(count > 0) {
    return self__.array[count - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.array.length > 0) {
    var new_array = self__.array.slice();
    new_array.pop();
    return new cljs.core.Vector(self__.meta, new_array, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.Vector(meta__$1, self__.array, self__.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= n;
    if(and__3941__auto__) {
      return n < self__.array.length
    }else {
      return and__3941__auto__
    }
  }()) {
    return self__.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= n;
    if(and__3941__auto__) {
      return n < self__.array.length
    }else {
      return and__3941__auto__
    }
  }()) {
    return self__.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, self__.meta)
};
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
goog.provide("cljs.core.VectorNode");
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2457__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode.cljs$lang$ctorPrWriter = function(this__2457__auto__, writer__2458__auto__, opts__2459__auto__) {
  return cljs.core._write.call(null, writer__2458__auto__, "cljs.core/VectorNode")
};
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt = pv.cnt;
  if(cnt < 32) {
    return 0
  }else {
    return cnt - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll = level;
  var ret = node;
  while(true) {
    if(ll === 0) {
      return ret
    }else {
      var embed = ret;
      var r = cljs.core.pv_fresh_node.call(null, edit);
      var _ = cljs.core.pv_aset.call(null, r, 0, embed);
      var G__3494 = ll - 5;
      var G__3495 = r;
      ll = G__3494;
      ret = G__3495;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret = cljs.core.pv_clone_node.call(null, parent);
  var subidx = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret, subidx, tailnode);
    return ret
  }else {
    var child = cljs.core.pv_aget.call(null, parent, subidx);
    if(!(child == null)) {
      var node_to_insert = push_tail.call(null, pv, level - 5, child, tailnode);
      cljs.core.pv_aset.call(null, ret, subidx, node_to_insert);
      return ret
    }else {
      var node_to_insert = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret, subidx, node_to_insert);
      return ret
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3941__auto__ = 0 <= i;
    if(and__3941__auto__) {
      return i < pv.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node = pv.root;
      var level = pv.shift;
      while(true) {
        if(level > 0) {
          var G__3496 = cljs.core.pv_aget.call(null, node, i >>> level & 31);
          var G__3497 = level - 5;
          node = G__3496;
          level = G__3497;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret, i & 31, val);
    return ret
  }else {
    var subidx = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret, subidx, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx), i, val));
    return ret
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx));
    if(function() {
      var and__3941__auto__ = new_child == null;
      if(and__3941__auto__) {
        return subidx === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return null
    }else {
      var ret = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret, subidx, new_child);
      return ret
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret, subidx, null);
        return ret
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentVector");
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientVector(self__.cnt, self__.shift, cljs.core.tv_editable_root.call(null, self__.root), cljs.core.tv_editable_tail.call(null, self__.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= k;
    if(and__3941__auto__) {
      return k < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail = self__.tail.slice();
      new_tail[k & 31] = v;
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, self__.root, new_tail, null)
    }else {
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, cljs.core.do_assoc.call(null, coll, self__.shift, self__.root, k, v), self__.tail, null)
    }
  }else {
    if(k === self__.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(self__.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__3499 = null;
  var G__3499__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3499__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3499 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3499__2.call(this, self__, k);
      case 3:
        return G__3499__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3499
}();
cljs.core.PersistentVector.prototype.apply = function(self__, args3498) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3498.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var self__ = this;
  var step_init = [0, init];
  var i = 0;
  while(true) {
    if(i < self__.cnt) {
      var arr = cljs.core.array_for.call(null, v, i);
      var len = arr.length;
      var init__$1 = function() {
        var j = 0;
        var init__$1 = step_init[1];
        while(true) {
          if(j < len) {
            var init__$2 = f.call(null, init__$1, j + i, arr[j]);
            if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
              return init__$2
            }else {
              var G__3500 = j + 1;
              var G__3501 = init__$2;
              j = G__3500;
              init__$1 = G__3501;
              continue
            }
          }else {
            step_init[0] = len;
            step_init[1] = init__$1;
            return init__$1
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
        return cljs.core.deref.call(null, init__$1)
      }else {
        var G__3502 = i + step_init[0];
        i = G__3502;
        continue
      }
    }else {
      return step_init[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  if(self__.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail = self__.tail.slice();
    new_tail.push(o);
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, self__.shift, self__.root, new_tail, null)
  }else {
    var root_overflow_QMARK_ = self__.cnt >>> 5 > 1 << self__.shift;
    var new_shift = root_overflow_QMARK_ ? self__.shift + 5 : self__.shift;
    var new_root = root_overflow_QMARK_ ? function() {
      var n_r = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r, 0, self__.root);
      cljs.core.pv_aset.call(null, n_r, 1, cljs.core.new_path.call(null, null, self__.shift, new cljs.core.VectorNode(null, self__.tail)));
      return n_r
    }() : cljs.core.push_tail.call(null, coll, self__.shift, self__.root, new cljs.core.VectorNode(null, self__.tail));
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, new_shift, new_root, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return new cljs.core.RSeq(coll, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, self__.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === self__.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
    }else {
      if(1 < self__.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(self__.meta, self__.cnt - 1, self__.shift, self__.root, self__.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail = cljs.core.array_for.call(null, coll, self__.cnt - 2);
          var nr = cljs.core.pop_tail.call(null, coll, self__.shift, self__.root);
          var new_root = nr == null ? cljs.core.PersistentVector.EMPTY_NODE : nr;
          var cnt_1 = self__.cnt - 1;
          if(function() {
            var and__3941__auto__ = 5 < self__.shift;
            if(and__3941__auto__) {
              return cljs.core.pv_aget.call(null, new_root, 1) == null
            }else {
              return and__3941__auto__
            }
          }()) {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift - 5, cljs.core.pv_aget.call(null, new_root, 0), new_tail, null)
          }else {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift, new_root, new_tail, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentVector(meta__$1, self__.cnt, self__.shift, self__.root, self__.tail, self__.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= n;
    if(and__3941__auto__) {
      return n < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l = xs.length;
  var xs__$1 = no_clone === true ? xs : xs.slice();
  if(l < 32) {
    return new cljs.core.PersistentVector(null, l, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__$1, null)
  }else {
    var node = xs__$1.slice(0, 32);
    var v = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node, null);
    var i = 32;
    var out = cljs.core._as_transient.call(null, v);
    while(true) {
      if(i < l) {
        var G__3503 = i + 1;
        var G__3504 = cljs.core.conj_BANG_.call(null, out, xs__$1[i]);
        i = G__3503;
        out = G__3504;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__3505) {
    var args = cljs.core.seq(arglist__3505);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
goog.provide("cljs.core.ChunkedSeq");
cljs.core.ChunkedSeq = function(vec, node, i, off, meta, __hash) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31719660;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return null
    }else {
      return s
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.node[self__.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return cljs.core.List.EMPTY
    }else {
      return s
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count.call(null, self__.vec) ? cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return null
  }else {
    return s
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  return cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.array_chunk.call(null, self__.node, self__.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count.call(null, self__.vec) ? cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return cljs.core.List.EMPTY
  }else {
    return s
  }
};
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta, null)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
goog.provide("cljs.core.Subvec");
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var self__ = this;
  var v_pos = self__.start + key;
  return cljs.core.build_subvec.call(null, self__.meta, cljs.core._assoc.call(null, self__.v, v_pos, val), self__.start, self__.end > v_pos + 1 ? self__.end : v_pos + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__3507 = null;
  var G__3507__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3507__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3507 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3507__2.call(this, self__, k);
      case 3:
        return G__3507__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3507
}();
cljs.core.Subvec.prototype.apply = function(self__, args3506) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3506.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.build_subvec.call(null, self__.meta, cljs.core._assoc_n.call(null, self__.v, self__.end, o), self__.start, self__.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start__$1) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, coll, f, start__$1)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var subvec_seq = function subvec_seq(i) {
    if(i === self__.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, self__.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq.call(null, self__.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.end - self__.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.start === self__.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return cljs.core.build_subvec.call(null, self__.meta, self__.v, self__.start, self__.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return cljs.core.build_subvec.call(null, meta__$1, self__.v, self__.start, self__.end, self__.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, self__.meta)
};
cljs.core.build_subvec = function build_subvec(meta, v, start, end, __hash) {
  var c = cljs.core.count.call(null, v);
  if(function() {
    var or__3943__auto__ = start < 0;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      var or__3943__auto____$1 = end < 0;
      if(or__3943__auto____$1) {
        return or__3943__auto____$1
      }else {
        var or__3943__auto____$2 = start > c;
        if(or__3943__auto____$2) {
          return or__3943__auto____$2
        }else {
          return end > c
        }
      }
    }
  }()) {
    throw new Error("Index out of bounds");
  }else {
  }
  return new cljs.core.Subvec(meta, v, start, end, __hash)
};
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return cljs.core.build_subvec.call(null, null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret, 0, tl.length);
  return ret
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret, subidx, level === 5 ? tail_node : function() {
    var child = cljs.core.pv_aget.call(null, ret, subidx);
    if(!(child == null)) {
      return tv_push_tail.call(null, tv, level - 5, child, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__$1 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__$1, subidx));
    if(function() {
      var and__3941__auto__ = new_child == null;
      if(and__3941__auto__) {
        return subidx === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__$1, subidx, new_child);
      return node__$1
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__$1, subidx, null);
        return node__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3941__auto__ = 0 <= i;
    if(and__3941__auto__) {
      return i < tv.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root = tv.root;
      var node = root;
      var level = tv.shift;
      while(true) {
        if(level > 0) {
          var G__3508 = cljs.core.tv_ensure_editable.call(null, root.edit, cljs.core.pv_aget.call(null, node, i >>> level & 31));
          var G__3509 = level - 5;
          node = G__3508;
          level = G__3509;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
goog.provide("cljs.core.TransientVector");
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 88
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__3511 = null;
  var G__3511__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3511__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3511 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3511__2.call(this, self__, k);
      case 3:
        return G__3511__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3511
}();
cljs.core.TransientVector.prototype.apply = function(self__, args3510) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3510.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  if(self__.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= n;
    if(and__3941__auto__) {
      return n < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.root.edit) {
    return self__.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var self__ = this;
  if(self__.root.edit) {
    if(function() {
      var and__3941__auto__ = 0 <= n;
      if(and__3941__auto__) {
        return n < self__.cnt
      }else {
        return and__3941__auto__
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        self__.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root = function go(level, node) {
          var node__$1 = cljs.core.tv_ensure_editable.call(null, self__.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__$1, n & 31, val);
            return node__$1
          }else {
            var subidx = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__$1, subidx, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__$1, subidx)));
            return node__$1
          }
        }.call(null, self__.shift, self__.root);
        self__.root = new_root;
        return tcoll
      }
    }else {
      if(n === self__.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(self__.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(self__.root.edit) {
    if(self__.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === self__.cnt) {
        self__.cnt = 0;
        return tcoll
      }else {
        if((self__.cnt - 1 & 31) > 0) {
          self__.cnt = self__.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail = cljs.core.editable_array_for.call(null, tcoll, self__.cnt - 2);
            var new_root = function() {
              var nr = cljs.core.tv_pop_tail.call(null, tcoll, self__.shift, self__.root);
              if(!(nr == null)) {
                return nr
              }else {
                return new cljs.core.VectorNode(self__.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3941__auto__ = 5 < self__.shift;
              if(and__3941__auto__) {
                return cljs.core.pv_aget.call(null, new_root, 1) == null
              }else {
                return and__3941__auto__
              }
            }()) {
              var new_root__$1 = cljs.core.tv_ensure_editable.call(null, self__.root.edit, cljs.core.pv_aget.call(null, new_root, 0));
              self__.root = new_root__$1;
              self__.shift = self__.shift - 5;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll
            }else {
              self__.root = new_root;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  if(self__.root.edit) {
    if(self__.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      self__.tail[self__.cnt & 31] = o;
      self__.cnt = self__.cnt + 1;
      return tcoll
    }else {
      var tail_node = new cljs.core.VectorNode(self__.root.edit, self__.tail);
      var new_tail = cljs.core.make_array.call(null, 32);
      new_tail[0] = o;
      self__.tail = new_tail;
      if(self__.cnt >>> 5 > 1 << self__.shift) {
        var new_root_array = cljs.core.make_array.call(null, 32);
        var new_shift = self__.shift + 5;
        new_root_array[0] = self__.root;
        new_root_array[1] = cljs.core.new_path.call(null, self__.root.edit, self__.shift, tail_node);
        self__.root = new cljs.core.VectorNode(self__.root.edit, new_root_array);
        self__.shift = new_shift;
        self__.cnt = self__.cnt + 1;
        return tcoll
      }else {
        var new_root = cljs.core.tv_push_tail.call(null, tcoll, self__.shift, self__.root, tail_node);
        self__.root = new_root;
        self__.cnt = self__.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(self__.root.edit) {
    self__.root.edit = null;
    var len = self__.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail = cljs.core.make_array.call(null, len);
    cljs.core.array_copy.call(null, self__.tail, 0, trimmed_tail, 0, len);
    return new cljs.core.PersistentVector(null, self__.cnt, self__.shift, self__.root, trimmed_tail, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
goog.provide("cljs.core.PersistentQueueSeq");
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._first.call(null, self__.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var temp__4090__auto__ = cljs.core.next.call(null, self__.front);
  if(temp__4090__auto__) {
    var f1 = temp__4090__auto__;
    return new cljs.core.PersistentQueueSeq(self__.meta, f1, self__.rear, null)
  }else {
    if(self__.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(self__.meta, self__.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentQueueSeq(meta__$1, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
goog.provide("cljs.core.PersistentQueue");
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  if(cljs.core.truth_(self__.front)) {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, self__.front, cljs.core.conj.call(null, function() {
      var or__3943__auto__ = self__.rear;
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, cljs.core.conj.call(null, self__.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var rear__$1 = cljs.core.seq.call(null, self__.rear);
  if(cljs.core.truth_(function() {
    var or__3943__auto__ = self__.front;
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return rear__$1
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, self__.front, cljs.core.seq.call(null, rear__$1), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._first.call(null, self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core.truth_(self__.front)) {
    var temp__4090__auto__ = cljs.core.next.call(null, self__.front);
    if(temp__4090__auto__) {
      var f1 = temp__4090__auto__;
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, f1, self__.rear, null)
    }else {
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, cljs.core.seq.call(null, self__.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentQueue(meta__$1, self__.count, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
goog.provide("cljs.core.NeverEquiv");
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  return false
};
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len = array.length;
  var i = 0;
  while(true) {
    if(i < len) {
      if(k === array[i]) {
        return i
      }else {
        var G__3512 = i + incr;
        i = G__3512;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__$1 = cljs.core.hash.call(null, a);
  var b__$1 = cljs.core.hash.call(null, b);
  if(a__$1 < b__$1) {
    return-1
  }else {
    if(a__$1 > b__$1) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks = m.keys;
  var len = ks.length;
  var so = m.strobj;
  var out = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i = 0;
  var out__$1 = cljs.core.transient$.call(null, out);
  while(true) {
    if(i < len) {
      var k__$1 = ks[i];
      var G__3513 = i + 1;
      var G__3514 = cljs.core.assoc_BANG_.call(null, out__$1, k__$1, so[k__$1]);
      i = G__3513;
      out__$1 = G__3514;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__$1, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj = {};
  var l = ks.length;
  var i_3516 = 0;
  while(true) {
    if(i_3516 < l) {
      var k_3517 = ks[i_3516];
      new_obj[k_3517] = obj[k_3517];
      var G__3518 = i_3516 + 1;
      i_3516 = G__3518;
      continue
    }else {
    }
    break
  }
  return new_obj
};
goog.provide("cljs.core.ObjMap");
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    return self__.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3943__auto__ = self__.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return self__.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)) {
        var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
        new_strobj[k] = v;
        return new cljs.core.ObjMap(self__.meta, self__.keys, new_strobj, self__.update_count + 1, null)
      }else {
        var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
        var new_keys = self__.keys.slice();
        new_strobj[k] = v;
        new_keys.push(k);
        return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__3520 = null;
  var G__3520__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3520__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3520 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3520__2.call(this, self__, k);
      case 3:
        return G__3520__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3520
}();
cljs.core.ObjMap.prototype.apply = function(self__, args3519) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3519.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var len = self__.keys.length;
  var keys__$1 = self__.keys.sort(cljs.core.obj_map_compare_keys);
  var init__$1 = init;
  while(true) {
    if(cljs.core.seq.call(null, keys__$1)) {
      var k = cljs.core.first.call(null, keys__$1);
      var init__$2 = f.call(null, init__$1, k, self__.strobj[k]);
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__3521 = cljs.core.rest.call(null, keys__$1);
        var G__3522 = init__$2;
        keys__$1 = G__3521;
        init__$1 = G__3522;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__3515_SHARP_) {
      return cljs.core.vector.call(null, p1__3515_SHARP_, self__.strobj[p1__3515_SHARP_])
    }, self__.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.ObjMap(meta__$1, self__.keys, self__.strobj, self__.update_count, self__.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, self__.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    var new_keys = self__.keys.slice();
    var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
    new_keys.splice(cljs.core.scan_array.call(null, 1, k, new_keys), 1);
    cljs.core.js_delete.call(null, new_strobj, k);
    return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
goog.provide("cljs.core.HashMap");
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var bucket = self__.hashobj[cljs.core.hash.call(null, k)];
  var i = cljs.core.truth_(bucket) ? cljs.core.scan_array.call(null, 2, k, bucket) : null;
  if(cljs.core.truth_(i)) {
    return bucket[i + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var h = cljs.core.hash.call(null, k);
  var bucket = self__.hashobj[h];
  if(cljs.core.truth_(bucket)) {
    var new_bucket = bucket.slice();
    var new_hashobj = goog.object.clone(self__.hashobj);
    new_hashobj[h] = new_bucket;
    var temp__4090__auto__ = cljs.core.scan_array.call(null, 2, k, new_bucket);
    if(cljs.core.truth_(temp__4090__auto__)) {
      var i = temp__4090__auto__;
      new_bucket[i + 1] = v;
      return new cljs.core.HashMap(self__.meta, self__.count, new_hashobj, null)
    }else {
      new_bucket.push(k, v);
      return new cljs.core.HashMap(self__.meta, self__.count + 1, new_hashobj, null)
    }
  }else {
    var new_hashobj = goog.object.clone(self__.hashobj);
    new_hashobj[h] = [k, v];
    return new cljs.core.HashMap(self__.meta, self__.count + 1, new_hashobj, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  var bucket = self__.hashobj[cljs.core.hash.call(null, k)];
  var i = cljs.core.truth_(bucket) ? cljs.core.scan_array.call(null, 2, k, bucket) : null;
  if(cljs.core.truth_(i)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__3525 = null;
  var G__3525__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3525__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3525 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3525__2.call(this, self__, k);
      case 3:
        return G__3525__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3525
}();
cljs.core.HashMap.prototype.apply = function(self__, args3524) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3524.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count > 0) {
    var hashes = cljs.core.js_keys.call(null, self__.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__3523_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, self__.hashobj[p1__3523_SHARP_]))
    }, hashes)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.HashMap(meta__$1, self__.count, self__.hashobj, self__.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, self__.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var h = cljs.core.hash.call(null, k);
  var bucket = self__.hashobj[h];
  var i = cljs.core.truth_(bucket) ? cljs.core.scan_array.call(null, 2, k, bucket) : null;
  if(cljs.core.not.call(null, i)) {
    return coll
  }else {
    var new_hashobj = goog.object.clone(self__.hashobj);
    if(3 > bucket.length) {
      cljs.core.js_delete.call(null, new_hashobj, h)
    }else {
      var new_bucket_3526 = bucket.slice();
      new_bucket_3526.splice(i, 2);
      new_hashobj[h] = new_bucket_3526
    }
    return new cljs.core.HashMap(self__.meta, self__.count - 1, new_hashobj, null)
  }
};
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len = ks.length;
  var i = 0;
  var out = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i < len) {
      var G__3527 = i + 1;
      var G__3528 = cljs.core.assoc.call(null, out, ks[i], vs[i]);
      i = G__3527;
      out = G__3528;
      continue
    }else {
      return out
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr = m.arr;
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr[i], k)) {
        return i
      }else {
        if("\ufdd0'else") {
          var G__3529 = i + 2;
          i = G__3529;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
goog.provide("cljs.core.PersistentArrayMap");
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientArrayMap({}, self__.arr.length, self__.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx === -1) {
    return not_found
  }else {
    return self__.arr[idx + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx === -1) {
    if(self__.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt + 1, function() {
        var G__3531 = self__.arr.slice();
        G__3531.push(k);
        G__3531.push(v);
        return G__3531
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === self__.arr[idx + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt, function() {
          var G__3532 = self__.arr.slice();
          G__3532[idx + 1] = v;
          return G__3532
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__3533 = null;
  var G__3533__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3533__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3533 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3533__2.call(this, self__, k);
      case 3:
        return G__3533__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3533
}();
cljs.core.PersistentArrayMap.prototype.apply = function(self__, args3530) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3530.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = f.call(null, init__$1, self__.arr[i], self__.arr[i + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__3534 = i + 2;
        var G__3535 = init__$2;
        i = G__3534;
        init__$1 = G__3535;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    var len = self__.arr.length;
    var array_map_seq = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([self__.arr[i], self__.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentArrayMap(meta__$1, self__.cnt, self__.arr, self__.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, self__.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx >= 0) {
    var len = self__.arr.length;
    var new_len = len - 2;
    if(new_len === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr = cljs.core.make_array.call(null, new_len);
      var s = 0;
      var d = 0;
      while(true) {
        if(s >= len) {
          return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt - 1, new_arr, null)
        }else {
          if(cljs.core._EQ_.call(null, k, self__.arr[s])) {
            var G__3536 = s + 2;
            var G__3537 = d;
            s = G__3536;
            d = G__3537;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr[d] = self__.arr[s];
              new_arr[d + 1] = self__.arr[s + 1];
              var G__3538 = s + 2;
              var G__3539 = d + 2;
              s = G__3538;
              d = G__3539;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len = cljs.core.count.call(null, ks);
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i < len) {
      var G__3540 = i + 1;
      var G__3541 = cljs.core.assoc_BANG_.call(null, out, ks[i], vs[i]);
      i = G__3540;
      out = G__3541;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out)
    }
    break
  }
};
goog.provide("cljs.core.TransientArrayMap");
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx >= 0) {
      self__.arr[idx] = self__.arr[self__.len - 2];
      self__.arr[idx + 1] = self__.arr[self__.len - 1];
      var G__3542_3544 = self__.arr;
      G__3542_3544.pop();
      G__3542_3544.pop();
      self__.len = self__.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx === -1) {
      if(self__.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        self__.len = self__.len + 2;
        self__.arr.push(key);
        self__.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, self__.len, self__.arr), key, val)
      }
    }else {
      if(val === self__.arr[idx + 1]) {
        return tcoll
      }else {
        self__.arr[idx + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    if(function() {
      var G__3543 = o;
      if(G__3543) {
        if(function() {
          var or__3943__auto__ = G__3543.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__3543.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__3543.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__3543)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__3543)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq.call(null, o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__4090__auto__ = cljs.core.first.call(null, es);
        if(cljs.core.truth_(temp__4090__auto__)) {
          var e = temp__4090__auto__;
          var G__3545 = cljs.core.next.call(null, es);
          var G__3546 = tcoll__$1.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__$1, cljs.core.key.call(null, e), cljs.core.val.call(null, e));
          es = G__3545;
          tcoll__$1 = G__3546;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    self__.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, self__.len, 2), self__.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx === -1) {
      return not_found
    }else {
      return self__.arr[idx + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    return cljs.core.quot.call(null, self__.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i = 0;
  while(true) {
    if(i < len) {
      var G__3547 = cljs.core.assoc_BANG_.call(null, out, arr[i], arr[i + 1]);
      var G__3548 = i + 2;
      out = G__3547;
      i = G__3548;
      continue
    }else {
      return out
    }
    break
  }
};
goog.provide("cljs.core.Box");
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2457__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box.cljs$lang$ctorPrWriter = function(this__2457__auto__, writer__2458__auto__, opts__2459__auto__) {
  return cljs.core._write.call(null, writer__2458__auto__, "cljs.core/Box")
};
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__3551 = arr.slice();
    G__3551[i] = a;
    return G__3551
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__3552 = arr.slice();
    G__3552[i] = a;
    G__3552[j] = b;
    return G__3552
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr, 2 * i, new_arr.length - 2 * i);
  return new_arr
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    return editable
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    editable.arr[j] = b;
    return editable
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len = arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = function() {
        var k = arr[i];
        if(!(k == null)) {
          return f.call(null, init__$1, k, arr[i + 1])
        }else {
          var node = arr[i + 1];
          if(!(node == null)) {
            return node.kv_reduce(f, init__$1)
          }else {
            return init__$1
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__3553 = i + 2;
        var G__3554 = init__$2;
        i = G__3553;
        init__$1 = G__3554;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
goog.provide("cljs.core.BitmapIndexedNode");
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var self__ = this;
  var inode = this;
  if(self__.bitmap === bit) {
    return null
  }else {
    var editable = inode.ensure_editable(e);
    var earr = editable.arr;
    var len = earr.length;
    editable.bitmap = bit ^ editable.bitmap;
    cljs.core.array_copy.call(null, earr, 2 * (i + 1), earr, 2 * i, len - 2 * (i + 1));
    earr[len - 2] = null;
    earr[len - 1] = null;
    return editable
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    if(2 * n < self__.arr.length) {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr, 2 * idx, earr, 2 * (idx + 1), 2 * (n - idx));
      earr[2 * idx] = key;
      earr[2 * idx + 1] = val;
      editable.bitmap = editable.bitmap | bit;
      return editable
    }else {
      if(n >= 16) {
        var nodes = cljs.core.make_array.call(null, 32);
        var jdx = hash >>> shift & 31;
        nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i_3555 = 0;
        var j_3556 = 0;
        while(true) {
          if(i_3555 < 32) {
            if((self__.bitmap >>> i_3555 & 1) === 0) {
              var G__3557 = i_3555 + 1;
              var G__3558 = j_3556;
              i_3555 = G__3557;
              j_3556 = G__3558;
              continue
            }else {
              nodes[i_3555] = !(self__.arr[j_3556] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, cljs.core.hash.call(null, self__.arr[j_3556]), self__.arr[j_3556], self__.arr[j_3556 + 1], added_leaf_QMARK_) : self__.arr[j_3556 + 1];
              var G__3559 = i_3555 + 1;
              var G__3560 = j_3556 + 2;
              i_3555 = G__3559;
              j_3556 = G__3560;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit__$1, n + 1, nodes)
      }else {
        if("\ufdd0'else") {
          var new_arr = cljs.core.make_array.call(null, 2 * (n + 4));
          cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * idx);
          new_arr[2 * idx] = key;
          new_arr[2 * idx + 1] = val;
          cljs.core.array_copy.call(null, self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
          added_leaf_QMARK_.val = true;
          var editable = inode.ensure_editable(edit__$1);
          editable.arr = new_arr;
          editable.bitmap = editable.bitmap | bit;
          return editable
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, n)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.call(null, edit__$1, shift + 5, key_or_nil, val_or_node, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, n)
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode.edit_and_remove_pair(edit__$1, bit, idx)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        removed_leaf_QMARK_[0] = true;
        return inode.edit_and_remove_pair(edit__$1, bit, idx)
      }else {
        if("\ufdd0'else") {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    var new_arr = cljs.core.make_array.call(null, n < 0 ? 4 : 2 * (n + 1));
    cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * n);
    return new cljs.core.BitmapIndexedNode(e, self__.bitmap, new_arr)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce.call(null, self__.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil, val_or_node], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without(shift + 5, hash, key);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, n))
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair.call(null, self__.arr, idx))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair.call(null, self__.arr, idx))
      }else {
        if("\ufdd0'else") {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    if(n >= 16) {
      var nodes = cljs.core.make_array.call(null, 32);
      var jdx = hash >>> shift & 31;
      nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i_3561 = 0;
      var j_3562 = 0;
      while(true) {
        if(i_3561 < 32) {
          if((self__.bitmap >>> i_3561 & 1) === 0) {
            var G__3563 = i_3561 + 1;
            var G__3564 = j_3562;
            i_3561 = G__3563;
            j_3562 = G__3564;
            continue
          }else {
            nodes[i_3561] = !(self__.arr[j_3562] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, self__.arr[j_3562]), self__.arr[j_3562], self__.arr[j_3562 + 1], added_leaf_QMARK_) : self__.arr[j_3562 + 1];
            var G__3565 = i_3561 + 1;
            var G__3566 = j_3562 + 2;
            i_3561 = G__3565;
            j_3562 = G__3566;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n + 1, nodes)
    }else {
      var new_arr = cljs.core.make_array.call(null, 2 * (n + 1));
      cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * idx);
      new_arr[2 * idx] = key;
      new_arr[2 * idx + 1] = val;
      cljs.core.array_copy.call(null, self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, self__.bitmap | bit, new_arr)
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, n))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil, val_or_node, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return val_or_node
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr = array_node.arr;
  var len = 2 * (array_node.cnt - 1);
  var new_arr = cljs.core.make_array.call(null, len);
  var i = 0;
  var j = 1;
  var bitmap = 0;
  while(true) {
    if(i < len) {
      if(function() {
        var and__3941__auto__ = !(i === idx);
        if(and__3941__auto__) {
          return!(arr[i] == null)
        }else {
          return and__3941__auto__
        }
      }()) {
        new_arr[j] = arr[i];
        var G__3567 = i + 1;
        var G__3568 = j + 2;
        var G__3569 = bitmap | 1 << i;
        i = G__3567;
        j = G__3568;
        bitmap = G__3569;
        continue
      }else {
        var G__3570 = i + 1;
        var G__3571 = j;
        var G__3572 = bitmap;
        i = G__3570;
        j = G__3571;
        bitmap = G__3572;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap, new_arr)
    }
    break
  }
};
goog.provide("cljs.core.ArrayNode");
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable.cnt = editable.cnt + 1;
    return editable
  }else {
    var n = node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_array_node_seq.call(null, self__.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return inode
  }else {
    var n = node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode, edit__$1, idx)
        }else {
          var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n);
          editable.cnt = editable.cnt - 1;
          return editable
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    return new cljs.core.ArrayNode(e, self__.cnt, self__.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var node = self__.arr[i];
      if(!(node == null)) {
        var init__$2 = node.kv_reduce(f, init__$1);
        if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
          return cljs.core.deref.call(null, init__$2)
        }else {
          var G__3573 = i + 1;
          var G__3574 = init__$2;
          i = G__3573;
          init__$1 = G__3574;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    var n = node.inode_without(shift + 5, hash, key);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode, null, idx)
        }else {
          return new cljs.core.ArrayNode(null, self__.cnt - 1, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
        }else {
          return null
        }
      }
    }
  }else {
    return inode
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return new cljs.core.ArrayNode(null, self__.cnt + 1, cljs.core.clone_and_set.call(null, self__.arr, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n = node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim = 2 * cnt;
  var i = 0;
  while(true) {
    if(i < lim) {
      if(cljs.core.key_test.call(null, key, arr[i])) {
        return i
      }else {
        var G__3575 = i + 2;
        i = G__3575;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
goog.provide("cljs.core.HashCollisionNode");
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
    if(idx === -1) {
      if(self__.arr.length > 2 * self__.cnt) {
        var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * self__.cnt, key, 2 * self__.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable.cnt = editable.cnt + 1;
        return editable
      }else {
        var len = self__.arr.length;
        var new_arr = cljs.core.make_array.call(null, len + 2);
        cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, len);
        new_arr[len] = key;
        new_arr[len + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode.ensure_editable_array(edit__$1, self__.cnt + 1, new_arr)
      }
    }else {
      if(self__.arr[idx + 1] === val) {
        return inode
      }else {
        return cljs.core.edit_and_set.call(null, inode, edit__$1, idx + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit__$1, 1 << (self__.collision_hash >>> shift & 31), [null, inode, null, null])).inode_assoc_BANG_(edit__$1, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    removed_leaf_QMARK_[0] = true;
    if(self__.cnt === 1) {
      return null
    }else {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      earr[idx] = earr[2 * self__.cnt - 2];
      earr[idx + 1] = earr[2 * self__.cnt - 1];
      earr[2 * self__.cnt - 1] = null;
      earr[2 * self__.cnt - 2] = null;
      editable.cnt = editable.cnt - 1;
      return editable
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var new_arr = cljs.core.make_array.call(null, 2 * (self__.cnt + 1));
    cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * self__.cnt);
    return new cljs.core.HashCollisionNode(e, self__.collision_hash, self__.cnt, new_arr)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce.call(null, self__.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, self__.arr[idx])) {
      return cljs.core.PersistentVector.fromArray([self__.arr[idx], self__.arr[idx + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    if(self__.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt - 1, cljs.core.remove_pair.call(null, self__.arr, cljs.core.quot.call(null, idx, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
    if(idx === -1) {
      var len = self__.arr.length;
      var new_arr = cljs.core.make_array.call(null, len + 2);
      cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, len);
      new_arr[len] = key;
      new_arr[len + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt + 1, new_arr)
    }else {
      if(cljs.core._EQ_.call(null, self__.arr[idx], val)) {
        return inode
      }else {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (self__.collision_hash >>> shift & 31), [null, inode])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, self__.arr[idx])) {
      return self__.arr[idx + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    self__.arr = array;
    self__.cnt = count;
    return inode
  }else {
    return new cljs.core.HashCollisionNode(self__.edit, self__.collision_hash, count, array)
  }
};
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.call(null, key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.call(null, key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
goog.provide("cljs.core.NodeSeq");
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  if(self__.s == null) {
    return cljs.core.PersistentVector.fromArray([self__.nodes[self__.i], self__.nodes[self__.i + 1]], true)
  }else {
    return cljs.core.first.call(null, self__.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.s == null) {
    return cljs.core.create_inode_seq.call(null, self__.nodes, self__.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, self__.nodes, self__.i, cljs.core.next.call(null, self__.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.NodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          if(!(nodes[j] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j, null, null)
          }else {
            var temp__4090__auto__ = nodes[j + 1];
            if(cljs.core.truth_(temp__4090__auto__)) {
              var node = temp__4090__auto__;
              var temp__4090__auto____$1 = node.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____$1)) {
                var node_seq = temp__4090__auto____$1;
                return new cljs.core.NodeSeq(null, nodes, j + 2, node_seq, null)
              }else {
                var G__3576 = j + 2;
                j = G__3576;
                continue
              }
            }else {
              var G__3577 = j + 2;
              j = G__3577;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
goog.provide("cljs.core.ArrayNodeSeq");
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.create_array_node_seq.call(null, null, self__.nodes, self__.i, cljs.core.next.call(null, self__.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.ArrayNodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          var temp__4090__auto__ = nodes[j];
          if(cljs.core.truth_(temp__4090__auto__)) {
            var nj = temp__4090__auto__;
            var temp__4090__auto____$1 = nj.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____$1)) {
              var ns = temp__4090__auto____$1;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j + 1, ns, null)
            }else {
              var G__3578 = j + 1;
              j = G__3578;
              continue
            }
          }else {
            var G__3579 = j + 1;
            j = G__3579;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
goog.provide("cljs.core.PersistentHashMap");
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientHashMap({}, self__.root, self__.cnt, self__.has_nil_QMARK_, self__.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(k == null) {
    if(function() {
      var and__3941__auto__ = self__.has_nil_QMARK_;
      if(and__3941__auto__) {
        return v === self__.nil_val
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, self__.has_nil_QMARK_ ? self__.cnt : self__.cnt + 1, self__.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK_ = new cljs.core.Box(false);
    var new_root = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK_);
    if(new_root === self__.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, added_leaf_QMARK_.val ? self__.cnt + 1 : self__.cnt, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  if(k == null) {
    return self__.has_nil_QMARK_
  }else {
    if(self__.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__3581 = null;
  var G__3581__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3581__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3581 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3581__2.call(this, self__, k);
      case 3:
        return G__3581__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3581
}();
cljs.core.PersistentHashMap.prototype.apply = function(self__, args3580) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3580.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var init__$1 = self__.has_nil_QMARK_ ? f.call(null, init, null, self__.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
    return cljs.core.deref.call(null, init__$1)
  }else {
    if(!(self__.root == null)) {
      return self__.root.kv_reduce(f, init__$1)
    }else {
      if("\ufdd0'else") {
        return init__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    var s = !(self__.root == null) ? self__.root.inode_seq() : null;
    if(self__.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, self__.nil_val], true), s)
    }else {
      return s
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentHashMap(meta__$1, self__.cnt, self__.root, self__.has_nil_QMARK_, self__.nil_val, self__.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, self__.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, self__.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(self__.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root = self__.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root === self__.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len = ks.length;
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i < len) {
      var G__3582 = i + 1;
      var G__3583 = cljs.core.assoc_BANG_.call(null, out, ks[i], vs[i]);
      i = G__3582;
      out = G__3583;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out)
    }
    break
  }
};
goog.provide("cljs.core.TransientHashMap");
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var self__ = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return null
    }
  }else {
    if(self__.root == null) {
      return null
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.edit) {
    return self__.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(function() {
      var G__3584 = o;
      if(G__3584) {
        if(function() {
          var or__3943__auto__ = G__3584.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__3584.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__3584.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__3584)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__3584)
      }
    }()) {
      return tcoll.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq.call(null, o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__4090__auto__ = cljs.core.first.call(null, es);
        if(cljs.core.truth_(temp__4090__auto__)) {
          var e = temp__4090__auto__;
          var G__3585 = cljs.core.next.call(null, es);
          var G__3586 = tcoll__$1.assoc_BANG_(cljs.core.key.call(null, e), cljs.core.val.call(null, e));
          es = G__3585;
          tcoll__$1 = G__3586;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.nil_val === v) {
      }else {
        self__.nil_val = v
      }
      if(self__.has_nil_QMARK_) {
      }else {
        self__.count = self__.count + 1;
        self__.has_nil_QMARK_ = true
      }
      return tcoll
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      var node = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc_BANG_(self__.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK_);
      if(node === self__.root) {
      }else {
        self__.root = node
      }
      if(added_leaf_QMARK_.val) {
        self__.count = self__.count + 1
      }else {
      }
      return tcoll
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.has_nil_QMARK_) {
        self__.has_nil_QMARK_ = false;
        self__.nil_val = null;
        self__.count = self__.count - 1;
        return tcoll
      }else {
        return tcoll
      }
    }else {
      if(self__.root == null) {
        return tcoll
      }else {
        var removed_leaf_QMARK_ = new cljs.core.Box(false);
        var node = self__.root.inode_without_BANG_(self__.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK_);
        if(node === self__.root) {
        }else {
          self__.root = node
        }
        if(cljs.core.truth_(removed_leaf_QMARK_[0])) {
          self__.count = self__.count - 1
        }else {
        }
        return tcoll
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    self__.edit = null;
    return new cljs.core.PersistentHashMap(null, self__.count, self__.root, self__.has_nil_QMARK_, self__.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t = node;
  var stack__$1 = stack;
  while(true) {
    if(!(t == null)) {
      var G__3587 = ascending_QMARK_ ? t.left : t.right;
      var G__3588 = cljs.core.conj.call(null, stack__$1, t);
      t = G__3587;
      stack__$1 = G__3588;
      continue
    }else {
      return stack__$1
    }
    break
  }
};
goog.provide("cljs.core.PersistentTreeMapSeq");
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return self__.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var self__ = this;
  return cljs.core.peek.call(null, self__.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var self__ = this;
  var t = cljs.core.first.call(null, self__.stack);
  var next_stack = cljs.core.tree_map_seq_push.call(null, self__.ascending_QMARK_ ? t.right : t.left, cljs.core.next.call(null, self__.stack), self__.ascending_QMARK_);
  if(!(next_stack == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack, self__.ascending_QMARK_, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeMapSeq(meta__$1, self__.stack, self__.ascending_QMARK_, self__.cnt, self__.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3941__auto__ = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3941__auto__) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3941__auto__
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3941__auto__ = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3941__auto__) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3941__auto__
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__$1 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
    return cljs.core.deref.call(null, init__$1)
  }else {
    var init__$2 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__$1) : init__$1;
    if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
      return cljs.core.deref.call(null, init__$2)
    }else {
      var init__$3 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__$2) : init__$2;
      if(cljs.core.reduced_QMARK_.call(null, init__$3)) {
        return cljs.core.deref.call(null, init__$3)
      }else {
        return init__$3
      }
    }
  }
};
goog.provide("cljs.core.BlackNode");
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__3590 = null;
  var G__3590__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(node, k)
  };
  var G__3590__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(node, k, not_found)
  };
  G__3590 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3590__2.call(this, self__, k);
      case 3:
        return G__3590__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3590
}();
cljs.core.BlackNode.prototype.apply = function(self__, args3589) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3589.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  return self__.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_right(node)
};
cljs.core.BlackNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_right_del.call(null, self__.key, self__.val, self__.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce.call(null, node, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_left_del.call(null, self__.key, self__.val, del, self__.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_left(node)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__3591 = null;
  var G__3591__0 = function() {
    var self__ = this;
    var this$ = this;
    return cljs.core.pr_str.call(null, this$)
  };
  G__3591 = function() {
    switch(arguments.length) {
      case 0:
        return G__3591__0.call(this)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3591
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return node
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.EMPTY
};
goog.provide("cljs.core.RedNode");
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__3593 = null;
  var G__3593__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(node, k)
  };
  var G__3593__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(node, k, not_found)
  };
  G__3593 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3593__2.call(this, self__, k);
      case 3:
        return G__3593__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3593
}();
cljs.core.RedNode.prototype.apply = function(self__, args3592) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3592.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  return self__.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce.call(null, node, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, del, self__.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, ins, self__.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, self__.left)) {
    return new cljs.core.RedNode(self__.key, self__.val, self__.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, self__.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, self__.right)) {
      return new cljs.core.RedNode(self__.right.key, self__.right.val, new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, self__.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__3594 = null;
  var G__3594__0 = function() {
    var self__ = this;
    var this$ = this;
    return cljs.core.pr_str.call(null, this$)
  };
  G__3594 = function() {
    switch(arguments.length) {
      case 0:
        return G__3594__0.call(this)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3594
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, self__.right)) {
    return new cljs.core.RedNode(self__.key, self__.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left, null), self__.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, self__.left)) {
      return new cljs.core.RedNode(self__.left.key, self__.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left.left, null), new cljs.core.BlackNode(self__.key, self__.val, self__.left.right, self__.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c = comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return null
    }else {
      if(c < 0) {
        var ins = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins == null)) {
          return tree.add_left(ins)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins == null)) {
            return tree.add_right(ins)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app)) {
            return new cljs.core.RedNode(app.key, app.val, new cljs.core.RedNode(left.key, left.val, left.left, app.left, null), new cljs.core.RedNode(right.key, right.val, app.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app)) {
              return new cljs.core.RedNode(app.key, app.val, new cljs.core.BlackNode(left.key, left.val, left.left, app.left, null), new cljs.core.BlackNode(right.key, right.val, app.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c = comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c < 0) {
        var del = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3943__auto__ = !(del == null);
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3943__auto__ = !(del == null);
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk = tree.key;
  var c = comp.call(null, k, tk);
  if(c === 0) {
    return tree.replace(tk, v, tree.left, tree.right)
  }else {
    if(c < 0) {
      return tree.replace(tk, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentTreeMap");
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var n = coll.entry_at(k);
  if(!(n == null)) {
    return n.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var found = [null];
  var t = cljs.core.tree_map_add.call(null, self__.comp, self__.tree, k, v, found);
  if(t == null) {
    var found_node = cljs.core.nth.call(null, found, 0);
    if(cljs.core._EQ_.call(null, v, found_node.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, cljs.core.tree_map_replace.call(null, self__.comp, self__.tree, k, v), self__.cnt, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt + 1, self__.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__3596 = null;
  var G__3596__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3596__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3596 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3596__2.call(this, self__, k);
      case 3:
        return G__3596__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3596
}();
cljs.core.PersistentTreeMap.prototype.apply = function(self__, args3595) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3595.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  if(!(self__.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, self__.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, false, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var self__ = this;
  var coll = this;
  var t = self__.tree;
  while(true) {
    if(!(t == null)) {
      var c = self__.comp.call(null, k, t.key);
      if(c === 0) {
        return t
      }else {
        if(c < 0) {
          var G__3597 = t.left;
          t = G__3597;
          continue
        }else {
          if("\ufdd0'else") {
            var G__3598 = t.right;
            t = G__3598;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, ascending_QMARK_, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  if(self__.cnt > 0) {
    var stack = null;
    var t = self__.tree;
    while(true) {
      if(!(t == null)) {
        var c = self__.comp.call(null, k, t.key);
        if(c === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack, t), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c < 0) {
              var G__3599 = cljs.core.conj.call(null, stack, t);
              var G__3600 = t.left;
              stack = G__3599;
              t = G__3600;
              continue
            }else {
              var G__3601 = stack;
              var G__3602 = t.right;
              stack = G__3601;
              t = G__3602;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c > 0) {
                var G__3603 = cljs.core.conj.call(null, stack, t);
                var G__3604 = t.right;
                stack = G__3603;
                t = G__3604;
                continue
              }else {
                var G__3605 = stack;
                var G__3606 = t.left;
                stack = G__3605;
                t = G__3606;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack == null) {
          return null
        }else {
          return new cljs.core.PersistentTreeMapSeq(null, stack, ascending_QMARK_, -1, null)
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  return self__.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, true, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeMap(self__.comp, self__.tree, self__.cnt, meta__$1, self__.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, self__.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var found = [null];
  var t = cljs.core.tree_map_remove.call(null, self__.comp, self__.tree, k, found);
  if(t == null) {
    if(cljs.core.nth.call(null, found, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, null, 0, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt - 1, self__.meta, null)
  }
};
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in$) {
        var G__3607 = cljs.core.nnext.call(null, in$);
        var G__3608 = cljs.core.assoc_BANG_.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__3607;
        out = G__3608;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__3609) {
    var keyvals = cljs.core.seq(arglist__3609);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__3610) {
    var keyvals = cljs.core.seq(arglist__3610);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks = [];
    var obj = {};
    var kvs = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs) {
        ks.push(cljs.core.first.call(null, kvs));
        obj[cljs.core.first.call(null, kvs)] = cljs.core.second.call(null, kvs);
        var G__3611 = cljs.core.nnext.call(null, kvs);
        kvs = G__3611;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks, obj)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__3612) {
    var keyvals = cljs.core.seq(arglist__3612);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in$) {
        var G__3613 = cljs.core.nnext.call(null, in$);
        var G__3614 = cljs.core.assoc.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__3613;
        out = G__3614;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__3615) {
    var keyvals = cljs.core.seq(arglist__3615);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = new cljs.core.PersistentTreeMap(cljs.core.fn__GT_comparator.call(null, comparator), null, 0, null, 0);
    while(true) {
      if(in$) {
        var G__3616 = cljs.core.nnext.call(null, in$);
        var G__3617 = cljs.core.assoc.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__3616;
        out = G__3617;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__3618) {
    var comparator = cljs.core.first(arglist__3618);
    var keyvals = cljs.core.rest(arglist__3618);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__3619_SHARP_, p2__3620_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3943__auto__ = p1__3619_SHARP_;
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__3620_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__3621) {
    var maps = cljs.core.seq(arglist__3621);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry = function(m, e) {
        var k = cljs.core.first.call(null, e);
        var v = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k)) {
          return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core._lookup.call(null, m, k, null), v))
        }else {
          return cljs.core.assoc.call(null, m, k, v)
        }
      };
      var merge2 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry, function() {
          var or__3943__auto__ = m1;
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__3622) {
    var f = cljs.core.first(arglist__3622);
    var maps = cljs.core.rest(arglist__3622);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret = cljs.core.ObjMap.EMPTY;
  var keys = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys) {
      var key = cljs.core.first.call(null, keys);
      var entry = cljs.core._lookup.call(null, map, key, "\ufdd0'cljs.core/not-found");
      var G__3623 = cljs.core.not_EQ_.call(null, entry, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret, key, entry) : ret;
      var G__3624 = cljs.core.next.call(null, keys);
      ret = G__3623;
      keys = G__3624;
      continue
    }else {
      return ret
    }
    break
  }
};
goog.provide("cljs.core.PersistentHashSet");
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, self__.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_iset.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, self__.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__3627 = null;
  var G__3627__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3627__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3627 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3627__2.call(this, self__, k);
      case 3:
        return G__3627__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3627
}();
cljs.core.PersistentHashSet.prototype.apply = function(self__, args3626) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3626.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core.assoc.call(null, self__.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.keys.call(null, self__.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core.dissoc.call(null, self__.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var and__3941__auto__ = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto__) {
    var and__3941__auto____$1 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____$1) {
      return cljs.core.every_QMARK_.call(null, function(p1__3625_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__3625_SHARP_)
      }, other)
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(meta__$1, self__.hash_map, self__.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, self__.meta)
};
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len = cljs.core.count.call(null, items);
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i < len) {
      var G__3628 = i + 1;
      var G__3629 = cljs.core.conj_BANG_.call(null, out, items[i]);
      i = G__3628;
      out = G__3629;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out)
    }
    break
  }
};
goog.provide("cljs.core.TransientHashSet");
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 136
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__3632 = null;
  var G__3632__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__3632__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__3632 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3632__2.call(this, self__, k);
      case 3:
        return G__3632__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3632
}();
cljs.core.TransientHashSet.prototype.apply = function(self__, args3631) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3631.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var self__ = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var self__ = this;
  if(cljs.core._lookup.call(null, self__.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  return cljs.core.count.call(null, self__.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var self__ = this;
  self__.transient_map = cljs.core.dissoc_BANG_.call(null, self__.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  self__.transient_map = cljs.core.assoc_BANG_.call(null, self__.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, self__.transient_map), null)
};
goog.provide("cljs.core.PersistentTreeSet");
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_iset.call(null, coll);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  var n = self__.tree_map.entry_at(v);
  if(!(n == null)) {
    return n.key
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__3634 = null;
  var G__3634__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3634__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3634 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3634__2.call(this, self__, k);
      case 3:
        return G__3634__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3634
}();
cljs.core.PersistentTreeSet.prototype.apply = function(self__, args3633) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3633.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.assoc.call(null, self__.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, self__.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, self__.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, self__.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._comparator.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.keys.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.dissoc.call(null, self__.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.count.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var and__3941__auto__ = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto__) {
    var and__3941__auto____$1 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____$1) {
      return cljs.core.every_QMARK_.call(null, function(p1__3630_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__3630_SHARP_)
      }, other)
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(meta__$1, self__.tree_map, self__.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, self__.meta)
};
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__3635__delegate = function(keys) {
      var in$ = cljs.core.seq.call(null, keys);
      var out = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in$)) {
          var G__3636 = cljs.core.next.call(null, in$);
          var G__3637 = cljs.core.conj_BANG_.call(null, out, cljs.core.first.call(null, in$));
          in$ = G__3636;
          out = G__3637;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out)
        }
        break
      }
    };
    var G__3635 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3635__delegate.call(this, keys)
    };
    G__3635.cljs$lang$maxFixedArity = 0;
    G__3635.cljs$lang$applyTo = function(arglist__3638) {
      var keys = cljs.core.seq(arglist__3638);
      return G__3635__delegate(keys)
    };
    G__3635.cljs$lang$arity$variadic = G__3635__delegate;
    return G__3635
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__3639) {
    var keys = cljs.core.seq(arglist__3639);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__3641) {
    var comparator = cljs.core.first(arglist__3641);
    var keys = cljs.core.rest(arglist__3641);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__4090__auto__ = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__4090__auto__)) {
        var e = temp__4090__auto__;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__3640_SHARP_) {
      var temp__4090__auto__ = cljs.core.find.call(null, smap, p1__3640_SHARP_);
      if(cljs.core.truth_(temp__4090__auto__)) {
        var e = temp__4090__auto__;
        return cljs.core.second.call(null, e)
      }else {
        return p1__3640_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__3648, seen__$1) {
        while(true) {
          var vec__3649 = p__3648;
          var f = cljs.core.nth.call(null, vec__3649, 0, null);
          var xs__$1 = vec__3649;
          var temp__4092__auto__ = cljs.core.seq.call(null, xs__$1);
          if(temp__4092__auto__) {
            var s = temp__4092__auto__;
            if(cljs.core.contains_QMARK_.call(null, seen__$1, f)) {
              var G__3650 = cljs.core.rest.call(null, s);
              var G__3651 = seen__$1;
              p__3648 = G__3650;
              seen__$1 = G__3651;
              continue
            }else {
              return cljs.core.cons.call(null, f, step.call(null, cljs.core.rest.call(null, s), cljs.core.conj.call(null, seen__$1, f)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret = cljs.core.PersistentVector.EMPTY;
  var s__$1 = s;
  while(true) {
    if(cljs.core.next.call(null, s__$1)) {
      var G__3652 = cljs.core.conj.call(null, ret, cljs.core.first.call(null, s__$1));
      var G__3653 = cljs.core.next.call(null, s__$1);
      ret = G__3652;
      s__$1 = G__3653;
      continue
    }else {
      return cljs.core.seq.call(null, ret)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3943__auto__ = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i = x.lastIndexOf("/", x.length - 2);
      if(i < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3943__auto__ = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i = x.lastIndexOf("/", x.length - 2);
    if(i > -1) {
      return cljs.core.subs.call(null, x, 2, i)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map = cljs.core.ObjMap.EMPTY;
  var ks = cljs.core.seq.call(null, keys);
  var vs = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3941__auto__ = ks;
      if(and__3941__auto__) {
        return vs
      }else {
        return and__3941__auto__
      }
    }()) {
      var G__3656 = cljs.core.assoc.call(null, map, cljs.core.first.call(null, ks), cljs.core.first.call(null, vs));
      var G__3657 = cljs.core.next.call(null, ks);
      var G__3658 = cljs.core.next.call(null, vs);
      map = G__3656;
      ks = G__3657;
      vs = G__3658;
      continue
    }else {
      return map
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__3661__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__3654_SHARP_, p2__3655_SHARP_) {
        return max_key.call(null, k, p1__3654_SHARP_, p2__3655_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__3661 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3661__delegate.call(this, k, x, y, more)
    };
    G__3661.cljs$lang$maxFixedArity = 3;
    G__3661.cljs$lang$applyTo = function(arglist__3662) {
      var k = cljs.core.first(arglist__3662);
      var x = cljs.core.first(cljs.core.next(arglist__3662));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3662)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3662)));
      return G__3661__delegate(k, x, y, more)
    };
    G__3661.cljs$lang$arity$variadic = G__3661__delegate;
    return G__3661
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__3663__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__3659_SHARP_, p2__3660_SHARP_) {
        return min_key.call(null, k, p1__3659_SHARP_, p2__3660_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__3663 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3663__delegate.call(this, k, x, y, more)
    };
    G__3663.cljs$lang$maxFixedArity = 3;
    G__3663.cljs$lang$applyTo = function(arglist__3664) {
      var k = cljs.core.first(arglist__3664);
      var x = cljs.core.first(cljs.core.next(arglist__3664));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3664)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3664)));
      return G__3663__delegate(k, x, y, more)
    };
    G__3663.cljs$lang$arity$variadic = G__3663__delegate;
    return G__3663
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s), take_while.call(null, pred, cljs.core.rest.call(null, s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp = cljs.core._comparator.call(null, sc);
    return test.call(null, comp.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var vec__3667 = temp__4092__auto__;
        var e = cljs.core.nth.call(null, vec__3667, 0, null);
        var s = vec__3667;
        if(cljs.core.truth_(include.call(null, e))) {
          return s
        }else {
          return cljs.core.next.call(null, s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var vec__3668 = temp__4092__auto__;
      var e = cljs.core.nth.call(null, vec__3668, 0, null);
      var s = vec__3668;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e)) ? s : cljs.core.next.call(null, s))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var vec__3671 = temp__4092__auto__;
        var e = cljs.core.nth.call(null, vec__3671, 0, null);
        var s = vec__3671;
        if(cljs.core.truth_(include.call(null, e))) {
          return s
        }else {
          return cljs.core.next.call(null, s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var vec__3672 = temp__4092__auto__;
      var e = cljs.core.nth.call(null, vec__3672, 0, null);
      var s = vec__3672;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e)) ? s : cljs.core.next.call(null, s))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
goog.provide("cljs.core.Range");
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_coll.call(null, rng);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var self__ = this;
  if(self__.step > 0) {
    if(self__.start + self__.step < self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }else {
    if(self__.start + self__.step > self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var self__ = this;
  if(self__.step > 0) {
    if(self__.start < self__.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(self__.start > self__.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var self__ = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((self__.end - self__.start) / self__.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var self__ = this;
  return self__.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var self__ = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta__$1) {
  var self__ = this;
  return new cljs.core.Range(meta__$1, self__.start, self__.end, self__.step, self__.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var self__ = this;
  return self__.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var self__ = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return self__.start + n * self__.step
  }else {
    if(function() {
      var and__3941__auto__ = self__.start > self__.end;
      if(and__3941__auto__) {
        return self__.step === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return self__.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var self__ = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return self__.start + n * self__.step
  }else {
    if(function() {
      var and__3941__auto__ = self__.start > self__.end;
      if(and__3941__auto__) {
        return self__.step === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return self__.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s), take_nth.call(null, n, cljs.core.drop.call(null, n, s)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      var fst = cljs.core.first.call(null, s);
      var fv = f.call(null, fst);
      var run = cljs.core.cons.call(null, fst, cljs.core.take_while.call(null, function(p1__3673_SHARP_) {
        return cljs.core._EQ_.call(null, fv, f.call(null, p1__3673_SHARP_))
      }, cljs.core.next.call(null, s)));
      return cljs.core.cons.call(null, run, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run), s))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4090__auto__) {
        var s = temp__4090__auto__;
        return reductions.call(null, f, cljs.core.first.call(null, s), cljs.core.rest.call(null, s))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s)), cljs.core.rest.call(null, s))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__3684 = null;
      var G__3684__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__3684__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__3684__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__3684__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__3684__4 = function() {
        var G__3685__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__3685 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3685__delegate.call(this, x, y, z, args)
        };
        G__3685.cljs$lang$maxFixedArity = 3;
        G__3685.cljs$lang$applyTo = function(arglist__3686) {
          var x = cljs.core.first(arglist__3686);
          var y = cljs.core.first(cljs.core.next(arglist__3686));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3686)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3686)));
          return G__3685__delegate(x, y, z, args)
        };
        G__3685.cljs$lang$arity$variadic = G__3685__delegate;
        return G__3685
      }();
      G__3684 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3684__0.call(this);
          case 1:
            return G__3684__1.call(this, x);
          case 2:
            return G__3684__2.call(this, x, y);
          case 3:
            return G__3684__3.call(this, x, y, z);
          default:
            return G__3684__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3684.cljs$lang$maxFixedArity = 3;
      G__3684.cljs$lang$applyTo = G__3684__4.cljs$lang$applyTo;
      return G__3684
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__3687 = null;
      var G__3687__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__3687__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__3687__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__3687__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__3687__4 = function() {
        var G__3688__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__3688 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3688__delegate.call(this, x, y, z, args)
        };
        G__3688.cljs$lang$maxFixedArity = 3;
        G__3688.cljs$lang$applyTo = function(arglist__3689) {
          var x = cljs.core.first(arglist__3689);
          var y = cljs.core.first(cljs.core.next(arglist__3689));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3689)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3689)));
          return G__3688__delegate(x, y, z, args)
        };
        G__3688.cljs$lang$arity$variadic = G__3688__delegate;
        return G__3688
      }();
      G__3687 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3687__0.call(this);
          case 1:
            return G__3687__1.call(this, x);
          case 2:
            return G__3687__2.call(this, x, y);
          case 3:
            return G__3687__3.call(this, x, y, z);
          default:
            return G__3687__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3687.cljs$lang$maxFixedArity = 3;
      G__3687.cljs$lang$applyTo = G__3687__4.cljs$lang$applyTo;
      return G__3687
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__3690 = null;
      var G__3690__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__3690__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__3690__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__3690__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__3690__4 = function() {
        var G__3691__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__3691 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3691__delegate.call(this, x, y, z, args)
        };
        G__3691.cljs$lang$maxFixedArity = 3;
        G__3691.cljs$lang$applyTo = function(arglist__3692) {
          var x = cljs.core.first(arglist__3692);
          var y = cljs.core.first(cljs.core.next(arglist__3692));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3692)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3692)));
          return G__3691__delegate(x, y, z, args)
        };
        G__3691.cljs$lang$arity$variadic = G__3691__delegate;
        return G__3691
      }();
      G__3690 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3690__0.call(this);
          case 1:
            return G__3690__1.call(this, x);
          case 2:
            return G__3690__2.call(this, x, y);
          case 3:
            return G__3690__3.call(this, x, y, z);
          default:
            return G__3690__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3690.cljs$lang$maxFixedArity = 3;
      G__3690.cljs$lang$applyTo = G__3690__4.cljs$lang$applyTo;
      return G__3690
    }()
  };
  var juxt__4 = function() {
    var G__3693__delegate = function(f, g, h, fs) {
      var fs__$1 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__3694 = null;
        var G__3694__0 = function() {
          return cljs.core.reduce.call(null, function(p1__3674_SHARP_, p2__3675_SHARP_) {
            return cljs.core.conj.call(null, p1__3674_SHARP_, p2__3675_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__3694__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__3676_SHARP_, p2__3677_SHARP_) {
            return cljs.core.conj.call(null, p1__3676_SHARP_, p2__3677_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__3694__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__3678_SHARP_, p2__3679_SHARP_) {
            return cljs.core.conj.call(null, p1__3678_SHARP_, p2__3679_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__3694__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__3680_SHARP_, p2__3681_SHARP_) {
            return cljs.core.conj.call(null, p1__3680_SHARP_, p2__3681_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__3694__4 = function() {
          var G__3695__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__3682_SHARP_, p2__3683_SHARP_) {
              return cljs.core.conj.call(null, p1__3682_SHARP_, cljs.core.apply.call(null, p2__3683_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__$1)
          };
          var G__3695 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3695__delegate.call(this, x, y, z, args)
          };
          G__3695.cljs$lang$maxFixedArity = 3;
          G__3695.cljs$lang$applyTo = function(arglist__3696) {
            var x = cljs.core.first(arglist__3696);
            var y = cljs.core.first(cljs.core.next(arglist__3696));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3696)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3696)));
            return G__3695__delegate(x, y, z, args)
          };
          G__3695.cljs$lang$arity$variadic = G__3695__delegate;
          return G__3695
        }();
        G__3694 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__3694__0.call(this);
            case 1:
              return G__3694__1.call(this, x);
            case 2:
              return G__3694__2.call(this, x, y);
            case 3:
              return G__3694__3.call(this, x, y, z);
            default:
              return G__3694__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        G__3694.cljs$lang$maxFixedArity = 3;
        G__3694.cljs$lang$applyTo = G__3694__4.cljs$lang$applyTo;
        return G__3694
      }()
    };
    var G__3693 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3693__delegate.call(this, f, g, h, fs)
    };
    G__3693.cljs$lang$maxFixedArity = 3;
    G__3693.cljs$lang$applyTo = function(arglist__3697) {
      var f = cljs.core.first(arglist__3697);
      var g = cljs.core.first(cljs.core.next(arglist__3697));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3697)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3697)));
      return G__3693__delegate(f, g, h, fs)
    };
    G__3693.cljs$lang$arity$variadic = G__3693__delegate;
    return G__3693
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__3698 = cljs.core.next.call(null, coll);
        coll = G__3698;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = cljs.core.seq.call(null, coll);
        if(and__3941__auto__) {
          return n > 0
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__3699 = n - 1;
        var G__3700 = cljs.core.next.call(null, coll);
        n = G__3699;
        coll = G__3700;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches), s)) {
    if(cljs.core.count.call(null, matches) === 1) {
      return cljs.core.first.call(null, matches)
    }else {
      return cljs.core.vec.call(null, matches)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches = re.exec(s);
  if(matches == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches) === 1) {
      return cljs.core.first.call(null, matches)
    }else {
      return cljs.core.vec.call(null, matches)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data = cljs.core.re_find.call(null, re, s);
  var match_idx = s.search(re);
  var match_str = cljs.core.coll_QMARK_.call(null, match_data) ? cljs.core.first.call(null, match_data) : match_data;
  var post_match = cljs.core.subs.call(null, s, match_idx + cljs.core.count.call(null, match_str));
  if(cljs.core.truth_(match_data)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data, re_seq.call(null, re, post_match))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__3703 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var _ = cljs.core.nth.call(null, vec__3703, 0, null);
  var flags = cljs.core.nth.call(null, vec__3703, 1, null);
  var pattern = cljs.core.nth.call(null, vec__3703, 2, null);
  return new RegExp(pattern, flags)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__3701_SHARP_) {
    return print_one.call(null, p1__3701_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.pr_sequential_writer = function pr_sequential_writer(writer, print_one, begin, sep, end, opts, coll) {
  cljs.core._write.call(null, writer, begin);
  if(cljs.core.seq.call(null, coll)) {
    print_one.call(null, cljs.core.first.call(null, coll), writer, opts)
  }else {
  }
  var G__3705_3706 = cljs.core.seq.call(null, cljs.core.next.call(null, coll));
  while(true) {
    if(G__3705_3706) {
      var o_3707 = cljs.core.first.call(null, G__3705_3706);
      cljs.core._write.call(null, writer, sep);
      print_one.call(null, o_3707, writer, opts);
      var G__3708 = cljs.core.next.call(null, G__3705_3706);
      G__3705_3706 = G__3708;
      continue
    }else {
    }
    break
  }
  return cljs.core._write.call(null, writer, end)
};
cljs.core.write_all = function() {
  var write_all__delegate = function(writer, ss) {
    var G__3710 = cljs.core.seq.call(null, ss);
    while(true) {
      if(G__3710) {
        var s = cljs.core.first.call(null, G__3710);
        cljs.core._write.call(null, writer, s);
        var G__3711 = cljs.core.next.call(null, G__3710);
        G__3710 = G__3711;
        continue
      }else {
        return null
      }
      break
    }
  };
  var write_all = function(writer, var_args) {
    var ss = null;
    if(goog.isDef(var_args)) {
      ss = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return write_all__delegate.call(this, writer, ss)
  };
  write_all.cljs$lang$maxFixedArity = 1;
  write_all.cljs$lang$applyTo = function(arglist__3712) {
    var writer = cljs.core.first(arglist__3712);
    var ss = cljs.core.rest(arglist__3712);
    return write_all__delegate(writer, ss)
  };
  write_all.cljs$lang$arity$variadic = write_all__delegate;
  return write_all
}();
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
goog.provide("cljs.core.StringBufferWriter");
cljs.core.StringBufferWriter = function(sb) {
  this.sb = sb;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073741824
};
cljs.core.StringBufferWriter.cljs$lang$type = true;
cljs.core.StringBufferWriter.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/StringBufferWriter")
};
cljs.core.StringBufferWriter.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/StringBufferWriter")
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_write$arity$2 = function(_, s) {
  var self__ = this;
  return self__.sb.append(s)
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_flush$arity$1 = function(_) {
  var self__ = this;
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3941__auto__ = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = function() {
              var G__3715 = obj;
              if(G__3715) {
                if(function() {
                  var or__3943__auto__ = G__3715.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto__) {
                    return or__3943__auto__
                  }else {
                    return G__3715.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__3715.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__3715)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__3715)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3941__auto__ = !(obj == null);
          if(and__3941__auto__) {
            return obj.cljs$lang$type
          }else {
            return and__3941__auto__
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__3716 = obj;
          if(G__3716) {
            if(function() {
              var or__3943__auto__ = G__3716.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3943__auto__) {
                return or__3943__auto__
              }else {
                return G__3716.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__3716.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__3716)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__3716)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_writer = function pr_writer(obj, writer, opts) {
  if(obj == null) {
    return cljs.core._write.call(null, writer, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core._write.call(null, writer, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = function() {
              var G__3720 = obj;
              if(G__3720) {
                if(function() {
                  var or__3943__auto__ = G__3720.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto__) {
                    return or__3943__auto__
                  }else {
                    return G__3720.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__3720.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__3720)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__3720)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())) {
          cljs.core._write.call(null, writer, "^");
          pr_writer.call(null, cljs.core.meta.call(null, obj), writer, opts);
          cljs.core._write.call(null, writer, " ")
        }else {
        }
        if(function() {
          var and__3941__auto__ = !(obj == null);
          if(and__3941__auto__) {
            return obj.cljs$lang$type
          }else {
            return and__3941__auto__
          }
        }()) {
          return obj.cljs$lang$ctorPrWriter(obj, writer, opts)
        }else {
          if(function() {
            var G__3721 = obj;
            if(G__3721) {
              if(function() {
                var or__3943__auto__ = G__3721.cljs$lang$protocol_mask$partition0$ & 2147483648;
                if(or__3943__auto__) {
                  return or__3943__auto__
                }else {
                  return G__3721.cljs$core$IPrintWithWriter$
                }
              }()) {
                return true
              }else {
                if(!G__3721.cljs$lang$protocol_mask$partition0$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IPrintWithWriter, G__3721)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IPrintWithWriter, G__3721)
            }
          }()) {
            return cljs.core._pr_writer.call(null, obj, writer, opts)
          }else {
            if(function() {
              var G__3722 = obj;
              if(G__3722) {
                if(function() {
                  var or__3943__auto__ = G__3722.cljs$lang$protocol_mask$partition0$ & 536870912;
                  if(or__3943__auto__) {
                    return or__3943__auto__
                  }else {
                    return G__3722.cljs$core$IPrintable$
                  }
                }()) {
                  return true
                }else {
                  if(!G__3722.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__3722)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__3722)
              }
            }()) {
              return cljs.core.apply.call(null, cljs.core.write_all, writer, cljs.core._pr_seq.call(null, obj, opts))
            }else {
              if(cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj))) {
                return cljs.core.write_all.call(null, writer, '#"', obj.source, '"')
              }else {
                if("\ufdd0'else") {
                  return cljs.core.write_all.call(null, writer, "#<", [cljs.core.str(obj)].join(""), ">")
                }else {
                  return null
                }
              }
            }
          }
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_seq_writer = function pr_seq_writer(objs, writer, opts) {
  cljs.core.pr_writer.call(null, cljs.core.first.call(null, objs), writer, opts);
  var G__3724 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  while(true) {
    if(G__3724) {
      var obj = cljs.core.first.call(null, G__3724);
      cljs.core._write.call(null, writer, " ");
      cljs.core.pr_writer.call(null, obj, writer, opts);
      var G__3725 = cljs.core.next.call(null, G__3724);
      G__3724 = G__3725;
      continue
    }else {
      return null
    }
    break
  }
};
cljs.core.pr_sb_with_opts = function pr_sb_with_opts(objs, opts) {
  var sb = new goog.string.StringBuffer;
  var writer = new cljs.core.StringBufferWriter(sb);
  cljs.core.pr_seq_writer.call(null, objs, writer, opts);
  cljs.core._flush.call(null, writer);
  return sb
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return""
  }else {
    return[cljs.core.str(cljs.core.pr_sb_with_opts.call(null, objs, opts))].join("")
  }
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return"\n"
  }else {
    var sb = cljs.core.pr_sb_with_opts.call(null, objs, opts);
    sb.append("\n");
    return[cljs.core.str(sb)].join("")
  }
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  return cljs.core.string_print.call(null, cljs.core.pr_str_with_opts.call(null, objs, opts))
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__3726) {
    var objs = cljs.core.seq(arglist__3726);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__3727) {
    var objs = cljs.core.seq(arglist__3727);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__3728) {
    var objs = cljs.core.seq(arglist__3728);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__3729) {
    var objs = cljs.core.seq(arglist__3729);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__3730) {
    var objs = cljs.core.seq(arglist__3730);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__3731) {
    var objs = cljs.core.seq(arglist__3731);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__3732) {
    var objs = cljs.core.seq(arglist__3732);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__3733) {
    var objs = cljs.core.seq(arglist__3733);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__3734) {
    var fmt = cljs.core.first(arglist__3734);
    var args = cljs.core.rest(arglist__3734);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.char_escapes = cljs.core.ObjMap.fromObject(['"', "\\", "\b", "\f", "\n", "\r", "\t"], {'"':'\\"', "\\":"\\\\", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t"});
cljs.core.quote_string = function quote_string(s) {
  return[cljs.core.str('"'), cljs.core.str(s.replace(RegExp('[\\\\"\b\f\n\r\t]', "g"), function(match) {
    return cljs.core._lookup.call(null, cljs.core.char_escapes, match, null)
  })), cljs.core.str('"')].join("")
};
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__4092__auto__ = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var nspc = temp__4092__auto__;
        return[cljs.core.str(nspc), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__4092__auto__ = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__4092__auto__)) {
          var nspc = temp__4092__auto__;
          return[cljs.core.str(nspc), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? cljs.core.quote_string.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize = function(n, len) {
    var ns = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns) < len) {
        var G__3735 = [cljs.core.str("0"), cljs.core.str(ns)].join("");
        ns = G__3735;
        continue
      }else {
        return ns
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize.call(null, d.getUTCSeconds(), 2)), cljs.core.str("."), 
  cljs.core.str(normalize.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.HashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintWithWriter["number"] = true;
cljs.core._pr_writer["number"] = function(n, writer, opts) {
  1 / 0;
  return cljs.core._write.call(null, writer, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintWithWriter["boolean"] = true;
cljs.core._pr_writer["boolean"] = function(bool, writer, opts) {
  return cljs.core._write.call(null, writer, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintWithWriter["string"] = true;
cljs.core._pr_writer["string"] = function(obj, writer, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    cljs.core._write.call(null, writer, ":");
    var temp__4092__auto___3736 = cljs.core.namespace.call(null, obj);
    if(cljs.core.truth_(temp__4092__auto___3736)) {
      var nspc_3737 = temp__4092__auto___3736;
      cljs.core.write_all.call(null, writer, [cljs.core.str(nspc_3737)].join(""), "/")
    }else {
    }
    return cljs.core._write.call(null, writer, cljs.core.name.call(null, obj))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      var temp__4092__auto___3738 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__4092__auto___3738)) {
        var nspc_3739 = temp__4092__auto___3738;
        cljs.core.write_all.call(null, writer, [cljs.core.str(nspc_3739)].join(""), "/")
      }else {
      }
      return cljs.core._write.call(null, writer, cljs.core.name.call(null, obj))
    }else {
      if("\ufdd0'else") {
        if(cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts))) {
          return cljs.core._write.call(null, writer, cljs.core.quote_string.call(null, obj))
        }else {
          return cljs.core._write.call(null, writer, obj)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.List.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.IPrintWithWriter["array"] = true;
cljs.core._pr_writer["array"] = function(a, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintWithWriter["function"] = true;
cljs.core._pr_writer["function"] = function(this$, writer, _) {
  return cljs.core.write_all.call(null, writer, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core._write.call(null, writer, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintWithWriter$ = true;
Date.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(d, writer, _) {
  var normalize = function(n, len) {
    var ns = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns) < len) {
        var G__3740 = [cljs.core.str("0"), cljs.core.str(ns)].join("");
        ns = G__3740;
        continue
      }else {
        return ns
      }
      break
    }
  };
  return cljs.core.write_all.call(null, writer, '#inst "', [cljs.core.str(d.getUTCFullYear())].join(""), "-", normalize.call(null, d.getUTCMonth() + 1, 2), "-", normalize.call(null, d.getUTCDate(), 2), "T", normalize.call(null, d.getUTCHours(), 2), ":", normalize.call(null, d.getUTCMinutes(), 2), ":", normalize.call(null, d.getUTCSeconds(), 2), ".", normalize.call(null, d.getUTCMilliseconds(), 3), "-", '00:00"')
};
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
goog.provide("cljs.core.Atom");
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856;
  this.cljs$lang$protocol_mask$partition1$ = 2
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var self__ = this;
  var G__3741 = cljs.core.seq.call(null, self__.watches);
  while(true) {
    if(G__3741) {
      var vec__3742 = cljs.core.first.call(null, G__3741);
      var key = cljs.core.nth.call(null, vec__3742, 0, null);
      var f = cljs.core.nth.call(null, vec__3742, 1, null);
      f.call(null, key, this$, oldval, newval);
      var G__3743 = cljs.core.next.call(null, G__3741);
      G__3741 = G__3743;
      continue
    }else {
      return null
    }
    break
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var self__ = this;
  return this$.watches = cljs.core.assoc.call(null, self__.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var self__ = this;
  return this$.watches = cljs.core.dissoc.call(null, self__.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(a, writer, opts) {
  var self__ = this;
  cljs.core._write.call(null, writer, "#<Atom: ");
  cljs.core._pr_writer.call(null, self__.state, writer, opts);
  return cljs.core._write.call(null, writer, ">")
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var self__ = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, self__.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var self__ = this;
  return self__.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  return self__.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  return o === other
};
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__3747__delegate = function(x, p__3744) {
      var map__3746 = p__3744;
      var map__3746__$1 = cljs.core.seq_QMARK_.call(null, map__3746) ? cljs.core.apply.call(null, cljs.core.hash_map, map__3746) : map__3746;
      var validator = cljs.core._lookup.call(null, map__3746__$1, "\ufdd0'validator", null);
      var meta = cljs.core._lookup.call(null, map__3746__$1, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta, validator, null)
    };
    var G__3747 = function(x, var_args) {
      var p__3744 = null;
      if(goog.isDef(var_args)) {
        p__3744 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3747__delegate.call(this, x, p__3744)
    };
    G__3747.cljs$lang$maxFixedArity = 1;
    G__3747.cljs$lang$applyTo = function(arglist__3748) {
      var x = cljs.core.first(arglist__3748);
      var p__3744 = cljs.core.rest(arglist__3748);
      return G__3747__delegate(x, p__3744)
    };
    G__3747.cljs$lang$arity$variadic = G__3747__delegate;
    return G__3747
  }();
  atom = function(x, var_args) {
    var p__3744 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__4092__auto___3749 = a.validator;
  if(cljs.core.truth_(temp__4092__auto___3749)) {
    var validate_3750 = temp__4092__auto___3749;
    if(cljs.core.truth_(validate_3750.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6751, "\ufdd0'column", 13))))].join(""));
    }
  }else {
  }
  var old_value_3751 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value_3751, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__3752__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__3752 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__3752__delegate.call(this, a, f, x, y, z, more)
    };
    G__3752.cljs$lang$maxFixedArity = 5;
    G__3752.cljs$lang$applyTo = function(arglist__3753) {
      var a = cljs.core.first(arglist__3753);
      var f = cljs.core.first(cljs.core.next(arglist__3753));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3753)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3753))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3753)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3753)))));
      return G__3752__delegate(a, f, x, y, z, more)
    };
    G__3752.cljs$lang$arity$variadic = G__3752__delegate;
    return G__3752
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__3754) {
    var iref = cljs.core.first(arglist__3754);
    var f = cljs.core.first(cljs.core.next(arglist__3754));
    var args = cljs.core.rest(cljs.core.next(arglist__3754));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
goog.provide("cljs.core.Delay");
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var self__ = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, self__.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, self__.state, function(p__3755) {
    var map__3756 = p__3755;
    var map__3756__$1 = cljs.core.seq_QMARK_.call(null, map__3756) ? cljs.core.apply.call(null, cljs.core.hash_map, map__3756) : map__3756;
    var curr_state = map__3756__$1;
    var done = cljs.core._lookup.call(null, map__3756__$1, "\ufdd0'done", null);
    if(cljs.core.truth_(done)) {
      return curr_state
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":self__.f.call(null)})
    }
  }))
};
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.IEncodeJS = {};
cljs.core._clj__GT_js = function _clj__GT_js(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1(x)
  }else {
    var x__2514__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._clj__GT_js[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._clj__GT_js["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-clj->js", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._key__GT_js = function _key__GT_js(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeJS$_key__GT_js$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_key__GT_js$arity$1(x)
  }else {
    var x__2514__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._key__GT_js[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._key__GT_js["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-key->js", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core.IEncodeJS["null"] = true;
cljs.core._clj__GT_js["null"] = function(x) {
  return null
};
cljs.core.IEncodeJS["_"] = true;
cljs.core._key__GT_js["_"] = function(k) {
  if(function() {
    var or__3943__auto__ = cljs.core.string_QMARK_.call(null, k);
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      var or__3943__auto____$1 = cljs.core.number_QMARK_.call(null, k);
      if(or__3943__auto____$1) {
        return or__3943__auto____$1
      }else {
        var or__3943__auto____$2 = cljs.core.keyword_QMARK_.call(null, k);
        if(or__3943__auto____$2) {
          return or__3943__auto____$2
        }else {
          return cljs.core.symbol_QMARK_.call(null, k)
        }
      }
    }
  }()) {
    return cljs.core._clj__GT_js.call(null, k)
  }else {
    return cljs.core.pr_str.call(null, k)
  }
};
cljs.core._clj__GT_js["_"] = function(x) {
  if(cljs.core.keyword_QMARK_.call(null, x)) {
    return cljs.core.name.call(null, x)
  }else {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return[cljs.core.str(x)].join("")
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        var m = {};
        var G__3757_3759 = cljs.core.seq.call(null, x);
        while(true) {
          if(G__3757_3759) {
            var vec__3758_3760 = cljs.core.first.call(null, G__3757_3759);
            var k_3761 = cljs.core.nth.call(null, vec__3758_3760, 0, null);
            var v_3762 = cljs.core.nth.call(null, vec__3758_3760, 1, null);
            m[cljs.core._key__GT_js.call(null, k_3761)] = cljs.core._clj__GT_js.call(null, v_3762);
            var G__3763 = cljs.core.next.call(null, G__3757_3759);
            G__3757_3759 = G__3763;
            continue
          }else {
          }
          break
        }
        return m
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, cljs.core._clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.clj__GT_js = function clj__GT_js(x) {
  return cljs.core._clj__GT_js.call(null, x)
};
cljs.core.IEncodeClojure = {};
cljs.core._js__GT_clj = function() {
  var _js__GT_clj = null;
  var _js__GT_clj__1 = function(x) {
    if(function() {
      var and__3941__auto__ = x;
      if(and__3941__auto__) {
        return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$1
      }else {
        return and__3941__auto__
      }
    }()) {
      return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$1(x)
    }else {
      var x__2514__auto__ = x == null ? null : x;
      return function() {
        var or__3943__auto__ = cljs.core._js__GT_clj[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._js__GT_clj["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IEncodeClojure.-js->clj", x);
          }
        }
      }().call(null, x)
    }
  };
  var _js__GT_clj__2 = function(x, options) {
    if(function() {
      var and__3941__auto__ = x;
      if(and__3941__auto__) {
        return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2(x, options)
    }else {
      var x__2514__auto__ = x == null ? null : x;
      return function() {
        var or__3943__auto__ = cljs.core._js__GT_clj[goog.typeOf(x__2514__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._js__GT_clj["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IEncodeClojure.-js->clj", x);
          }
        }
      }().call(null, x, options)
    }
  };
  _js__GT_clj = function(x, options) {
    switch(arguments.length) {
      case 1:
        return _js__GT_clj__1.call(this, x);
      case 2:
        return _js__GT_clj__2.call(this, x, options)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _js__GT_clj.cljs$lang$arity$1 = _js__GT_clj__1;
  _js__GT_clj.cljs$lang$arity$2 = _js__GT_clj__2;
  return _js__GT_clj
}();
cljs.core.IEncodeClojure["_"] = true;
cljs.core._js__GT_clj["_"] = function() {
  var G__3769 = null;
  var G__3769__1 = function(x) {
    return cljs.core._js__GT_clj.call(null, x, cljs.core.ObjMap.fromObject(["\ufdd0'keywordize-keys"], {"\ufdd0'keywordize-keys":false}))
  };
  var G__3769__2 = function(x, options) {
    var map__3764 = options;
    var map__3764__$1 = cljs.core.seq_QMARK_.call(null, map__3764) ? cljs.core.apply.call(null, cljs.core.hash_map, map__3764) : map__3764;
    var keywordize_keys = cljs.core._lookup.call(null, map__3764__$1, "\ufdd0'keywordize-keys", null);
    var keyfn = cljs.core.truth_(keywordize_keys) ? cljs.core.keyword : cljs.core.str;
    var f = function thisfn(x__$1) {
      if(cljs.core.seq_QMARK_.call(null, x__$1)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x__$1))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x__$1)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x__$1), cljs.core.map.call(null, thisfn, x__$1))
        }else {
          if(cljs.core.truth_(goog.isArray(x__$1))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x__$1))
          }else {
            if(cljs.core.type.call(null, x__$1) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2611__auto__ = function iter__3767(s__3768) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__3768__$1 = s__3768;
                    while(true) {
                      var temp__4092__auto__ = cljs.core.seq.call(null, s__3768__$1);
                      if(temp__4092__auto__) {
                        var xs__4579__auto__ = temp__4092__auto__;
                        var k = cljs.core.first.call(null, xs__4579__auto__);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn.call(null, k), thisfn.call(null, x__$1[k])], true), iter__3767.call(null, cljs.core.rest.call(null, s__3768__$1)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2611__auto__.call(null, cljs.core.js_keys.call(null, x__$1))
              }())
            }else {
              if("\ufdd0'else") {
                return x__$1
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f.call(null, x)
  };
  G__3769 = function(x, options) {
    switch(arguments.length) {
      case 1:
        return G__3769__1.call(this, x);
      case 2:
        return G__3769__2.call(this, x, options)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3769
}();
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, opts) {
    return cljs.core._js__GT_clj.call(null, x, cljs.core.apply.call(null, cljs.core.array_map, opts))
  };
  var js__GT_clj = function(x, var_args) {
    var opts = null;
    if(goog.isDef(var_args)) {
      opts = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, opts)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__3770) {
    var x = cljs.core.first(arglist__3770);
    var opts = cljs.core.rest(arglist__3770);
    return js__GT_clj__delegate(x, opts)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__3771__delegate = function(args) {
      var temp__4090__auto__ = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem), args, null);
      if(cljs.core.truth_(temp__4090__auto__)) {
        var v = temp__4090__auto__;
        return v
      }else {
        var ret = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem, cljs.core.assoc, args, ret);
        return ret
      }
    };
    var G__3771 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3771__delegate.call(this, args)
    };
    G__3771.cljs$lang$maxFixedArity = 0;
    G__3771.cljs$lang$applyTo = function(arglist__3772) {
      var args = cljs.core.seq(arglist__3772);
      return G__3771__delegate(args)
    };
    G__3771.cljs$lang$arity$variadic = G__3771__delegate;
    return G__3771
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret)) {
        var G__3773 = ret;
        f = G__3773;
        continue
      }else {
        return ret
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__3774__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__3774 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3774__delegate.call(this, f, args)
    };
    G__3774.cljs$lang$maxFixedArity = 1;
    G__3774.cljs$lang$applyTo = function(arglist__3775) {
      var f = cljs.core.first(arglist__3775);
      var args = cljs.core.rest(arglist__3775);
      return G__3774__delegate(f, args)
    };
    G__3774.cljs$lang$arity$variadic = G__3774__delegate;
    return G__3774
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3943__auto__ = cljs.core._EQ_.call(null, child, parent);
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      var or__3943__auto____$1 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3943__auto____$1) {
        return or__3943__auto____$1
      }else {
        var and__3941__auto__ = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3941__auto__) {
          var and__3941__auto____$1 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3941__auto____$1) {
            var and__3941__auto____$2 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3941__auto____$2) {
              var ret = true;
              var i = 0;
              while(true) {
                if(function() {
                  var or__3943__auto____$2 = cljs.core.not.call(null, ret);
                  if(or__3943__auto____$2) {
                    return or__3943__auto____$2
                  }else {
                    return i === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret
                }else {
                  var G__3776 = isa_QMARK_.call(null, h, child.call(null, i), parent.call(null, i));
                  var G__3777 = i + 1;
                  ret = G__3776;
                  i = G__3777;
                  continue
                }
                break
              }
            }else {
              return and__3941__auto____$2
            }
          }else {
            return and__3941__auto____$1
          }
        }else {
          return and__3941__auto__
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 7081, "\ufdd0'column", 12))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 7085, "\ufdd0'column", 12))))].join(""));
    }
    var tp = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3943__auto__ = cljs.core.contains_QMARK_.call(null, tp.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td, parent, ta), "\ufdd0'descendants":tf.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta, tag, td)})
    }();
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents = cljs.core.truth_(parentMap.call(null, tag)) ? cljs.core.disj.call(null, parentMap.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents)) ? cljs.core.assoc.call(null, parentMap, tag, childsParents) : cljs.core.dissoc.call(null, parentMap, tag);
    var deriv_seq = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__3778_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__3778_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__3778_SHARP_), cljs.core.second.call(null, p1__3778_SHARP_)))
    }, cljs.core.seq.call(null, newParents)));
    if(cljs.core.contains_QMARK_.call(null, parentMap.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__3779_SHARP_, p2__3780_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__3779_SHARP_, p2__3780_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3943__auto__ = cljs.core.truth_(function() {
    var and__3941__auto__ = xprefs;
    if(cljs.core.truth_(and__3941__auto__)) {
      return xprefs.call(null, y)
    }else {
      return and__3941__auto__
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    var or__3943__auto____$1 = function() {
      var ps = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps), prefer_table))) {
          }else {
          }
          var G__3781 = cljs.core.rest.call(null, ps);
          ps = G__3781;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3943__auto____$1)) {
      return or__3943__auto____$1
    }else {
      var or__3943__auto____$2 = function() {
        var ps = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps), y, prefer_table))) {
            }else {
            }
            var G__3782 = cljs.core.rest.call(null, ps);
            ps = G__3782;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3943__auto____$2)) {
        return or__3943__auto____$2
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3943__auto__ = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry = cljs.core.reduce.call(null, function(be, p__3785) {
    var vec__3786 = p__3785;
    var k = cljs.core.nth.call(null, vec__3786, 0, null);
    var _ = cljs.core.nth.call(null, vec__3786, 1, null);
    var e = vec__3786;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k)) {
      var be2 = cljs.core.truth_(function() {
        var or__3943__auto__ = be == null;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return cljs.core.dominates.call(null, k, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2), k, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry));
      return cljs.core.second.call(null, best_entry)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2514__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._reset[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._reset["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2514__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._add_method[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._add_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2514__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._remove_method[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._remove_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2514__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._prefer_method[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._prefer_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2514__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._get_method[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._get_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2514__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._methods[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._methods["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2514__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._prefers[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._prefers["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2514__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._dispatch[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dispatch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn = cljs.core._get_method.call(null, mf, dispatch_val);
  if(cljs.core.truth_(target_fn)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val)].join(""));
  }
  return cljs.core.apply.call(null, target_fn, args)
};
goog.provide("cljs.core.MultiFn");
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 256
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, function(mf__$1) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.method_cache, function(mf__$1) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.prefer_table, function(mf__$1) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.cached_hierarchy, function(mf__$1) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, self__.cached_hierarchy), cljs.core.deref.call(null, self__.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
  }
  var temp__4090__auto__ = cljs.core.deref.call(null, self__.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto__)) {
    var target_fn = temp__4090__auto__;
    return target_fn
  }else {
    var temp__4090__auto____$1 = cljs.core.find_and_cache_best_method.call(null, self__.name, dispatch_val, self__.hierarchy, self__.method_table, self__.prefer_table, self__.method_cache, self__.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____$1)) {
      var target_fn = temp__4090__auto____$1;
      return target_fn
    }else {
      return cljs.core.deref.call(null, self__.method_table).call(null, self__.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var self__ = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, self__.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(self__.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, self__.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var self__ = this;
  return cljs.core.deref.call(null, self__.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var self__ = this;
  return cljs.core.deref.call(null, self__.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var self__ = this;
  return cljs.core.do_dispatch.call(null, mf, self__.dispatch_fn, args)
};
cljs.core.MultiFn.prototype.call = function() {
  var G__3787__delegate = function(_, args) {
    var self = this;
    return cljs.core._dispatch.call(null, self, args)
  };
  var G__3787 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__3787__delegate.call(this, _, args)
  };
  G__3787.cljs$lang$maxFixedArity = 1;
  G__3787.cljs$lang$applyTo = function(arglist__3788) {
    var _ = cljs.core.first(arglist__3788);
    var args = cljs.core.rest(arglist__3788);
    return G__3787__delegate(_, args)
  };
  G__3787.cljs$lang$arity$variadic = G__3787__delegate;
  return G__3787
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self = this;
  return cljs.core._dispatch.call(null, self, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("cljs.core.UUID");
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690646016
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2454__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.cljs$lang$ctorPrWriter = function(this__2454__auto__, writer__2455__auto__, opt__2456__auto__) {
  return cljs.core._write.call(null, writer__2455__auto__, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(_, writer, ___$1) {
  var self__ = this;
  return cljs.core._write.call(null, writer, [cljs.core.str('#uuid "'), cljs.core.str(self__.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_, ___$1) {
  var self__ = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(self__.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  var and__3941__auto__ = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3941__auto__) {
    return self__.uuid === other.uuid
  }else {
    return and__3941__auto__
  }
};
cljs.core.UUID.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
goog.provide("c2.maths");
goog.require("cljs.core");
c2.maths.Pi = Math.PI;
c2.maths.Tau = 2 * c2.maths.Pi;
c2.maths.e = Math.E;
c2.maths.radians_per_degree = c2.maths.Pi / 180;
c2.maths.rad = function rad(x) {
  return c2.maths.radians_per_degree * x
};
c2.maths.deg = function deg(x) {
  return x / c2.maths.radians_per_degree
};
c2.maths.sin = function sin(x) {
  return Math.sin.call(null, x)
};
c2.maths.asin = function asin(x) {
  return Math.asin.call(null, x)
};
c2.maths.cos = function cos(x) {
  return Math.cos.call(null, x)
};
c2.maths.acos = function acos(x) {
  return Math.acos.call(null, x)
};
c2.maths.tan = function tan(x) {
  return Math.tan.call(null, x)
};
c2.maths.atan = function atan(x) {
  return Math.atan.call(null, x)
};
c2.maths.expt = function() {
  var expt = null;
  var expt__1 = function(x) {
    return Math.exp.call(null, x)
  };
  var expt__2 = function(x, y) {
    return Math.pow.call(null, x, y)
  };
  expt = function(x, y) {
    switch(arguments.length) {
      case 1:
        return expt__1.call(this, x);
      case 2:
        return expt__2.call(this, x, y)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  expt.cljs$lang$arity$1 = expt__1;
  expt.cljs$lang$arity$2 = expt__2;
  return expt
}();
c2.maths.sq = function sq(x) {
  return c2.maths.expt.call(null, x, 2)
};
c2.maths.sqrt = function sqrt(x) {
  return Math.sqrt.call(null, x)
};
c2.maths.floor = function floor(x) {
  return Math.floor.call(null, x)
};
c2.maths.ceil = function ceil(x) {
  return Math.ceil.call(null, x)
};
c2.maths.abs = function abs(x) {
  return Math.abs.call(null, x)
};
c2.maths.log = function() {
  var log = null;
  var log__1 = function(x) {
    return Math.log.call(null, x)
  };
  var log__2 = function(base, x) {
    return Math.log.call(null, x) / Math.log.call(null, base)
  };
  log = function(base, x) {
    switch(arguments.length) {
      case 1:
        return log__1.call(this, base);
      case 2:
        return log__2.call(this, base, x)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  log.cljs$lang$arity$1 = log__1;
  log.cljs$lang$arity$2 = log__2;
  return log
}();
c2.maths.log10 = function log10(x) {
  return Math.log(x) / Math.LN10
};
c2.maths.extent = function extent(xs) {
  return cljs.core.PersistentVector.fromArray([cljs.core.apply.call(null, cljs.core.min, xs), cljs.core.apply.call(null, cljs.core.max, xs)], true)
};
c2.maths.mean = function mean(xs) {
  return cljs.core.reduce.call(null, cljs.core._PLUS_, xs) / cljs.core.count.call(null, xs)
};
c2.maths.median = function median(xs) {
  var sorted = cljs.core.sort.call(null, xs);
  var n = cljs.core.count.call(null, xs);
  if(cljs.core._EQ_.call(null, n, 1)) {
    return cljs.core.first.call(null, sorted)
  }else {
    if(cljs.core.odd_QMARK_.call(null, n)) {
      return cljs.core.nth.call(null, sorted, (n + 1) / 2)
    }else {
      if("\ufdd0'else") {
        var mid = n / 2;
        return c2.maths.mean.call(null, cljs.core.PersistentVector.fromArray([cljs.core.nth.call(null, sorted, c2.maths.floor.call(null, mid)), cljs.core.nth.call(null, sorted, c2.maths.ceil.call(null, mid))], true))
      }else {
        return null
      }
    }
  }
};
c2.maths.irange = function() {
  var irange = null;
  var irange__1 = function(start) {
    return cljs.core.range.call(null, start)
  };
  var irange__2 = function(start, end) {
    return cljs.core.concat.call(null, cljs.core.range.call(null, start, end), cljs.core.PersistentVector.fromArray([end], true))
  };
  var irange__3 = function(start, end, step) {
    var r = cljs.core.range.call(null, start, end, step);
    if(cljs.core.mod.call(null, cljs.core.first.call(null, r), step) === cljs.core.mod.call(null, end, step)) {
      return cljs.core.concat.call(null, r, cljs.core.PersistentVector.fromArray([end], true))
    }else {
      return r
    }
  };
  irange = function(start, end, step) {
    switch(arguments.length) {
      case 1:
        return irange__1.call(this, start);
      case 2:
        return irange__2.call(this, start, end);
      case 3:
        return irange__3.call(this, start, end, step)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  irange.cljs$lang$arity$1 = irange__1;
  irange.cljs$lang$arity$2 = irange__2;
  irange.cljs$lang$arity$3 = irange__3;
  return irange
}();
c2.maths.within_QMARK_ = function within_QMARK_(x, p__3119) {
  var vec__3121 = p__3119;
  var bottom = cljs.core.nth.call(null, vec__3121, 0, null);
  var top = cljs.core.nth.call(null, vec__3121, 1, null);
  var and__3941__auto__ = bottom <= x;
  if(and__3941__auto__) {
    return x <= top
  }else {
    return and__3941__auto__
  }
};
c2.maths.add = function() {
  var add__delegate = function(args) {
    return cljs.core.reduce.call(null, function(A, B) {
      if(function() {
        var and__3941__auto__ = cljs.core.number_QMARK_.call(null, A);
        if(and__3941__auto__) {
          return cljs.core.number_QMARK_.call(null, B)
        }else {
          return and__3941__auto__
        }
      }()) {
        return A + B
      }else {
        if(function() {
          var and__3941__auto__ = cljs.core.coll_QMARK_.call(null, A);
          if(and__3941__auto__) {
            return cljs.core.coll_QMARK_.call(null, B)
          }else {
            return and__3941__auto__
          }
        }()) {
          return cljs.core.map.call(null, cljs.core._PLUS_, A, B)
        }else {
          if(function() {
            var and__3941__auto__ = cljs.core.number_QMARK_.call(null, A);
            if(and__3941__auto__) {
              return cljs.core.coll_QMARK_.call(null, B)
            }else {
              return and__3941__auto__
            }
          }()) {
            return cljs.core.map.call(null, cljs.core._PLUS_, cljs.core.replicate.call(null, cljs.core.count.call(null, B), A), B)
          }else {
            if(function() {
              var and__3941__auto__ = cljs.core.coll_QMARK_.call(null, A);
              if(and__3941__auto__) {
                return cljs.core.number_QMARK_.call(null, B)
              }else {
                return and__3941__auto__
              }
            }()) {
              return cljs.core.map.call(null, cljs.core._PLUS_, A, cljs.core.replicate.call(null, cljs.core.count.call(null, A), B))
            }else {
              return null
            }
          }
        }
      }
    }, args)
  };
  var add = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return add__delegate.call(this, args)
  };
  add.cljs$lang$maxFixedArity = 0;
  add.cljs$lang$applyTo = function(arglist__3122) {
    var args = cljs.core.seq(arglist__3122);
    return add__delegate(args)
  };
  add.cljs$lang$arity$variadic = add__delegate;
  return add
}();
c2.maths.sub = function() {
  var sub__delegate = function(args) {
    if(cljs.core._EQ_.call(null, cljs.core.count.call(null, args), 1)) {
      if(function() {
        var and__3941__auto__ = cljs.core.number_QMARK_.call(null, 0);
        if(and__3941__auto__) {
          return cljs.core.number_QMARK_.call(null, cljs.core.first.call(null, args))
        }else {
          return and__3941__auto__
        }
      }()) {
        return 0 - cljs.core.first.call(null, args)
      }else {
        if(function() {
          var and__3941__auto__ = cljs.core.coll_QMARK_.call(null, 0);
          if(and__3941__auto__) {
            return cljs.core.coll_QMARK_.call(null, cljs.core.first.call(null, args))
          }else {
            return and__3941__auto__
          }
        }()) {
          return cljs.core.map.call(null, cljs.core._, 0, cljs.core.first.call(null, args))
        }else {
          if(function() {
            var and__3941__auto__ = cljs.core.number_QMARK_.call(null, 0);
            if(and__3941__auto__) {
              return cljs.core.coll_QMARK_.call(null, cljs.core.first.call(null, args))
            }else {
              return and__3941__auto__
            }
          }()) {
            return cljs.core.map.call(null, cljs.core._, cljs.core.replicate.call(null, cljs.core.count.call(null, cljs.core.first.call(null, args)), 0), cljs.core.first.call(null, args))
          }else {
            if(function() {
              var and__3941__auto__ = cljs.core.coll_QMARK_.call(null, 0);
              if(and__3941__auto__) {
                return cljs.core.number_QMARK_.call(null, cljs.core.first.call(null, args))
              }else {
                return and__3941__auto__
              }
            }()) {
              return cljs.core.map.call(null, cljs.core._, 0, cljs.core.replicate.call(null, cljs.core.count.call(null, 0), cljs.core.first.call(null, args)))
            }else {
              return null
            }
          }
        }
      }
    }else {
      return cljs.core.reduce.call(null, function(A, B) {
        if(function() {
          var and__3941__auto__ = cljs.core.number_QMARK_.call(null, A);
          if(and__3941__auto__) {
            return cljs.core.number_QMARK_.call(null, B)
          }else {
            return and__3941__auto__
          }
        }()) {
          return A - B
        }else {
          if(function() {
            var and__3941__auto__ = cljs.core.coll_QMARK_.call(null, A);
            if(and__3941__auto__) {
              return cljs.core.coll_QMARK_.call(null, B)
            }else {
              return and__3941__auto__
            }
          }()) {
            return cljs.core.map.call(null, cljs.core._, A, B)
          }else {
            if(function() {
              var and__3941__auto__ = cljs.core.number_QMARK_.call(null, A);
              if(and__3941__auto__) {
                return cljs.core.coll_QMARK_.call(null, B)
              }else {
                return and__3941__auto__
              }
            }()) {
              return cljs.core.map.call(null, cljs.core._, cljs.core.replicate.call(null, cljs.core.count.call(null, B), A), B)
            }else {
              if(function() {
                var and__3941__auto__ = cljs.core.coll_QMARK_.call(null, A);
                if(and__3941__auto__) {
                  return cljs.core.number_QMARK_.call(null, B)
                }else {
                  return and__3941__auto__
                }
              }()) {
                return cljs.core.map.call(null, cljs.core._, A, cljs.core.replicate.call(null, cljs.core.count.call(null, A), B))
              }else {
                return null
              }
            }
          }
        }
      }, args)
    }
  };
  var sub = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sub__delegate.call(this, args)
  };
  sub.cljs$lang$maxFixedArity = 0;
  sub.cljs$lang$applyTo = function(arglist__3123) {
    var args = cljs.core.seq(arglist__3123);
    return sub__delegate(args)
  };
  sub.cljs$lang$arity$variadic = sub__delegate;
  return sub
}();
c2.maths.mul = function() {
  var mul__delegate = function(args) {
    return cljs.core.reduce.call(null, function(A, B) {
      if(function() {
        var and__3941__auto__ = cljs.core.number_QMARK_.call(null, A);
        if(and__3941__auto__) {
          return cljs.core.number_QMARK_.call(null, B)
        }else {
          return and__3941__auto__
        }
      }()) {
        return A * B
      }else {
        if(function() {
          var and__3941__auto__ = cljs.core.coll_QMARK_.call(null, A);
          if(and__3941__auto__) {
            return cljs.core.coll_QMARK_.call(null, B)
          }else {
            return and__3941__auto__
          }
        }()) {
          return cljs.core.map.call(null, cljs.core._STAR_, A, B)
        }else {
          if(function() {
            var and__3941__auto__ = cljs.core.number_QMARK_.call(null, A);
            if(and__3941__auto__) {
              return cljs.core.coll_QMARK_.call(null, B)
            }else {
              return and__3941__auto__
            }
          }()) {
            return cljs.core.map.call(null, cljs.core._STAR_, cljs.core.replicate.call(null, cljs.core.count.call(null, B), A), B)
          }else {
            if(function() {
              var and__3941__auto__ = cljs.core.coll_QMARK_.call(null, A);
              if(and__3941__auto__) {
                return cljs.core.number_QMARK_.call(null, B)
              }else {
                return and__3941__auto__
              }
            }()) {
              return cljs.core.map.call(null, cljs.core._STAR_, A, cljs.core.replicate.call(null, cljs.core.count.call(null, A), B))
            }else {
              return null
            }
          }
        }
      }
    }, args)
  };
  var mul = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return mul__delegate.call(this, args)
  };
  mul.cljs$lang$maxFixedArity = 0;
  mul.cljs$lang$applyTo = function(arglist__3124) {
    var args = cljs.core.seq(arglist__3124);
    return mul__delegate(args)
  };
  mul.cljs$lang$arity$variadic = mul__delegate;
  return mul
}();
c2.maths.div = function() {
  var div__delegate = function(args) {
    if(cljs.core._EQ_.call(null, cljs.core.count.call(null, args), 1)) {
      if(function() {
        var and__3941__auto__ = cljs.core.number_QMARK_.call(null, 1);
        if(and__3941__auto__) {
          return cljs.core.number_QMARK_.call(null, cljs.core.first.call(null, args))
        }else {
          return and__3941__auto__
        }
      }()) {
        return 1 / cljs.core.first.call(null, args)
      }else {
        if(function() {
          var and__3941__auto__ = cljs.core.coll_QMARK_.call(null, 1);
          if(and__3941__auto__) {
            return cljs.core.coll_QMARK_.call(null, cljs.core.first.call(null, args))
          }else {
            return and__3941__auto__
          }
        }()) {
          return cljs.core.map.call(null, cljs.core._SLASH_, 1, cljs.core.first.call(null, args))
        }else {
          if(function() {
            var and__3941__auto__ = cljs.core.number_QMARK_.call(null, 1);
            if(and__3941__auto__) {
              return cljs.core.coll_QMARK_.call(null, cljs.core.first.call(null, args))
            }else {
              return and__3941__auto__
            }
          }()) {
            return cljs.core.map.call(null, cljs.core._SLASH_, cljs.core.replicate.call(null, cljs.core.count.call(null, cljs.core.first.call(null, args)), 1), cljs.core.first.call(null, args))
          }else {
            if(function() {
              var and__3941__auto__ = cljs.core.coll_QMARK_.call(null, 1);
              if(and__3941__auto__) {
                return cljs.core.number_QMARK_.call(null, cljs.core.first.call(null, args))
              }else {
                return and__3941__auto__
              }
            }()) {
              return cljs.core.map.call(null, cljs.core._SLASH_, 1, cljs.core.replicate.call(null, cljs.core.count.call(null, 1), cljs.core.first.call(null, args)))
            }else {
              return null
            }
          }
        }
      }
    }else {
      return cljs.core.reduce.call(null, function(A, B) {
        if(function() {
          var and__3941__auto__ = cljs.core.number_QMARK_.call(null, A);
          if(and__3941__auto__) {
            return cljs.core.number_QMARK_.call(null, B)
          }else {
            return and__3941__auto__
          }
        }()) {
          return A / B
        }else {
          if(function() {
            var and__3941__auto__ = cljs.core.coll_QMARK_.call(null, A);
            if(and__3941__auto__) {
              return cljs.core.coll_QMARK_.call(null, B)
            }else {
              return and__3941__auto__
            }
          }()) {
            return cljs.core.map.call(null, cljs.core._SLASH_, A, B)
          }else {
            if(function() {
              var and__3941__auto__ = cljs.core.number_QMARK_.call(null, A);
              if(and__3941__auto__) {
                return cljs.core.coll_QMARK_.call(null, B)
              }else {
                return and__3941__auto__
              }
            }()) {
              return cljs.core.map.call(null, cljs.core._SLASH_, cljs.core.replicate.call(null, cljs.core.count.call(null, B), A), B)
            }else {
              if(function() {
                var and__3941__auto__ = cljs.core.coll_QMARK_.call(null, A);
                if(and__3941__auto__) {
                  return cljs.core.number_QMARK_.call(null, B)
                }else {
                  return and__3941__auto__
                }
              }()) {
                return cljs.core.map.call(null, cljs.core._SLASH_, A, cljs.core.replicate.call(null, cljs.core.count.call(null, A), B))
              }else {
                return null
              }
            }
          }
        }
      }, args)
    }
  };
  var div = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return div__delegate.call(this, args)
  };
  div.cljs$lang$maxFixedArity = 0;
  div.cljs$lang$applyTo = function(arglist__3125) {
    var args = cljs.core.seq(arglist__3125);
    return div__delegate(args)
  };
  div.cljs$lang$arity$variadic = div__delegate;
  return div
}();
c2.maths.quantile = function() {
  var quantile__delegate = function(data, p__3126) {
    var map__3130 = p__3126;
    var map__3130__$1 = cljs.core.seq_QMARK_.call(null, map__3130) ? cljs.core.apply.call(null, cljs.core.hash_map, map__3130) : map__3130;
    var probs = cljs.core._lookup.call(null, map__3130__$1, "\ufdd0'probs", cljs.core.PersistentVector.fromArray([0, 0.25, 0.5, 0.75, 1], true));
    var xs = cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.sort.call(null, data));
    var n_1 = cljs.core.count.call(null, xs) - 1;
    var iter__2611__auto__ = function iter__3131(s__3132) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__3132__$1 = s__3132;
        while(true) {
          var temp__4092__auto__ = cljs.core.seq.call(null, s__3132__$1);
          if(temp__4092__auto__) {
            var xs__4579__auto__ = temp__4092__auto__;
            var q = cljs.core.first.call(null, xs__4579__auto__);
            return cljs.core.cons.call(null, function() {
              var index = q * n_1 + 1;
              var lo = cljs.core.int$.call(null, c2.maths.floor.call(null, index));
              var h = index - lo;
              var a = xs.call(null, lo - 1);
              if(cljs.core._EQ_.call(null, h, 0)) {
                return a
              }else {
                return a + h * (xs.call(null, lo) - a)
              }
            }(), iter__3131.call(null, cljs.core.rest.call(null, s__3132__$1)))
          }else {
            return null
          }
          break
        }
      }, null)
    };
    return iter__2611__auto__.call(null, probs)
  };
  var quantile = function(data, var_args) {
    var p__3126 = null;
    if(goog.isDef(var_args)) {
      p__3126 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return quantile__delegate.call(this, data, p__3126)
  };
  quantile.cljs$lang$maxFixedArity = 1;
  quantile.cljs$lang$applyTo = function(arglist__3133) {
    var data = cljs.core.first(arglist__3133);
    var p__3126 = cljs.core.rest(arglist__3133);
    return quantile__delegate(data, p__3126)
  };
  quantile.cljs$lang$arity$variadic = quantile__delegate;
  return quantile
}();
goog.provide("c2.scale");
goog.require("cljs.core");
goog.require("c2.maths");
goog.require("c2.maths");
goog.require("c2.maths");
c2.scale.IInvertable = {};
c2.scale.invert = function invert(scale) {
  if(function() {
    var and__3941__auto__ = scale;
    if(and__3941__auto__) {
      return scale.c2$scale$IInvertable$invert$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return scale.c2$scale$IInvertable$invert$arity$1(scale)
  }else {
    var x__2514__auto__ = scale == null ? null : scale;
    return function() {
      var or__3943__auto__ = c2.scale.invert[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = c2.scale.invert["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IInvertable.invert", scale);
        }
      }
    }().call(null, scale)
  }
};
goog.provide("c2.scale._linear");
c2.scale._linear = function(domain, range, __meta, __extmap) {
  this.domain = domain;
  this.range = range;
  this.__meta = __meta;
  this.__extmap = __extmap;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2229667595;
  if(arguments.length > 2) {
    this.__meta = __meta;
    this.__extmap = __extmap
  }else {
    this.__meta = null;
    this.__extmap = null
  }
};
c2.scale._linear.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2467__auto__) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_imap.call(null, this__2467__auto__);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
c2.scale._linear.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2472__auto__, k__2473__auto__) {
  var self__ = this;
  return this__2472__auto__.cljs$core$ILookup$_lookup$arity$3(this__2472__auto__, k__2473__auto__, null)
};
c2.scale._linear.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2474__auto__, k3096, else__2475__auto__) {
  var self__ = this;
  if(k3096 === "\ufdd0'domain") {
    return self__.domain
  }else {
    if(k3096 === "\ufdd0'range") {
      return self__.range
    }else {
      if("\ufdd0'else") {
        return cljs.core._lookup.call(null, self__.__extmap, k3096, else__2475__auto__)
      }else {
        return null
      }
    }
  }
};
c2.scale._linear.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2479__auto__, k__2480__auto__, G__3095) {
  var self__ = this;
  var pred__3099 = cljs.core.identical_QMARK_;
  var expr__3100 = k__2480__auto__;
  if(pred__3099.call(null, "\ufdd0'domain", expr__3100)) {
    return new c2.scale._linear(G__3095, self__.range, self__.__meta, self__.__extmap, null)
  }else {
    if(pred__3099.call(null, "\ufdd0'range", expr__3100)) {
      return new c2.scale._linear(self__.domain, G__3095, self__.__meta, self__.__extmap, null)
    }else {
      return new c2.scale._linear(self__.domain, self__.range, self__.__meta, cljs.core.assoc.call(null, self__.__extmap, k__2480__auto__, G__3095), null)
    }
  }
};
c2.scale._linear.prototype.call = function(self__, x) {
  var self__ = this;
  var self____$1 = this;
  var _ = self____$1;
  var domain_length = cljs.core.last.call(null, self__.domain) - cljs.core.first.call(null, self__.domain);
  var range_length = cljs.core.last.call(null, self__.range) - cljs.core.first.call(null, self__.range);
  return cljs.core.first.call(null, self__.range) + range_length * ((x - cljs.core.first.call(null, self__.domain)) / domain_length)
};
c2.scale._linear.prototype.apply = function(self__, args3098) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3098.slice()))
};
c2.scale._linear.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(this__2486__auto__, writer__2487__auto__, opts__2488__auto__) {
  var self__ = this;
  var pr_pair__2489__auto__ = function(keyval__2490__auto__) {
    return cljs.core.pr_sequential_writer.call(null, writer__2487__auto__, cljs.core.pr_writer, "", " ", "", opts__2488__auto__, keyval__2490__auto__)
  };
  return cljs.core.pr_sequential_writer.call(null, writer__2487__auto__, pr_pair__2489__auto__, [cljs.core.str("#"), cljs.core.str("_linear"), cljs.core.str("{")].join(""), ", ", "}", opts__2488__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'domain", self__.domain), cljs.core.vector.call(null, "\ufdd0'range", self__.range)], true), self__.__extmap))
};
c2.scale._linear.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2477__auto__, entry__2478__auto__) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2478__auto__)) {
    return this__2477__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2477__auto__, cljs.core._nth.call(null, entry__2478__auto__, 0), cljs.core._nth.call(null, entry__2478__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2477__auto__, entry__2478__auto__)
  }
};
c2.scale._linear.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2484__auto__) {
  var self__ = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'domain", self__.domain), cljs.core.vector.call(null, "\ufdd0'range", self__.range)], true), self__.__extmap))
};
c2.scale._linear.prototype.c2$scale$IInvertable$ = true;
c2.scale._linear.prototype.c2$scale$IInvertable$invert$arity$1 = function(this$) {
  var self__ = this;
  return cljs.core.assoc.call(null, this$, "\ufdd0'domain", self__.range, "\ufdd0'range", self__.domain)
};
c2.scale._linear.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2476__auto__) {
  var self__ = this;
  return 2 + cljs.core.count.call(null, self__.__extmap)
};
c2.scale._linear.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2468__auto__, other__2469__auto__) {
  var self__ = this;
  if(cljs.core.truth_(function() {
    var and__3941__auto__ = other__2469__auto__;
    if(cljs.core.truth_(and__3941__auto__)) {
      var and__3941__auto____$1 = this__2468__auto__.constructor === other__2469__auto__.constructor;
      if(and__3941__auto____$1) {
        return cljs.core.equiv_map.call(null, this__2468__auto__, other__2469__auto__)
      }else {
        return and__3941__auto____$1
      }
    }else {
      return and__3941__auto__
    }
  }())) {
    return true
  }else {
    return false
  }
};
c2.scale._linear.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2471__auto__, G__3095) {
  var self__ = this;
  return new c2.scale._linear(self__.domain, self__.range, G__3095, self__.__extmap, self__.__hash)
};
c2.scale._linear.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2470__auto__) {
  var self__ = this;
  return self__.__meta
};
c2.scale._linear.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2481__auto__, k__2482__auto__) {
  var self__ = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'domain", "\ufdd0'range"]), k__2482__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2481__auto__), self__.__meta), k__2482__auto__)
  }else {
    return new c2.scale._linear(self__.domain, self__.range, self__.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, self__.__extmap, k__2482__auto__)), null)
  }
};
c2.scale._linear.cljs$lang$type = true;
c2.scale._linear.cljs$lang$ctorPrSeq = function(this__2507__auto__) {
  return cljs.core.list.call(null, "c2.scale/_linear")
};
c2.scale._linear.cljs$lang$ctorPrWriter = function(this__2507__auto__, writer__2508__auto__) {
  return cljs.core._write.call(null, writer__2508__auto__, "c2.scale/_linear")
};
c2.scale.__GT__linear = function __GT__linear(domain, range) {
  return new c2.scale._linear(domain, range)
};
c2.scale.map__GT__linear = function map__GT__linear(G__3097) {
  return new c2.scale._linear((new cljs.core.Keyword("\ufdd0'domain")).call(null, G__3097), (new cljs.core.Keyword("\ufdd0'range")).call(null, G__3097), null, cljs.core.dissoc.call(null, G__3097, "\ufdd0'domain", "\ufdd0'range"))
};
c2.scale.linear = function() {
  var linear__delegate = function(kwargs) {
    return c2.scale.map__GT__linear.call(null, cljs.core.merge.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'domain", "\ufdd0'range"], {"\ufdd0'domain":cljs.core.PersistentVector.fromArray([0, 1], true), "\ufdd0'range":cljs.core.PersistentVector.fromArray([0, 1], true)}), cljs.core.apply.call(null, cljs.core.hash_map, kwargs)))
  };
  var linear = function(var_args) {
    var kwargs = null;
    if(goog.isDef(var_args)) {
      kwargs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return linear__delegate.call(this, kwargs)
  };
  linear.cljs$lang$maxFixedArity = 0;
  linear.cljs$lang$applyTo = function(arglist__3102) {
    var kwargs = cljs.core.seq(arglist__3102);
    return linear__delegate(kwargs)
  };
  linear.cljs$lang$arity$variadic = linear__delegate;
  return linear
}();
goog.provide("c2.scale._power");
c2.scale._power = function(domain, range, __meta, __extmap) {
  this.domain = domain;
  this.range = range;
  this.__meta = __meta;
  this.__extmap = __extmap;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2229667595;
  if(arguments.length > 2) {
    this.__meta = __meta;
    this.__extmap = __extmap
  }else {
    this.__meta = null;
    this.__extmap = null
  }
};
c2.scale._power.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2467__auto__) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_imap.call(null, this__2467__auto__);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
c2.scale._power.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2472__auto__, k__2473__auto__) {
  var self__ = this;
  return this__2472__auto__.cljs$core$ILookup$_lookup$arity$3(this__2472__auto__, k__2473__auto__, null)
};
c2.scale._power.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2474__auto__, k3104, else__2475__auto__) {
  var self__ = this;
  if(k3104 === "\ufdd0'domain") {
    return self__.domain
  }else {
    if(k3104 === "\ufdd0'range") {
      return self__.range
    }else {
      if("\ufdd0'else") {
        return cljs.core._lookup.call(null, self__.__extmap, k3104, else__2475__auto__)
      }else {
        return null
      }
    }
  }
};
c2.scale._power.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2479__auto__, k__2480__auto__, G__3103) {
  var self__ = this;
  var pred__3107 = cljs.core.identical_QMARK_;
  var expr__3108 = k__2480__auto__;
  if(pred__3107.call(null, "\ufdd0'domain", expr__3108)) {
    return new c2.scale._power(G__3103, self__.range, self__.__meta, self__.__extmap, null)
  }else {
    if(pred__3107.call(null, "\ufdd0'range", expr__3108)) {
      return new c2.scale._power(self__.domain, G__3103, self__.__meta, self__.__extmap, null)
    }else {
      return new c2.scale._power(self__.domain, self__.range, self__.__meta, cljs.core.assoc.call(null, self__.__extmap, k__2480__auto__, G__3103), null)
    }
  }
};
c2.scale._power.prototype.call = function(self__, x) {
  var self__ = this;
  var self____$1 = this;
  var _ = self____$1;
  return cljs.core.comp.call(null, c2.scale.linear.call(null, "\ufdd0'domain", cljs.core.map.call(null, c2.maths.expt, self__.domain), "\ufdd0'range", self__.range), c2.maths.expt).call(null, x)
};
c2.scale._power.prototype.apply = function(self__, args3106) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3106.slice()))
};
c2.scale._power.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(this__2486__auto__, writer__2487__auto__, opts__2488__auto__) {
  var self__ = this;
  var pr_pair__2489__auto__ = function(keyval__2490__auto__) {
    return cljs.core.pr_sequential_writer.call(null, writer__2487__auto__, cljs.core.pr_writer, "", " ", "", opts__2488__auto__, keyval__2490__auto__)
  };
  return cljs.core.pr_sequential_writer.call(null, writer__2487__auto__, pr_pair__2489__auto__, [cljs.core.str("#"), cljs.core.str("_power"), cljs.core.str("{")].join(""), ", ", "}", opts__2488__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'domain", self__.domain), cljs.core.vector.call(null, "\ufdd0'range", self__.range)], true), self__.__extmap))
};
c2.scale._power.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2477__auto__, entry__2478__auto__) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2478__auto__)) {
    return this__2477__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2477__auto__, cljs.core._nth.call(null, entry__2478__auto__, 0), cljs.core._nth.call(null, entry__2478__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2477__auto__, entry__2478__auto__)
  }
};
c2.scale._power.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2484__auto__) {
  var self__ = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'domain", self__.domain), cljs.core.vector.call(null, "\ufdd0'range", self__.range)], true), self__.__extmap))
};
c2.scale._power.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2476__auto__) {
  var self__ = this;
  return 2 + cljs.core.count.call(null, self__.__extmap)
};
c2.scale._power.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2468__auto__, other__2469__auto__) {
  var self__ = this;
  if(cljs.core.truth_(function() {
    var and__3941__auto__ = other__2469__auto__;
    if(cljs.core.truth_(and__3941__auto__)) {
      var and__3941__auto____$1 = this__2468__auto__.constructor === other__2469__auto__.constructor;
      if(and__3941__auto____$1) {
        return cljs.core.equiv_map.call(null, this__2468__auto__, other__2469__auto__)
      }else {
        return and__3941__auto____$1
      }
    }else {
      return and__3941__auto__
    }
  }())) {
    return true
  }else {
    return false
  }
};
c2.scale._power.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2471__auto__, G__3103) {
  var self__ = this;
  return new c2.scale._power(self__.domain, self__.range, G__3103, self__.__extmap, self__.__hash)
};
c2.scale._power.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2470__auto__) {
  var self__ = this;
  return self__.__meta
};
c2.scale._power.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2481__auto__, k__2482__auto__) {
  var self__ = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'domain", "\ufdd0'range"]), k__2482__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2481__auto__), self__.__meta), k__2482__auto__)
  }else {
    return new c2.scale._power(self__.domain, self__.range, self__.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, self__.__extmap, k__2482__auto__)), null)
  }
};
c2.scale._power.cljs$lang$type = true;
c2.scale._power.cljs$lang$ctorPrSeq = function(this__2507__auto__) {
  return cljs.core.list.call(null, "c2.scale/_power")
};
c2.scale._power.cljs$lang$ctorPrWriter = function(this__2507__auto__, writer__2508__auto__) {
  return cljs.core._write.call(null, writer__2508__auto__, "c2.scale/_power")
};
c2.scale.__GT__power = function __GT__power(domain, range) {
  return new c2.scale._power(domain, range)
};
c2.scale.map__GT__power = function map__GT__power(G__3105) {
  return new c2.scale._power((new cljs.core.Keyword("\ufdd0'domain")).call(null, G__3105), (new cljs.core.Keyword("\ufdd0'range")).call(null, G__3105), null, cljs.core.dissoc.call(null, G__3105, "\ufdd0'domain", "\ufdd0'range"))
};
c2.scale.power = function() {
  var power__delegate = function(kwargs) {
    return c2.scale.map__GT__power.call(null, cljs.core.merge.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'domain", "\ufdd0'range"], {"\ufdd0'domain":cljs.core.PersistentVector.fromArray([0, 1], true), "\ufdd0'range":cljs.core.PersistentVector.fromArray([0, 1], true)}), cljs.core.apply.call(null, cljs.core.hash_map, kwargs)))
  };
  var power = function(var_args) {
    var kwargs = null;
    if(goog.isDef(var_args)) {
      kwargs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return power__delegate.call(this, kwargs)
  };
  power.cljs$lang$maxFixedArity = 0;
  power.cljs$lang$applyTo = function(arglist__3110) {
    var kwargs = cljs.core.seq(arglist__3110);
    return power__delegate(kwargs)
  };
  power.cljs$lang$arity$variadic = power__delegate;
  return power
}();
goog.provide("c2.scale._log");
c2.scale._log = function(domain, range, __meta, __extmap) {
  this.domain = domain;
  this.range = range;
  this.__meta = __meta;
  this.__extmap = __extmap;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2229667595;
  if(arguments.length > 2) {
    this.__meta = __meta;
    this.__extmap = __extmap
  }else {
    this.__meta = null;
    this.__extmap = null
  }
};
c2.scale._log.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2467__auto__) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_imap.call(null, this__2467__auto__);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
c2.scale._log.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2472__auto__, k__2473__auto__) {
  var self__ = this;
  return this__2472__auto__.cljs$core$ILookup$_lookup$arity$3(this__2472__auto__, k__2473__auto__, null)
};
c2.scale._log.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2474__auto__, k3112, else__2475__auto__) {
  var self__ = this;
  if(k3112 === "\ufdd0'domain") {
    return self__.domain
  }else {
    if(k3112 === "\ufdd0'range") {
      return self__.range
    }else {
      if("\ufdd0'else") {
        return cljs.core._lookup.call(null, self__.__extmap, k3112, else__2475__auto__)
      }else {
        return null
      }
    }
  }
};
c2.scale._log.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2479__auto__, k__2480__auto__, G__3111) {
  var self__ = this;
  var pred__3115 = cljs.core.identical_QMARK_;
  var expr__3116 = k__2480__auto__;
  if(pred__3115.call(null, "\ufdd0'domain", expr__3116)) {
    return new c2.scale._log(G__3111, self__.range, self__.__meta, self__.__extmap, null)
  }else {
    if(pred__3115.call(null, "\ufdd0'range", expr__3116)) {
      return new c2.scale._log(self__.domain, G__3111, self__.__meta, self__.__extmap, null)
    }else {
      return new c2.scale._log(self__.domain, self__.range, self__.__meta, cljs.core.assoc.call(null, self__.__extmap, k__2480__auto__, G__3111), null)
    }
  }
};
c2.scale._log.prototype.call = function(self__, x) {
  var self__ = this;
  var self____$1 = this;
  var _ = self____$1;
  return cljs.core.comp.call(null, c2.scale.linear.call(null, "\ufdd0'domain", cljs.core.map.call(null, c2.maths.log, self__.domain), "\ufdd0'range", self__.range), c2.maths.log).call(null, x)
};
c2.scale._log.prototype.apply = function(self__, args3114) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3114.slice()))
};
c2.scale._log.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(this__2486__auto__, writer__2487__auto__, opts__2488__auto__) {
  var self__ = this;
  var pr_pair__2489__auto__ = function(keyval__2490__auto__) {
    return cljs.core.pr_sequential_writer.call(null, writer__2487__auto__, cljs.core.pr_writer, "", " ", "", opts__2488__auto__, keyval__2490__auto__)
  };
  return cljs.core.pr_sequential_writer.call(null, writer__2487__auto__, pr_pair__2489__auto__, [cljs.core.str("#"), cljs.core.str("_log"), cljs.core.str("{")].join(""), ", ", "}", opts__2488__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'domain", self__.domain), cljs.core.vector.call(null, "\ufdd0'range", self__.range)], true), self__.__extmap))
};
c2.scale._log.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2477__auto__, entry__2478__auto__) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2478__auto__)) {
    return this__2477__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2477__auto__, cljs.core._nth.call(null, entry__2478__auto__, 0), cljs.core._nth.call(null, entry__2478__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2477__auto__, entry__2478__auto__)
  }
};
c2.scale._log.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2484__auto__) {
  var self__ = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'domain", self__.domain), cljs.core.vector.call(null, "\ufdd0'range", self__.range)], true), self__.__extmap))
};
c2.scale._log.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2476__auto__) {
  var self__ = this;
  return 2 + cljs.core.count.call(null, self__.__extmap)
};
c2.scale._log.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2468__auto__, other__2469__auto__) {
  var self__ = this;
  if(cljs.core.truth_(function() {
    var and__3941__auto__ = other__2469__auto__;
    if(cljs.core.truth_(and__3941__auto__)) {
      var and__3941__auto____$1 = this__2468__auto__.constructor === other__2469__auto__.constructor;
      if(and__3941__auto____$1) {
        return cljs.core.equiv_map.call(null, this__2468__auto__, other__2469__auto__)
      }else {
        return and__3941__auto____$1
      }
    }else {
      return and__3941__auto__
    }
  }())) {
    return true
  }else {
    return false
  }
};
c2.scale._log.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2471__auto__, G__3111) {
  var self__ = this;
  return new c2.scale._log(self__.domain, self__.range, G__3111, self__.__extmap, self__.__hash)
};
c2.scale._log.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2470__auto__) {
  var self__ = this;
  return self__.__meta
};
c2.scale._log.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2481__auto__, k__2482__auto__) {
  var self__ = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'domain", "\ufdd0'range"]), k__2482__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2481__auto__), self__.__meta), k__2482__auto__)
  }else {
    return new c2.scale._log(self__.domain, self__.range, self__.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, self__.__extmap, k__2482__auto__)), null)
  }
};
c2.scale._log.cljs$lang$type = true;
c2.scale._log.cljs$lang$ctorPrSeq = function(this__2507__auto__) {
  return cljs.core.list.call(null, "c2.scale/_log")
};
c2.scale._log.cljs$lang$ctorPrWriter = function(this__2507__auto__, writer__2508__auto__) {
  return cljs.core._write.call(null, writer__2508__auto__, "c2.scale/_log")
};
c2.scale.__GT__log = function __GT__log(domain, range) {
  return new c2.scale._log(domain, range)
};
c2.scale.map__GT__log = function map__GT__log(G__3113) {
  return new c2.scale._log((new cljs.core.Keyword("\ufdd0'domain")).call(null, G__3113), (new cljs.core.Keyword("\ufdd0'range")).call(null, G__3113), null, cljs.core.dissoc.call(null, G__3113, "\ufdd0'domain", "\ufdd0'range"))
};
c2.scale.log = function() {
  var log__delegate = function(kwargs) {
    return c2.scale.map__GT__log.call(null, cljs.core.merge.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'domain", "\ufdd0'range"], {"\ufdd0'domain":cljs.core.PersistentVector.fromArray([1, 10], true), "\ufdd0'range":cljs.core.PersistentVector.fromArray([0, 1], true)}), cljs.core.apply.call(null, cljs.core.hash_map, kwargs)))
  };
  var log = function(var_args) {
    var kwargs = null;
    if(goog.isDef(var_args)) {
      kwargs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, kwargs)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__3118) {
    var kwargs = cljs.core.seq(arglist__3118);
    return log__delegate(kwargs)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
goog.provide("reflex.core");
goog.require("cljs.core");
reflex.core.capture_derefed = function capture_derefed(f) {
  var _BANG_recently_derefed3861 = reflex.core._BANG_recently_derefed;
  try {
    reflex.core._BANG_recently_derefed = cljs.core.atom.call(null, cljs.core.PersistentHashSet.EMPTY, "\ufdd0'meta", cljs.core.ObjMap.fromObject(["\ufdd0'no-deref-monitor"], {"\ufdd0'no-deref-monitor":true}));
    var res = f.call(null);
    return cljs.core.ObjMap.fromObject(["\ufdd0'res", "\ufdd0'derefed"], {"\ufdd0'res":res, "\ufdd0'derefed":cljs.core.deref.call(null, reflex.core._BANG_recently_derefed)})
  }finally {
    reflex.core._BANG_recently_derefed = _BANG_recently_derefed3861
  }
};
reflex.core.notify_deref_watcher_BANG_ = function notify_deref_watcher_BANG_(derefable) {
  if(cljs.core.truth_(function() {
    var and__3941__auto__ = reflex.core._BANG_recently_derefed;
    if(cljs.core.truth_(and__3941__auto__)) {
      return cljs.core.not.call(null, (new cljs.core.Keyword("\ufdd0'no-deref-monitor")).call(null, cljs.core.meta.call(null, derefable)))
    }else {
      return and__3941__auto__
    }
  }())) {
    return cljs.core.swap_BANG_.call(null, reflex.core._BANG_recently_derefed, function(p1__3858_SHARP_) {
      return cljs.core.conj.call(null, p1__3858_SHARP_, derefable)
    })
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(this$) {
  reflex.core.notify_deref_watcher_BANG_.call(null, this$);
  return this$.state
};
reflex.core.IDisposable = {};
reflex.core.dispose_BANG_ = function dispose_BANG_(this$) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.reflex$core$IDisposable$dispose_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.reflex$core$IDisposable$dispose_BANG_$arity$1(this$)
  }else {
    var x__2514__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = reflex.core.dispose_BANG_[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = reflex.core.dispose_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDisposable.dispose!", this$);
        }
      }
    }().call(null, this$)
  }
};
goog.provide("reflex.core.ComputedObservable");
reflex.core.ComputedObservable = function(state, dirty_QMARK_, f, key, parent_watchables, watches, __meta, __extmap) {
  this.state = state;
  this.dirty_QMARK_ = dirty_QMARK_;
  this.f = f;
  this.key = key;
  this.parent_watchables = parent_watchables;
  this.watches = watches;
  this.__meta = __meta;
  this.__extmap = __extmap;
  this.cljs$lang$protocol_mask$partition0$ = 2229700362;
  this.cljs$lang$protocol_mask$partition1$ = 2;
  if(arguments.length > 6) {
    this.__meta = __meta;
    this.__extmap = __extmap
  }else {
    this.__meta = null;
    this.__extmap = null
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2467__auto__) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_imap.call(null, this__2467__auto__);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2472__auto__, k__2473__auto__) {
  var self__ = this;
  return this__2472__auto__.cljs$core$ILookup$_lookup$arity$3(this__2472__auto__, k__2473__auto__, null)
};
reflex.core.ComputedObservable.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2474__auto__, k3864, else__2475__auto__) {
  var self__ = this;
  if(k3864 === "\ufdd0'state") {
    return self__.state
  }else {
    if(k3864 === "\ufdd0'dirty?") {
      return self__.dirty_QMARK_
    }else {
      if(k3864 === "\ufdd0'f") {
        return self__.f
      }else {
        if(k3864 === "\ufdd0'key") {
          return self__.key
        }else {
          if(k3864 === "\ufdd0'parent-watchables") {
            return self__.parent_watchables
          }else {
            if(k3864 === "\ufdd0'watches") {
              return self__.watches
            }else {
              if("\ufdd0'else") {
                return cljs.core._lookup.call(null, self__.__extmap, k3864, else__2475__auto__)
              }else {
                return null
              }
            }
          }
        }
      }
    }
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2479__auto__, k__2480__auto__, G__3863) {
  var self__ = this;
  var pred__3866 = cljs.core.identical_QMARK_;
  var expr__3867 = k__2480__auto__;
  if(pred__3866.call(null, "\ufdd0'state", expr__3867)) {
    return new reflex.core.ComputedObservable(G__3863, self__.dirty_QMARK_, self__.f, self__.key, self__.parent_watchables, self__.watches, self__.__meta, self__.__extmap, null)
  }else {
    if(pred__3866.call(null, "\ufdd0'dirty?", expr__3867)) {
      return new reflex.core.ComputedObservable(self__.state, G__3863, self__.f, self__.key, self__.parent_watchables, self__.watches, self__.__meta, self__.__extmap, null)
    }else {
      if(pred__3866.call(null, "\ufdd0'f", expr__3867)) {
        return new reflex.core.ComputedObservable(self__.state, self__.dirty_QMARK_, G__3863, self__.key, self__.parent_watchables, self__.watches, self__.__meta, self__.__extmap, null)
      }else {
        if(pred__3866.call(null, "\ufdd0'key", expr__3867)) {
          return new reflex.core.ComputedObservable(self__.state, self__.dirty_QMARK_, self__.f, G__3863, self__.parent_watchables, self__.watches, self__.__meta, self__.__extmap, null)
        }else {
          if(pred__3866.call(null, "\ufdd0'parent-watchables", expr__3867)) {
            return new reflex.core.ComputedObservable(self__.state, self__.dirty_QMARK_, self__.f, self__.key, G__3863, self__.watches, self__.__meta, self__.__extmap, null)
          }else {
            if(pred__3866.call(null, "\ufdd0'watches", expr__3867)) {
              return new reflex.core.ComputedObservable(self__.state, self__.dirty_QMARK_, self__.f, self__.key, self__.parent_watchables, G__3863, self__.__meta, self__.__extmap, null)
            }else {
              return new reflex.core.ComputedObservable(self__.state, self__.dirty_QMARK_, self__.f, self__.key, self__.parent_watchables, self__.watches, self__.__meta, cljs.core.assoc.call(null, self__.__extmap, k__2480__auto__, G__3863), null)
            }
          }
        }
      }
    }
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IDeref$_deref$arity$1 = function(this$) {
  var self__ = this;
  reflex.core.notify_deref_watcher_BANG_.call(null, this$);
  if(cljs.core.not.call(null, self__.dirty_QMARK_)) {
    return this$.state
  }else {
    var map__3869 = reflex.core.capture_derefed.call(null, self__.f);
    var map__3869__$1 = cljs.core.seq_QMARK_.call(null, map__3869) ? cljs.core.apply.call(null, cljs.core.hash_map, map__3869) : map__3869;
    var derefed = cljs.core._lookup.call(null, map__3869__$1, "\ufdd0'derefed", null);
    var res = cljs.core._lookup.call(null, map__3869__$1, "\ufdd0'res", null);
    var G__3870_3875 = cljs.core.seq.call(null, self__.parent_watchables);
    while(true) {
      if(G__3870_3875) {
        var w_3876 = cljs.core.first.call(null, G__3870_3875);
        cljs.core.remove_watch.call(null, w_3876, self__.key);
        var G__3877 = cljs.core.next.call(null, G__3870_3875);
        G__3870_3875 = G__3877;
        continue
      }else {
      }
      break
    }
    this$.parent_watchables = derefed;
    var G__3871_3878 = cljs.core.seq.call(null, derefed);
    while(true) {
      if(G__3871_3878) {
        var w_3879 = cljs.core.first.call(null, G__3871_3878);
        cljs.core.add_watch.call(null, w_3879, self__.key, function(G__3871_3878, w_3879) {
          return function() {
            this$.dirty_QMARK_ = true;
            return cljs.core._notify_watches.call(null, this$, null, null)
          }
        }(G__3871_3878, w_3879));
        var G__3880 = cljs.core.next.call(null, G__3871_3878);
        G__3871_3878 = G__3880;
        continue
      }else {
      }
      break
    }
    this$.state = res;
    this$.dirty_QMARK_ = false;
    return res
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(this__2486__auto__, writer__2487__auto__, opts__2488__auto__) {
  var self__ = this;
  var pr_pair__2489__auto__ = function(keyval__2490__auto__) {
    return cljs.core.pr_sequential_writer.call(null, writer__2487__auto__, cljs.core.pr_writer, "", " ", "", opts__2488__auto__, keyval__2490__auto__)
  };
  return cljs.core.pr_sequential_writer.call(null, writer__2487__auto__, pr_pair__2489__auto__, [cljs.core.str("#"), cljs.core.str("ComputedObservable"), cljs.core.str("{")].join(""), ", ", "}", opts__2488__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'state", self__.state), cljs.core.vector.call(null, "\ufdd0'dirty?", self__.dirty_QMARK_), cljs.core.vector.call(null, "\ufdd0'f", self__.f), cljs.core.vector.call(null, "\ufdd0'key", self__.key), 
  cljs.core.vector.call(null, "\ufdd0'parent-watchables", self__.parent_watchables), cljs.core.vector.call(null, "\ufdd0'watches", self__.watches)], true), self__.__extmap))
};
reflex.core.ComputedObservable.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2477__auto__, entry__2478__auto__) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2478__auto__)) {
    return this__2477__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2477__auto__, cljs.core._nth.call(null, entry__2478__auto__, 0), cljs.core._nth.call(null, entry__2478__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2477__auto__, entry__2478__auto__)
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, _, ___$1) {
  var self__ = this;
  var G__3872 = cljs.core.seq.call(null, self__.watches);
  while(true) {
    if(G__3872) {
      var vec__3873 = cljs.core.first.call(null, G__3872);
      var key__$1 = cljs.core.nth.call(null, vec__3873, 0, null);
      var wf = cljs.core.nth.call(null, vec__3873, 1, null);
      wf.call(null);
      var G__3881 = cljs.core.next.call(null, G__3872);
      G__3872 = G__3881;
      continue
    }else {
      return null
    }
    break
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key__$1, wf) {
  var self__ = this;
  return this$.watches = cljs.core.assoc.call(null, self__.watches, key__$1, wf)
};
reflex.core.ComputedObservable.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key__$1) {
  var self__ = this;
  return this$.watches = cljs.core.dissoc.call(null, self__.watches, key__$1)
};
reflex.core.ComputedObservable.prototype.reflex$core$IDisposable$ = true;
reflex.core.ComputedObservable.prototype.reflex$core$IDisposable$dispose_BANG_$arity$1 = function(this$) {
  var self__ = this;
  var G__3874_3882 = cljs.core.seq.call(null, self__.parent_watchables);
  while(true) {
    if(G__3874_3882) {
      var w_3883 = cljs.core.first.call(null, G__3874_3882);
      cljs.core.remove_watch.call(null, w_3883, self__.key);
      var G__3884 = cljs.core.next.call(null, G__3874_3882);
      G__3874_3882 = G__3884;
      continue
    }else {
    }
    break
  }
  return this$.watches = null
};
reflex.core.ComputedObservable.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2484__auto__) {
  var self__ = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'state", self__.state), cljs.core.vector.call(null, "\ufdd0'dirty?", self__.dirty_QMARK_), cljs.core.vector.call(null, "\ufdd0'f", self__.f), cljs.core.vector.call(null, "\ufdd0'key", self__.key), cljs.core.vector.call(null, "\ufdd0'parent-watchables", self__.parent_watchables), cljs.core.vector.call(null, "\ufdd0'watches", self__.watches)], true), self__.__extmap))
};
reflex.core.ComputedObservable.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2476__auto__) {
  var self__ = this;
  return 6 + cljs.core.count.call(null, self__.__extmap)
};
reflex.core.ComputedObservable.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2468__auto__, other__2469__auto__) {
  var self__ = this;
  if(cljs.core.truth_(function() {
    var and__3941__auto__ = other__2469__auto__;
    if(cljs.core.truth_(and__3941__auto__)) {
      var and__3941__auto____$1 = this__2468__auto__.constructor === other__2469__auto__.constructor;
      if(and__3941__auto____$1) {
        return cljs.core.equiv_map.call(null, this__2468__auto__, other__2469__auto__)
      }else {
        return and__3941__auto____$1
      }
    }else {
      return and__3941__auto__
    }
  }())) {
    return true
  }else {
    return false
  }
};
reflex.core.ComputedObservable.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2471__auto__, G__3863) {
  var self__ = this;
  return new reflex.core.ComputedObservable(self__.state, self__.dirty_QMARK_, self__.f, self__.key, self__.parent_watchables, self__.watches, G__3863, self__.__extmap, self__.__hash)
};
reflex.core.ComputedObservable.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2470__auto__) {
  var self__ = this;
  return self__.__meta
};
reflex.core.ComputedObservable.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2481__auto__, k__2482__auto__) {
  var self__ = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'dirty?", "\ufdd0'state", "\ufdd0'key", "\ufdd0'f", "\ufdd0'watches", "\ufdd0'parent-watchables"]), k__2482__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2481__auto__), self__.__meta), k__2482__auto__)
  }else {
    return new reflex.core.ComputedObservable(self__.state, self__.dirty_QMARK_, self__.f, self__.key, self__.parent_watchables, self__.watches, self__.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, self__.__extmap, k__2482__auto__)), null)
  }
};
reflex.core.ComputedObservable.cljs$lang$type = true;
reflex.core.ComputedObservable.cljs$lang$ctorPrSeq = function(this__2507__auto__) {
  return cljs.core.list.call(null, "reflex.core/ComputedObservable")
};
reflex.core.ComputedObservable.cljs$lang$ctorPrWriter = function(this__2507__auto__, writer__2508__auto__) {
  return cljs.core._write.call(null, writer__2508__auto__, "reflex.core/ComputedObservable")
};
reflex.core.__GT_ComputedObservable = function __GT_ComputedObservable(state, dirty_QMARK_, f, key, parent_watchables, watches) {
  return new reflex.core.ComputedObservable(state, dirty_QMARK_, f, key, parent_watchables, watches)
};
reflex.core.map__GT_ComputedObservable = function map__GT_ComputedObservable(G__3865) {
  return new reflex.core.ComputedObservable((new cljs.core.Keyword("\ufdd0'state")).call(null, G__3865), (new cljs.core.Keyword("\ufdd0'dirty?")).call(null, G__3865), (new cljs.core.Keyword("\ufdd0'f")).call(null, G__3865), (new cljs.core.Keyword("\ufdd0'key")).call(null, G__3865), (new cljs.core.Keyword("\ufdd0'parent-watchables")).call(null, G__3865), (new cljs.core.Keyword("\ufdd0'watches")).call(null, G__3865), null, cljs.core.dissoc.call(null, G__3865, "\ufdd0'state", "\ufdd0'dirty?", "\ufdd0'f", 
  "\ufdd0'key", "\ufdd0'parent-watchables", "\ufdd0'watches"))
};
reflex.core.ComputedObservable.prototype.cljs$core$IHash$ = true;
reflex.core.ComputedObservable.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  return this$.key
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.ASSUME_ANY_VERSION = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION || goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && !!document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), CAN_USE_PARENT_ELEMENT_PROPERTY:goog.userAgent.IE || goog.userAgent.OPERA || goog.userAgent.WEBKIT, INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", AUDIO:"AUDIO", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", 
FRAMESET:"FRAMESET", H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", 
SPAN:"SPAN", STRIKE:"STRIKE", STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR", VIDEO:"VIDEO"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return goog.isString(className) && className.match(/\S+/g) || []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var expectedCount = classes.length + args.length;
  goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return classes.length == expectedCount
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var newClasses = goog.dom.classes.getDifference_(classes, args);
  element.className = newClasses.join(" ");
  return newClasses.length == classes.length - args.length
};
goog.dom.classes.add_ = function(classes, args) {
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i])
    }
  }
};
goog.dom.classes.getDifference_ = function(arr1, arr2) {
  return goog.array.filter(arr1, function(item) {
    return!goog.array.contains(arr2, item)
  })
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      classes = goog.dom.classes.getDifference_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math");
goog.require("goog.array");
goog.math.randomInt = function(a) {
  return Math.floor(Math.random() * a)
};
goog.math.uniformRandom = function(a, b) {
  return a + Math.random() * (b - a)
};
goog.math.clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max)
};
goog.math.modulo = function(a, b) {
  var r = a % b;
  return r * b < 0 ? r + b : r
};
goog.math.lerp = function(a, b, x) {
  return a + x * (b - a)
};
goog.math.nearlyEquals = function(a, b, opt_tolerance) {
  return Math.abs(a - b) <= (opt_tolerance || 1E-6)
};
goog.math.standardAngle = function(angle) {
  return goog.math.modulo(angle, 360)
};
goog.math.toRadians = function(angleDegrees) {
  return angleDegrees * Math.PI / 180
};
goog.math.toDegrees = function(angleRadians) {
  return angleRadians * 180 / Math.PI
};
goog.math.angleDx = function(degrees, radius) {
  return radius * Math.cos(goog.math.toRadians(degrees))
};
goog.math.angleDy = function(degrees, radius) {
  return radius * Math.sin(goog.math.toRadians(degrees))
};
goog.math.angle = function(x1, y1, x2, y2) {
  return goog.math.standardAngle(goog.math.toDegrees(Math.atan2(y2 - y1, x2 - x1)))
};
goog.math.angleDifference = function(startAngle, endAngle) {
  var d = goog.math.standardAngle(endAngle) - goog.math.standardAngle(startAngle);
  if(d > 180) {
    d = d - 360
  }else {
    if(d <= -180) {
      d = 360 + d
    }
  }
  return d
};
goog.math.sign = function(x) {
  return x == 0 ? 0 : x < 0 ? -1 : 1
};
goog.math.longestCommonSubsequence = function(array1, array2, opt_compareFn, opt_collectorFn) {
  var compare = opt_compareFn || function(a, b) {
    return a == b
  };
  var collect = opt_collectorFn || function(i1, i2) {
    return array1[i1]
  };
  var length1 = array1.length;
  var length2 = array2.length;
  var arr = [];
  for(var i = 0;i < length1 + 1;i++) {
    arr[i] = [];
    arr[i][0] = 0
  }
  for(var j = 0;j < length2 + 1;j++) {
    arr[0][j] = 0
  }
  for(i = 1;i <= length1;i++) {
    for(j = 1;j <= length1;j++) {
      if(compare(array1[i - 1], array2[j - 1])) {
        arr[i][j] = arr[i - 1][j - 1] + 1
      }else {
        arr[i][j] = Math.max(arr[i - 1][j], arr[i][j - 1])
      }
    }
  }
  var result = [];
  var i = length1, j = length2;
  while(i > 0 && j > 0) {
    if(compare(array1[i - 1], array2[j - 1])) {
      result.unshift(collect(i - 1, j - 1));
      i--;
      j--
    }else {
      if(arr[i - 1][j] > arr[i][j - 1]) {
        i--
      }else {
        j--
      }
    }
  }
  return result
};
goog.math.sum = function(var_args) {
  return goog.array.reduce(arguments, function(sum, value) {
    return sum + value
  }, 0)
};
goog.math.average = function(var_args) {
  return goog.math.sum.apply(null, arguments) / arguments.length
};
goog.math.standardDeviation = function(var_args) {
  var sampleSize = arguments.length;
  if(sampleSize < 2) {
    return 0
  }
  var mean = goog.math.average.apply(null, arguments);
  var variance = goog.math.sum.apply(null, goog.array.map(arguments, function(val) {
    return Math.pow(val - mean, 2)
  })) / (sampleSize - 1);
  return Math.sqrt(variance)
};
goog.math.isInt = function(num) {
  return isFinite(num) && num % 1 == 0
};
goog.math.isFiniteNumber = function(num) {
  return isFinite(num) && !isNaN(num)
};
goog.provide("goog.math.Coordinate");
goog.require("goog.math");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.magnitude = function(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y)
};
goog.math.Coordinate.azimuth = function(a) {
  return goog.math.angle(0, 0, a.x, a.y)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return!!(parent.querySelectorAll && parent.querySelector)
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            if(goog.string.startsWith(key, "aria-") || goog.string.startsWith(key, "data-")) {
              element.setAttribute(key, val)
            }else {
              element[key] = val
            }
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "frameborder":"frameBorder", "height":"height", "maxlength":"maxLength", "role":"role", "rowspan":"rowSpan", "type":"type", "usemap":"useMap", "valign":"vAlign", "width":"width"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.toArray(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.getParentElement = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_PARENT_ELEMENT_PROPERTY) {
    return element.parentElement
  }
  var parent = element.parentNode;
  return goog.dom.isElement(parent) ? parent : null
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    var child = root.firstChild;
    while(child) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
      child = child.nextSibling
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0 && index < 32768
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  if(!opt_tag && !opt_class) {
    return null
  }
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, className) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, className)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement
  }catch(e) {
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.getActiveElement = function(opt_doc) {
  return goog.dom.getActiveElement(opt_doc || this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.canHaveChildren = goog.dom.canHaveChildren;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.insertChildAt = goog.dom.insertChildAt;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getChildren = goog.dom.getChildren;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.isElement = goog.dom.isElement;
goog.dom.DomHelper.prototype.isWindow = goog.dom.isWindow;
goog.dom.DomHelper.prototype.getParentElement = goog.dom.getParentElement;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.compareNodeOrder = goog.dom.compareNodeOrder;
goog.dom.DomHelper.prototype.findCommonAncestor = goog.dom.findCommonAncestor;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.getOuterHtml = goog.dom.getOuterHtml;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.isFocusableTabIndex = goog.dom.isFocusableTabIndex;
goog.dom.DomHelper.prototype.setFocusableTabIndex = goog.dom.setFocusableTabIndex;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getNodeAtOffset = goog.dom.getNodeAtOffset;
goog.dom.DomHelper.prototype.isNodeList = goog.dom.isNodeList;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for(var i = 1;i < arguments.length;i++) {
    var coord = arguments[i];
    box.top = Math.min(box.top, coord.y);
    box.right = Math.max(box.right, coord.x);
    box.bottom = Math.max(box.bottom, coord.y);
    box.left = Math.min(box.left, coord.x)
  }
  return box
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left)
};
if(goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return"(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
  }
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other)
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if(goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left
  }else {
    this.top -= top;
    this.right += opt_right;
    this.bottom += opt_bottom;
    this.left -= opt_left
  }
  return this
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom)
};
goog.math.Box.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
};
goog.math.Box.contains = function(box, other) {
  if(!box || !other) {
    return false
  }
  if(other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
};
goog.math.Box.relativePositionX = function(box, coord) {
  if(coord.x < box.left) {
    return coord.x - box.left
  }else {
    if(coord.x > box.right) {
      return coord.x - box.right
    }
  }
  return 0
};
goog.math.Box.relativePositionY = function(box, coord) {
  if(coord.y < box.top) {
    return coord.y - box.top
  }else {
    if(coord.y > box.bottom) {
      return coord.y - box.bottom
    }
  }
  return 0
};
goog.math.Box.distance = function(box, coord) {
  var x = goog.math.Box.relativePositionX(box, coord);
  var y = goog.math.Box.relativePositionY(box, coord);
  return Math.sqrt(x * x + y * y)
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
};
goog.provide("goog.math.Rect");
goog.require("goog.math.Box");
goog.require("goog.math.Size");
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height)
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left)
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top)
};
if(goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return"(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)"
  }
}
goog.math.Rect.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if(x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if(y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true
    }
  }
  return false
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if(x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if(y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0)
    }
  }
  return null
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect)
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if(!intersection || !intersection.height || !intersection.width) {
    return[a.clone()]
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if(b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top
  }
  if(bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top
  }
  if(b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height))
  }
  if(br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height))
  }
  return result
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect)
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top
};
goog.math.Rect.boundingRect = function(a, b) {
  if(!a || !b) {
    return null
  }
  var clone = a.clone();
  clone.boundingRect(b);
  return clone
};
goog.math.Rect.prototype.contains = function(another) {
  if(another instanceof goog.math.Rect) {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height
  }else {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height
  }
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height)
};
goog.provide("goog.style");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.dom");
goog.require("goog.math.Box");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Rect");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.style.setStyle = function(element, style, opt_value) {
  if(goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style)
  }else {
    goog.object.forEach(style, goog.partial(goog.style.setStyle_, element))
  }
};
goog.style.setStyle_ = function(element, value, style) {
  element.style[goog.string.toCamelCase(style)] = value
};
goog.style.getStyle = function(element, property) {
  return element.style[goog.string.toCamelCase(property)] || ""
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if(doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if(styles) {
      return styles[property] || styles.getPropertyValue(property) || ""
    }
  }
  return""
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style && element.style[style]
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position")
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor")
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX")
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY")
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex")
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign")
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor")
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x, y;
  var buggyGeckoSubPixelPos = goog.userAgent.GECKO && (goog.userAgent.MAC || goog.userAgent.X11) && goog.userAgent.isVersion("1.9");
  if(arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y
  }else {
    x = arg1;
    y = opt_arg2
  }
  el.style.left = goog.style.getPixelStyleValue_(x, buggyGeckoSubPixelPos);
  el.style.top = goog.style.getPixelStyleValue_(y, buggyGeckoSubPixelPos)
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop)
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if(opt_node) {
    doc = goog.dom.getOwnerDocument(opt_node)
  }else {
    doc = goog.dom.getDocument()
  }
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body
  }
  return doc.documentElement
};
goog.style.getViewportPageOffset = function(doc) {
  var body = doc.body;
  var documentElement = doc.documentElement;
  var scrollLeft = body.scrollLeft || documentElement.scrollLeft;
  var scrollTop = body.scrollTop || documentElement.scrollTop;
  return new goog.math.Coordinate(scrollLeft, scrollTop)
};
goog.style.supportsGetBoundingClientRect_ = function(el) {
  if(goog.userAgent.MOBILE && goog.userAgent.WEBKIT) {
    var win = el.ownerDocument.defaultView;
    if(win != win.top) {
      return false
    }
  }
  return!!el.getBoundingClientRect
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect = el.getBoundingClientRect();
  if(goog.userAgent.IE) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop
  }
  return rect
};
goog.style.getOffsetParent = function(element) {
  if(goog.userAgent.IE && !goog.userAgent.isDocumentMode(8)) {
    return element.offsetParent
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for(var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if(!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute" || positionStyle == "relative")) {
      return parent
    }
  }
  return null
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var documentElement = dom.getDocument().documentElement;
  var scrollEl = dom.getDocumentScrollElement();
  for(var el = element;el = goog.style.getOffsetParent(el);) {
    if((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && el != body && el != documentElement && goog.style.getStyle_(el, "overflow") != "visible") {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x)
    }
  }
  var scrollX = scrollEl.scrollLeft, scrollY = scrollEl.scrollTop;
  visibleRect.left = Math.max(visibleRect.left, scrollX);
  visibleRect.top = Math.max(visibleRect.top, scrollY);
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null
};
goog.style.getContainerOffsetToScrollInto = function(element, container, opt_center) {
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  var relX = elementPos.x - containerPos.x - containerBorder.left;
  var relY = elementPos.y - containerPos.y - containerBorder.top;
  var spaceX = container.clientWidth - element.offsetWidth;
  var spaceY = container.clientHeight - element.offsetHeight;
  var scrollLeft = container.scrollLeft;
  var scrollTop = container.scrollTop;
  if(opt_center) {
    scrollLeft += relX - spaceX / 2;
    scrollTop += relY - spaceY / 2
  }else {
    scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    scrollTop += Math.min(relY, Math.max(relY - spaceY, 0))
  }
  return new goog.math.Coordinate(scrollLeft, scrollTop)
};
goog.style.scrollIntoContainerView = function(element, container, opt_center) {
  var offset = goog.style.getContainerOffsetToScrollInto(element, container, opt_center);
  container.scrollLeft = offset.x;
  container.scrollTop = offset.y
};
goog.style.getClientLeftTop = function(el) {
  if(goog.userAgent.GECKO && !goog.userAgent.isVersion("1.9")) {
    var left = parseFloat(goog.style.getComputedStyle(el, "borderLeftWidth"));
    if(goog.style.isRightToLeft(el)) {
      var scrollbarWidth = el.offsetWidth - el.clientWidth - left - parseFloat(goog.style.getComputedStyle(el, "borderRightWidth"));
      left += scrollbarWidth
    }
    return new goog.math.Coordinate(left, parseFloat(goog.style.getComputedStyle(el, "borderTopWidth")))
  }
  return new goog.math.Coordinate(el.clientLeft, el.clientTop)
};
goog.style.getPageOffset = function(el) {
  var box, doc = goog.dom.getOwnerDocument(el);
  var positionStyle = goog.style.getStyle_(el, "position");
  goog.asserts.assertObject(el, "Parameter is required");
  var BUGGY_GECKO_BOX_OBJECT = goog.userAgent.GECKO && doc.getBoxObjectFor && !el.getBoundingClientRect && positionStyle == "absolute" && (box = doc.getBoxObjectFor(el)) && (box.screenX < 0 || box.screenY < 0);
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if(el == viewportElement) {
    return pos
  }
  if(goog.style.supportsGetBoundingClientRect_(el)) {
    box = goog.style.getBoundingClientRect_(el);
    var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
    pos.x = box.left + scrollCoord.x;
    pos.y = box.top + scrollCoord.y
  }else {
    if(doc.getBoxObjectFor && !BUGGY_GECKO_BOX_OBJECT) {
      box = doc.getBoxObjectFor(el);
      var vpBox = doc.getBoxObjectFor(viewportElement);
      pos.x = box.screenX - vpBox.screenX;
      pos.y = box.screenY - vpBox.screenY
    }else {
      var parent = el;
      do {
        pos.x += parent.offsetLeft;
        pos.y += parent.offsetTop;
        if(parent != el) {
          pos.x += parent.clientLeft || 0;
          pos.y += parent.clientTop || 0
        }
        if(goog.userAgent.WEBKIT && goog.style.getComputedPosition(parent) == "fixed") {
          pos.x += doc.body.scrollLeft;
          pos.y += doc.body.scrollTop;
          break
        }
        parent = parent.offsetParent
      }while(parent && parent != el);
      if(goog.userAgent.OPERA || goog.userAgent.WEBKIT && positionStyle == "absolute") {
        pos.y -= doc.body.offsetTop
      }
      for(parent = el;(parent = goog.style.getOffsetParent(parent)) && parent != doc.body && parent != viewportElement;) {
        pos.x -= parent.scrollLeft;
        if(!goog.userAgent.OPERA || parent.tagName != "TR") {
          pos.y -= parent.scrollTop
        }
      }
    }
  }
  return pos
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPosition(currentEl);
    position.x += offset.x;
    position.y += offset.y
  }while(currentWin && currentWin != relativeWin && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if(origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if(goog.userAgent.IE && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll())
    }
    rect.left += pos.x;
    rect.top += pos.y
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y)
};
goog.style.getClientPosition = function(el) {
  var pos = new goog.math.Coordinate;
  if(el.nodeType == goog.dom.NodeType.ELEMENT) {
    el = el;
    if(goog.style.supportsGetBoundingClientRect_(el)) {
      var box = goog.style.getBoundingClientRect_(el);
      pos.x = box.left;
      pos.y = box.top
    }else {
      var scrollCoord = goog.dom.getDomHelper(el).getDocumentScroll();
      var pageCoord = goog.style.getPageOffset(el);
      pos.x = pageCoord.x - scrollCoord.x;
      pos.y = pageCoord.y - scrollCoord.y
    }
    if(goog.userAgent.GECKO && !goog.userAgent.isVersion(12)) {
      pos = goog.math.Coordinate.sum(pos, goog.style.getCssTranslation(el))
    }
  }else {
    var isAbstractedEvent = goog.isFunction(el.getBrowserEvent);
    var targetEvent = el;
    if(el.targetTouches) {
      targetEvent = el.targetTouches[0]
    }else {
      if(isAbstractedEvent && el.getBrowserEvent().targetTouches) {
        targetEvent = el.getBrowserEvent().targetTouches[0]
      }
    }
    pos.x = targetEvent.clientX;
    pos.y = targetEvent.clientY
  }
  return pos
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if(x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x
  }
  var dx = x - cur.x;
  var dy = opt_y - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy)
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if(w instanceof goog.math.Size) {
    h = w.height;
    w = w.width
  }else {
    if(opt_h == undefined) {
      throw Error("missing height argument");
    }
    h = opt_h
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h)
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if(typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px"
  }
  return value
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true)
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true)
};
goog.style.getSize = function(element) {
  if(goog.style.getStyle_(element, "display") != "none") {
    return goog.style.getSizeWithDisplay_(element)
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var size = goog.style.getSizeWithDisplay_(element);
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return size
};
goog.style.getSizeWithDisplay_ = function(element) {
  var offsetWidth = element.offsetWidth;
  var offsetHeight = element.offsetHeight;
  var webkitOffsetsZero = goog.userAgent.WEBKIT && !offsetWidth && !offsetHeight;
  if((!goog.isDef(offsetWidth) || webkitOffsetsZero) && element.getBoundingClientRect) {
    var clientRect = goog.style.getBoundingClientRect_(element);
    return new goog.math.Size(clientRect.right - clientRect.left, clientRect.bottom - clientRect.top)
  }
  return new goog.math.Size(offsetWidth, offsetHeight)
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height)
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector))
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector)
};
goog.style.getOpacity = function(el) {
  var style = el.style;
  var result = "";
  if("opacity" in style) {
    result = style.opacity
  }else {
    if("MozOpacity" in style) {
      result = style.MozOpacity
    }else {
      if("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if(match) {
          result = String(match[1] / 100)
        }
      }
    }
  }
  return result == "" ? result : Number(result)
};
goog.style.setOpacity = function(el, alpha) {
  var style = el.style;
  if("opacity" in style) {
    style.opacity = alpha
  }else {
    if("MozOpacity" in style) {
      style.MozOpacity = alpha
    }else {
      if("filter" in style) {
        if(alpha === "") {
          style.filter = ""
        }else {
          style.filter = "alpha(opacity=" + alpha * 100 + ")"
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")'
  }else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat"
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if("filter" in style) {
    style.filter = ""
  }else {
    style.backgroundImage = "none"
  }
};
goog.style.showElement = function(el, display) {
  el.style.display = display ? "" : "none"
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none"
};
goog.style.installStyles = function(stylesString, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var styleSheet = null;
  if(goog.userAgent.IE) {
    styleSheet = dh.getDocument().createStyleSheet();
    goog.style.setStyles(styleSheet, stylesString)
  }else {
    var head = dh.getElementsByTagNameAndClass("head")[0];
    if(!head) {
      var body = dh.getElementsByTagNameAndClass("body")[0];
      head = dh.createDom("head");
      body.parentNode.insertBefore(head, body)
    }
    styleSheet = dh.createDom("style");
    goog.style.setStyles(styleSheet, stylesString);
    dh.appendChild(head, styleSheet)
  }
  return styleSheet
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node)
};
goog.style.setStyles = function(element, stylesString) {
  if(goog.userAgent.IE) {
    element.cssText = stylesString
  }else {
    element.innerHTML = stylesString
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word"
  }else {
    if(goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap"
    }else {
      style.whiteSpace = "pre-wrap"
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if(goog.userAgent.IE && !goog.userAgent.isVersion("8")) {
    style.zoom = "1";
    style.display = "inline"
  }else {
    if(goog.userAgent.GECKO) {
      style.display = goog.userAgent.isVersion("1.9a") ? "inline-block" : "-moz-inline-box"
    }else {
      style.display = "inline-block"
    }
  }
};
goog.style.isRightToLeft = function(el) {
  return"rtl" == goog.style.getStyle_(el, "direction")
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if(goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none"
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on"
    }
  }
  return false
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if(name) {
    var value = unselectable ? "none" : "";
    el.style[name] = value;
    if(descendants) {
      for(var i = 0, descendant;descendant = descendants[i];i++) {
        descendant.style[name] = value
      }
    }
  }else {
    if(goog.userAgent.IE || goog.userAgent.OPERA) {
      var value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if(descendants) {
        for(var i = 0, descendant;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value)
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight)
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom
    }else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "border-box")
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if(ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height)
  }else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom)
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if(goog.userAgent.IE && (!isCss1CompatMode || !goog.userAgent.isVersion("8"))) {
    var style = element.style;
    if(isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height
    }else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom
    }
  }else {
    goog.style.setBoxSizingSize_(element, size, "content-box")
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if(goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing
  }else {
    if(goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing
    }else {
      style.boxSizing = boxSizing
    }
  }
  style.width = Math.max(size.width, 0) + "px";
  style.height = Math.max(size.height, 0) + "px"
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if(/^\d+px?$/.test(value)) {
    return parseInt(value, 10)
  }else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return pixelValue
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  return goog.style.getIePixelValue_(element, goog.style.getCascadedStyle(element, propName), "left", "pixelLeft")
};
goog.style.getBox_ = function(element, stylePrefix) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    var right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    var top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    var bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding")
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin")
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if(goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if(width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width]
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft")
};
goog.style.getBorderBox = function(element) {
  if(goog.userAgent.IE) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left)
  }else {
    var left = goog.style.getComputedStyle(element, "borderLeftWidth");
    var right = goog.style.getComputedStyle(element, "borderRightWidth");
    var top = goog.style.getComputedStyle(element, "borderTopWidth");
    var bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left))
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if(doc.body.createTextRange) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName")
    }catch(e) {
      font = ""
    }
  }
  if(!font) {
    font = goog.style.getStyle_(el, "fontFamily")
  }
  var fontsArray = font.split(",");
  if(fontsArray.length > 1) {
    font = fontsArray[0]
  }
  return goog.string.stripQuotes(font, "\"'")
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if(fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10)
  }
  if(goog.userAgent.IE) {
    if(sizeUnits in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft")
    }else {
      if(el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && sizeUnits in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft")
      }
    }
  }
  var sizeElement = goog.dom.createDom("span", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.split(/\s*:\s*/);
    if(keyValue.length == 2) {
      result[goog.string.toCamelCase(keyValue[0].toLowerCase())] = keyValue[1]
    }
  });
  return result
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";")
  });
  return buffer.join("")
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || ""
};
goog.style.getScrollbarWidth = function(opt_className) {
  var outerDiv = goog.dom.createElement("div");
  if(opt_className) {
    outerDiv.className = opt_className
  }
  outerDiv.style.cssText = "overflow:auto;" + "position:absolute;top:0;width:100px;height:100px";
  var innerDiv = goog.dom.createElement("div");
  goog.style.setSize(innerDiv, "200px", "200px");
  outerDiv.appendChild(innerDiv);
  goog.dom.appendChild(goog.dom.getDocument().body, outerDiv);
  var width = outerDiv.offsetWidth - outerDiv.clientWidth;
  goog.dom.removeNode(outerDiv);
  return width
};
goog.style.MATRIX_TRANSLATION_REGEX_ = new RegExp("matrix\\([0-9\\.\\-]+, [0-9\\.\\-]+, " + "[0-9\\.\\-]+, [0-9\\.\\-]+, " + "([0-9\\.\\-]+)p?x?, ([0-9\\.\\-]+)p?x?\\)");
goog.style.getCssTranslation = function(element) {
  var property;
  if(goog.userAgent.IE) {
    property = "-ms-transform"
  }else {
    if(goog.userAgent.WEBKIT) {
      property = "-webkit-transform"
    }else {
      if(goog.userAgent.OPERA) {
        property = "-o-transform"
      }else {
        if(goog.userAgent.GECKO) {
          property = "-moz-transform"
        }
      }
    }
  }
  var transform;
  if(property) {
    transform = goog.style.getStyle_(element, property)
  }
  if(!transform) {
    transform = goog.style.getStyle_(element, "transform")
  }
  if(!transform) {
    return new goog.math.Coordinate(0, 0)
  }
  var matches = transform.match(goog.style.MATRIX_TRANSLATION_REGEX_);
  if(!matches) {
    return new goog.math.Coordinate(0, 0)
  }
  return new goog.math.Coordinate(parseFloat(matches[1]), parseFloat(matches[2]))
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      if(f.call(opt_obj, val, undefined, iterator)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      return f.call(opt_obj, val, undefined, iterator)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterator.next();
      if(dropping && f.call(opt_obj, val, undefined, iterator)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  var iterator = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterator.next();
        if(f.call(opt_obj, val, undefined, iterator)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.iter.cycle = function(iterable) {
  var baseIterator = goog.iter.toIterator(iterable);
  var cache = [];
  var cacheIndex = 0;
  var iter = new goog.iter.Iterator;
  var useCache = false;
  iter.next = function() {
    var returnElement = null;
    if(!useCache) {
      try {
        returnElement = baseIterator.next();
        cache.push(returnElement);
        return returnElement
      }catch(e) {
        if(e != goog.iter.StopIteration || goog.array.isEmpty(cache)) {
          throw e;
        }
        useCache = true
      }
    }
    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;
    return returnElement
  };
  return iter
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.dom.forms");
goog.require("goog.structs.Map");
goog.dom.forms.getFormDataMap = function(form) {
  var map = new goog.structs.Map;
  goog.dom.forms.getFormDataHelper_(form, map, goog.dom.forms.addFormDataToMap_);
  return map
};
goog.dom.forms.getFormDataString = function(form) {
  var sb = [];
  goog.dom.forms.getFormDataHelper_(form, sb, goog.dom.forms.addFormDataToStringBuffer_);
  return sb.join("&")
};
goog.dom.forms.getFormDataHelper_ = function(form, result, fnAppend) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(el.form != form || el.disabled || el.tagName.toLowerCase() == "fieldset") {
      continue
    }
    var name = el.name;
    switch(el.type.toLowerCase()) {
      case "file":
      ;
      case "submit":
      ;
      case "reset":
      ;
      case "button":
        break;
      case "select-multiple":
        var values = goog.dom.forms.getValue(el);
        if(values != null) {
          for(var value, j = 0;value = values[j];j++) {
            fnAppend(result, name, value)
          }
        }
        break;
      default:
        var value = goog.dom.forms.getValue(el);
        if(value != null) {
          fnAppend(result, name, value)
        }
    }
  }
  var inputs = form.getElementsByTagName("input");
  for(var input, i = 0;input = inputs[i];i++) {
    if(input.form == form && input.type.toLowerCase() == "image") {
      name = input.name;
      fnAppend(result, name, input.value);
      fnAppend(result, name + ".x", "0");
      fnAppend(result, name + ".y", "0")
    }
  }
};
goog.dom.forms.addFormDataToMap_ = function(map, name, value) {
  var array = map.get(name);
  if(!array) {
    array = [];
    map.set(name, array)
  }
  array.push(value)
};
goog.dom.forms.addFormDataToStringBuffer_ = function(sb, name, value) {
  sb.push(encodeURIComponent(name) + "=" + encodeURIComponent(value))
};
goog.dom.forms.hasFileInput = function(form) {
  var els = form.elements;
  for(var el, i = 0;el = els[i];i++) {
    if(!el.disabled && el.type && el.type.toLowerCase() == "file") {
      return true
    }
  }
  return false
};
goog.dom.forms.setDisabled = function(el, disabled) {
  if(el.tagName == "FORM") {
    var els = el.elements;
    for(var i = 0;el = els[i];i++) {
      goog.dom.forms.setDisabled(el, disabled)
    }
  }else {
    if(disabled == true) {
      el.blur()
    }
    el.disabled = disabled
  }
};
goog.dom.forms.focusAndSelect = function(el) {
  el.focus();
  if(el.select) {
    el.select()
  }
};
goog.dom.forms.hasValue = function(el) {
  var value = goog.dom.forms.getValue(el);
  return!!value
};
goog.dom.forms.hasValueByName = function(form, name) {
  var value = goog.dom.forms.getValueByName(form, name);
  return!!value
};
goog.dom.forms.getValue = function(el) {
  var type = el.type;
  if(!goog.isDef(type)) {
    return null
  }
  switch(type.toLowerCase()) {
    case "checkbox":
    ;
    case "radio":
      return goog.dom.forms.getInputChecked_(el);
    case "select-one":
      return goog.dom.forms.getSelectSingle_(el);
    case "select-multiple":
      return goog.dom.forms.getSelectMultiple_(el);
    default:
      return goog.isDef(el.value) ? el.value : null
  }
};
goog.dom.$F = goog.dom.forms.getValue;
goog.dom.forms.getValueByName = function(form, name) {
  var els = form.elements[name];
  if(els.type) {
    return goog.dom.forms.getValue(els)
  }else {
    for(var i = 0;i < els.length;i++) {
      var val = goog.dom.forms.getValue(els[i]);
      if(val) {
        return val
      }
    }
    return null
  }
};
goog.dom.forms.getInputChecked_ = function(el) {
  return el.checked ? el.value : null
};
goog.dom.forms.getSelectSingle_ = function(el) {
  var selectedIndex = el.selectedIndex;
  return selectedIndex >= 0 ? el.options[selectedIndex].value : null
};
goog.dom.forms.getSelectMultiple_ = function(el) {
  var values = [];
  for(var option, i = 0;option = el.options[i];i++) {
    if(option.selected) {
      values.push(option.value)
    }
  }
  return values.length ? values : null
};
goog.dom.forms.setValue = function(el, opt_value) {
  var type = el.type;
  if(goog.isDef(type)) {
    switch(type.toLowerCase()) {
      case "checkbox":
      ;
      case "radio":
        goog.dom.forms.setInputChecked_(el, opt_value);
        break;
      case "select-one":
        goog.dom.forms.setSelectSingle_(el, opt_value);
        break;
      case "select-multiple":
        goog.dom.forms.setSelectMultiple_(el, opt_value);
        break;
      default:
        el.value = goog.isDefAndNotNull(opt_value) ? opt_value : ""
    }
  }
};
goog.dom.forms.setInputChecked_ = function(el, opt_value) {
  el.checked = opt_value ? "checked" : null
};
goog.dom.forms.setSelectSingle_ = function(el, opt_value) {
  el.selectedIndex = -1;
  if(goog.isString(opt_value)) {
    for(var option, i = 0;option = el.options[i];i++) {
      if(option.value == opt_value) {
        option.selected = true;
        break
      }
    }
  }
};
goog.dom.forms.setSelectMultiple_ = function(el, opt_value) {
  if(goog.isString(opt_value)) {
    opt_value = [opt_value]
  }
  for(var option, i = 0;option = el.options[i];i++) {
    option.selected = false;
    if(opt_value) {
      for(var value, j = 0;value = opt_value[j];j++) {
        if(option.value == value) {
          option.selected = true
        }
      }
    }
  }
};
var array_p, dom_p, explode_p, ignore_p, key_prefix, map_p, namespace_tag, number_p, p, re_namespace_sep, re_svg_tags, re_tag, re_whitespace, string_p, unify_p, whitespace_node_p, xmlns, __hasProp = {}.hasOwnProperty;
goog.require("goog.string");
goog.provide("singult.coffee");
goog.provide("singult.coffee.Unify");
goog.provide("singult.coffee.Ignore");
p = function(x) {
  console.log(x);
  return x
};
re_tag = /([^\s\.#]+)(?:#([^\s\.#]+))?(?:\.([^\s#]+))?/;
re_svg_tags = /^(svg|g|rect|circle|clipPath|path|line|polygon|polyline|text|textPath)$/;
re_whitespace = /^\s+$/;
re_namespace_sep = /:(.+)/;
key_prefix = "\x00";
xmlns = {xhtml:"http://www.w3.org/1999/xhtml", xlink:"http://www.w3.org/1999/xlink", svg:"http://www.w3.org/2000/svg", xml:"http://www.w3.org/XML/1998/namespace", xmlns:"http://www.w3.org/2000/xmlns"};
namespace_tag = function(tag_str) {
  var nsp, tag, _ref;
  _ref = tag_str.split(":"), nsp = _ref[0], tag = _ref[1];
  if(tag != null) {
    return[xmlns[nsp] || nsp, tag]
  }else {
    if(tag_str.match(re_svg_tags)) {
      return[xmlns.svg, tag_str]
    }else {
      return[xmlns.xhtml, tag_str]
    }
  }
};
explode_p = function(v) {
  return v[0] === ":*:"
};
unify_p = function(x) {
  return x != null && x instanceof singult.coffee.Unify
};
ignore_p = function(x) {
  return x != null && x instanceof singult.coffee.Ignore
};
array_p = function(x) {
  return x != null && x.forEach != null
};
map_p = function(x) {
  return x != null && !array_p(x) && !unify_p(x) && !ignore_p(x) && x instanceof Object
};
dom_p = function(x) {
  return x != null && x.nodeType != null
};
string_p = function(x) {
  return x != null && x.substring != null
};
number_p = function(x) {
  return x != null && x.toFixed != null
};
whitespace_node_p = function($n) {
  return $n.nodeType === 8 || $n.nodeType === 3 && $n.textContent.match(re_whitespace)
};
singult.coffee.style = function($e, m) {
  var k, v, _results;
  _results = [];
  for(k in m) {
    if(!__hasProp.call(m, k)) {
      continue
    }
    v = m[k];
    _results.push($e.style[goog.string.toCamelCase(k)] = v)
  }
  return _results
};
singult.coffee.properties = function($e, m) {
  var prop, v, _results;
  _results = [];
  for(prop in m) {
    if(!__hasProp.call(m, prop)) {
      continue
    }
    v = m[prop];
    _results.push($e[prop] = v)
  }
  return _results
};
singult.coffee.attr = function($e, attr_map) {
  var attr, k, ns, v, _ref, _results;
  if(attr_map["style"] != null) {
    singult.coffee.style($e, attr_map["style"]);
    delete attr_map["style"]
  }
  if(attr_map["properties"] != null) {
    singult.coffee.properties($e, attr_map["properties"]);
    delete attr_map["properties"]
  }
  if(array_p(attr_map["class"])) {
    $e.setAttribute("class", attr_map["class"].join(" "));
    delete attr_map["class"]
  }
  _results = [];
  for(k in attr_map) {
    if(!__hasProp.call(attr_map, k)) {
      continue
    }
    v = attr_map[k];
    if(v != null) {
      _ref = k.split(re_namespace_sep), ns = _ref[0], attr = _ref[1];
      if(attr != null) {
        _results.push($e.setAttributeNS(xmlns[ns] || ns, attr, v))
      }else {
        _results.push($e.setAttribute(k, v))
      }
    }else {
      _results.push($e.removeAttribute(k))
    }
  }
  return _results
};
singult.coffee.node_data = function($e, d) {
  if(d != null) {
    return $e["__singult_data__"] = d
  }else {
    return $e["__singult_data__"]
  }
};
singult.coffee.canonicalize = function(x) {
  if(number_p(x)) {
    return x.toString()
  }else {
    if(array_p(x)) {
      return singult.coffee.canonicalize_hiccup(x)
    }else {
      return x
    }
  }
};
singult.coffee.canonicalize_hiccup = function(v) {
  var abbreviated_classes, attr, canonical, canonical_children, children, cls_str, id, nsp, tag, tag_str, _, _ref, _ref1, _ref2;
  tag = v[0];
  _ref = map_p(v[1]) ? [v[1], v.slice(2)] : [{}, v.slice(1)], attr = _ref[0], children = _ref[1];
  _ref1 = tag.match(re_tag), _ = _ref1[0], tag_str = _ref1[1], id = _ref1[2], cls_str = _ref1[3];
  if(id != null) {
    attr["id"] = id
  }
  if(cls_str != null) {
    abbreviated_classes = cls_str.split(".");
    if(array_p(attr["class"])) {
      attr["class"] = attr["class"].concat(abbreviated_classes)
    }else {
      if(string_p(attr["class"])) {
        attr["class"] = abbreviated_classes.concat([attr["class"]])
      }else {
        if(!(attr["class"] != null)) {
          attr["class"] = abbreviated_classes
        }
      }
    }
  }
  _ref2 = namespace_tag(tag_str), nsp = _ref2[0], tag = _ref2[1];
  canonical_children = [];
  children.forEach(function(v) {
    if(v != null) {
      if(explode_p(v)) {
        return v.slice(1).forEach(function(v) {
          return canonical_children.push(singult.coffee.canonicalize(v))
        })
      }else {
        return canonical_children.push(singult.coffee.canonicalize(v))
      }
    }
  });
  canonical = {nsp:nsp, tag:tag, attr:attr, children:canonical_children};
  return canonical
};
singult.coffee.render = function(m) {
  var $e, c;
  if(unify_p(m)) {
    throw new Error("Unify must be the first and only child of its parent.");
  }else {
    if(ignore_p(m)) {
      return null
    }else {
      if(string_p(m)) {
        return document.createTextNode(m)
      }else {
        if(dom_p(m)) {
          return m
        }else {
          $e = document.createElementNS(m.nsp, m.tag);
          singult.coffee.attr($e, m.attr);
          if(unify_p(c = m.children[0])) {
            if(c.enter != null) {
              c.data.forEach(function(d) {
                var $el;
                $el = c.enter(d);
                singult.coffee.node_data($el, d);
                return $e.appendChild($el)
              })
            }else {
              c.data.forEach(function(d) {
                var $el;
                $el = singult.coffee.render(singult.coffee.canonicalize(c.mapping(d)));
                singult.coffee.node_data($el, d);
                return $e.appendChild($el)
              })
            }
          }else {
            m.children.forEach(function(c) {
              var $c;
              $c = singult.coffee.render(c);
              if($c != null) {
                return $e.appendChild($c)
              }
            })
          }
          return $e
        }
      }
    }
  }
};
singult.coffee.Unify = function(data, mapping, key_fn, enter, update, exit, force_update_p) {
  this.data = data;
  this.mapping = mapping;
  this.key_fn = key_fn;
  this.enter = enter;
  this.update = update;
  this.exit = exit;
  this.force_update_p = force_update_p;
  return this
};
singult.coffee.Ignore = function() {
  return this
};
singult.coffee.unify_ = function($container, u) {
  var $n, $nodes, enter, exit, i, key, key_fn, nodes_by_key, update, _;
  enter = u.enter || function(d) {
    var $el;
    $el = singult.coffee.render(singult.coffee.canonicalize(u.mapping(d)));
    $container.appendChild($el);
    return $el
  };
  update = u.update || function($n, d) {
    return singult.coffee.merge($n, singult.coffee.canonicalize(u.mapping(d)))
  };
  exit = u.exit || function($n) {
    return $container.removeChild($n)
  };
  key_fn = u.key_fn || function(d, idx) {
    return idx
  };
  $nodes = $container.childNodes;
  nodes_by_key = {};
  i = 0;
  while(i < $nodes.length) {
    key = key_prefix + key_fn(singult.coffee.node_data($nodes[i]), i);
    nodes_by_key[key] = $nodes[i];
    i += 1
  }
  u.data.forEach(function(d, i) {
    var $el, $n, identical_data_p, old_data;
    key = key_prefix + key_fn(d, i);
    if($n = nodes_by_key[key]) {
      if(u.force_update_p) {
        $el = update($n, d);
        singult.coffee.node_data($el, d)
      }else {
        old_data = singult.coffee.node_data($n);
        identical_data_p = old_data.cljs$core$IEquiv$_equiv$arity$2 != null ? old_data.cljs$core$IEquiv$_equiv$arity$2(old_data, d) : old_data === d;
        if(!identical_data_p) {
          $el = update($n, d);
          singult.coffee.node_data($el, d)
        }
      }
      return delete nodes_by_key[key]
    }else {
      $el = enter(d);
      return singult.coffee.node_data($el, d)
    }
  });
  for(_ in nodes_by_key) {
    $n = nodes_by_key[_];
    exit($n)
  }
  return null
};
singult.coffee.merge = function($e, m) {
  var $c, c, i, _i, _j, _ref, _ref1;
  if(unify_p(m)) {
    singult.coffee.unify_($e, m)
  }else {
    if(ignore_p(m)) {
    }else {
      if($e.nodeName.toLowerCase() !== m.tag.toLowerCase()) {
        p($e);
        p(m);
        throw new Error("Cannot merge $e into node of different type");
      }
      singult.coffee.attr($e, m.attr);
      if($e.hasChildNodes()) {
        for(i = _i = _ref = $e.childNodes.length - 1;_ref <= 0 ? _i <= 0 : _i >= 0;i = _ref <= 0 ? ++_i : --_i) {
          $c = $e.childNodes[i];
          if(whitespace_node_p($c)) {
            $e.removeChild($c)
          }
        }
      }
      if(unify_p(m.children[0])) {
        singult.coffee.merge($e, m.children[0])
      }else {
        if($e.childNodes.length > m.children.length) {
          for(i = _j = _ref1 = $e.childNodes.length - 1;_ref1 <= 0 ? _j <= 0 : _j >= 0;i = _ref1 <= 0 ? ++_j : --_j) {
            $e.removeChild($e.childNodes[i])
          }
        }
        i = 0;
        while(i < m.children.length) {
          c = m.children[i] || "";
          $c = $e.childNodes[i];
          if(string_p(c)) {
            if($c != null) {
              $c.textContent = c
            }else {
              $e.appendChild(document.createTextNode(c))
            }
          }else {
            if(ignore_p(c)) {
            }else {
              if(map_p(c)) {
                if($c != null) {
                  singult.coffee.merge($c, c)
                }else {
                  $e.appendChild(singult.coffee.render(c))
                }
              }else {
                p($c);
                p(c);
                throw new Error("Cannot merge children");
              }
            }
          }
          i += 1
        }
      }
    }
  }
  return $e
};
goog.provide("singult.core");
goog.require("cljs.core");
goog.require("singult.coffee");
goog.provide("singult.core.Unify");
singult.core.Unify = function(data, mapping, key_fn, enter, update, exit, force_update_QMARK_, __meta, __extmap) {
  this.data = data;
  this.mapping = mapping;
  this.key_fn = key_fn;
  this.enter = enter;
  this.update = update;
  this.exit = exit;
  this.force_update_QMARK_ = force_update_QMARK_;
  this.__meta = __meta;
  this.__extmap = __extmap;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2229667594;
  if(arguments.length > 7) {
    this.__meta = __meta;
    this.__extmap = __extmap
  }else {
    this.__meta = null;
    this.__extmap = null
  }
};
singult.core.Unify.prototype.cljs$core$IHash$_hash$arity$1 = function(this__2467__auto__) {
  var self__ = this;
  var h__2335__auto__ = self__.__hash;
  if(!(h__2335__auto__ == null)) {
    return h__2335__auto__
  }else {
    var h__2335__auto____$1 = cljs.core.hash_imap.call(null, this__2467__auto__);
    self__.__hash = h__2335__auto____$1;
    return h__2335__auto____$1
  }
};
singult.core.Unify.prototype.cljs$core$ILookup$_lookup$arity$2 = function(this__2472__auto__, k__2473__auto__) {
  var self__ = this;
  return this__2472__auto__.cljs$core$ILookup$_lookup$arity$3(this__2472__auto__, k__2473__auto__, null)
};
singult.core.Unify.prototype.cljs$core$ILookup$_lookup$arity$3 = function(this__2474__auto__, k3822, else__2475__auto__) {
  var self__ = this;
  if(k3822 === "\ufdd0'data") {
    return self__.data
  }else {
    if(k3822 === "\ufdd0'mapping") {
      return self__.mapping
    }else {
      if(k3822 === "\ufdd0'key-fn") {
        return self__.key_fn
      }else {
        if(k3822 === "\ufdd0'enter") {
          return self__.enter
        }else {
          if(k3822 === "\ufdd0'update") {
            return self__.update
          }else {
            if(k3822 === "\ufdd0'exit") {
              return self__.exit
            }else {
              if(k3822 === "\ufdd0'force-update?") {
                return self__.force_update_QMARK_
              }else {
                if("\ufdd0'else") {
                  return cljs.core._lookup.call(null, self__.__extmap, k3822, else__2475__auto__)
                }else {
                  return null
                }
              }
            }
          }
        }
      }
    }
  }
};
singult.core.Unify.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(this__2479__auto__, k__2480__auto__, G__3821) {
  var self__ = this;
  var pred__3824 = cljs.core.identical_QMARK_;
  var expr__3825 = k__2480__auto__;
  if(pred__3824.call(null, "\ufdd0'data", expr__3825)) {
    return new singult.core.Unify(G__3821, self__.mapping, self__.key_fn, self__.enter, self__.update, self__.exit, self__.force_update_QMARK_, self__.__meta, self__.__extmap, null)
  }else {
    if(pred__3824.call(null, "\ufdd0'mapping", expr__3825)) {
      return new singult.core.Unify(self__.data, G__3821, self__.key_fn, self__.enter, self__.update, self__.exit, self__.force_update_QMARK_, self__.__meta, self__.__extmap, null)
    }else {
      if(pred__3824.call(null, "\ufdd0'key-fn", expr__3825)) {
        return new singult.core.Unify(self__.data, self__.mapping, G__3821, self__.enter, self__.update, self__.exit, self__.force_update_QMARK_, self__.__meta, self__.__extmap, null)
      }else {
        if(pred__3824.call(null, "\ufdd0'enter", expr__3825)) {
          return new singult.core.Unify(self__.data, self__.mapping, self__.key_fn, G__3821, self__.update, self__.exit, self__.force_update_QMARK_, self__.__meta, self__.__extmap, null)
        }else {
          if(pred__3824.call(null, "\ufdd0'update", expr__3825)) {
            return new singult.core.Unify(self__.data, self__.mapping, self__.key_fn, self__.enter, G__3821, self__.exit, self__.force_update_QMARK_, self__.__meta, self__.__extmap, null)
          }else {
            if(pred__3824.call(null, "\ufdd0'exit", expr__3825)) {
              return new singult.core.Unify(self__.data, self__.mapping, self__.key_fn, self__.enter, self__.update, G__3821, self__.force_update_QMARK_, self__.__meta, self__.__extmap, null)
            }else {
              if(pred__3824.call(null, "\ufdd0'force-update?", expr__3825)) {
                return new singult.core.Unify(self__.data, self__.mapping, self__.key_fn, self__.enter, self__.update, self__.exit, G__3821, self__.__meta, self__.__extmap, null)
              }else {
                return new singult.core.Unify(self__.data, self__.mapping, self__.key_fn, self__.enter, self__.update, self__.exit, self__.force_update_QMARK_, self__.__meta, cljs.core.assoc.call(null, self__.__extmap, k__2480__auto__, G__3821), null)
              }
            }
          }
        }
      }
    }
  }
};
singult.core.Unify.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(this__2486__auto__, writer__2487__auto__, opts__2488__auto__) {
  var self__ = this;
  var pr_pair__2489__auto__ = function(keyval__2490__auto__) {
    return cljs.core.pr_sequential_writer.call(null, writer__2487__auto__, cljs.core.pr_writer, "", " ", "", opts__2488__auto__, keyval__2490__auto__)
  };
  return cljs.core.pr_sequential_writer.call(null, writer__2487__auto__, pr_pair__2489__auto__, [cljs.core.str("#"), cljs.core.str("Unify"), cljs.core.str("{")].join(""), ", ", "}", opts__2488__auto__, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'data", self__.data), cljs.core.vector.call(null, "\ufdd0'mapping", self__.mapping), cljs.core.vector.call(null, "\ufdd0'key-fn", self__.key_fn), cljs.core.vector.call(null, "\ufdd0'enter", self__.enter), 
  cljs.core.vector.call(null, "\ufdd0'update", self__.update), cljs.core.vector.call(null, "\ufdd0'exit", self__.exit), cljs.core.vector.call(null, "\ufdd0'force-update?", self__.force_update_QMARK_)], true), self__.__extmap))
};
singult.core.Unify.prototype.cljs$core$ICollection$_conj$arity$2 = function(this__2477__auto__, entry__2478__auto__) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry__2478__auto__)) {
    return this__2477__auto__.cljs$core$IAssociative$_assoc$arity$3(this__2477__auto__, cljs.core._nth.call(null, entry__2478__auto__, 0), cljs.core._nth.call(null, entry__2478__auto__, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, this__2477__auto__, entry__2478__auto__)
  }
};
singult.core.Unify.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this__2484__auto__) {
  var self__ = this;
  return cljs.core.seq.call(null, cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([cljs.core.vector.call(null, "\ufdd0'data", self__.data), cljs.core.vector.call(null, "\ufdd0'mapping", self__.mapping), cljs.core.vector.call(null, "\ufdd0'key-fn", self__.key_fn), cljs.core.vector.call(null, "\ufdd0'enter", self__.enter), cljs.core.vector.call(null, "\ufdd0'update", self__.update), cljs.core.vector.call(null, "\ufdd0'exit", self__.exit), cljs.core.vector.call(null, "\ufdd0'force-update?", 
  self__.force_update_QMARK_)], true), self__.__extmap))
};
singult.core.Unify.prototype.cljs$core$ICounted$_count$arity$1 = function(this__2476__auto__) {
  var self__ = this;
  return 7 + cljs.core.count.call(null, self__.__extmap)
};
singult.core.Unify.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(this__2468__auto__, other__2469__auto__) {
  var self__ = this;
  if(cljs.core.truth_(function() {
    var and__3941__auto__ = other__2469__auto__;
    if(cljs.core.truth_(and__3941__auto__)) {
      var and__3941__auto____$1 = this__2468__auto__.constructor === other__2469__auto__.constructor;
      if(and__3941__auto____$1) {
        return cljs.core.equiv_map.call(null, this__2468__auto__, other__2469__auto__)
      }else {
        return and__3941__auto____$1
      }
    }else {
      return and__3941__auto__
    }
  }())) {
    return true
  }else {
    return false
  }
};
singult.core.Unify.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(this__2471__auto__, G__3821) {
  var self__ = this;
  return new singult.core.Unify(self__.data, self__.mapping, self__.key_fn, self__.enter, self__.update, self__.exit, self__.force_update_QMARK_, G__3821, self__.__extmap, self__.__hash)
};
singult.core.Unify.prototype.cljs$core$IMeta$_meta$arity$1 = function(this__2470__auto__) {
  var self__ = this;
  return self__.__meta
};
singult.core.Unify.prototype.cljs$core$IMap$_dissoc$arity$2 = function(this__2481__auto__, k__2482__auto__) {
  var self__ = this;
  if(cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray(["\ufdd0'data", "\ufdd0'force-update?", "\ufdd0'enter", "\ufdd0'exit", "\ufdd0'key-fn", "\ufdd0'update", "\ufdd0'mapping"]), k__2482__auto__)) {
    return cljs.core.dissoc.call(null, cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, this__2481__auto__), self__.__meta), k__2482__auto__)
  }else {
    return new singult.core.Unify(self__.data, self__.mapping, self__.key_fn, self__.enter, self__.update, self__.exit, self__.force_update_QMARK_, self__.__meta, cljs.core.not_empty.call(null, cljs.core.dissoc.call(null, self__.__extmap, k__2482__auto__)), null)
  }
};
singult.core.Unify.cljs$lang$type = true;
singult.core.Unify.cljs$lang$ctorPrSeq = function(this__2507__auto__) {
  return cljs.core.list.call(null, "singult.core/Unify")
};
singult.core.Unify.cljs$lang$ctorPrWriter = function(this__2507__auto__, writer__2508__auto__) {
  return cljs.core._write.call(null, writer__2508__auto__, "singult.core/Unify")
};
singult.core.__GT_Unify = function __GT_Unify(data, mapping, key_fn, enter, update, exit, force_update_QMARK_) {
  return new singult.core.Unify(data, mapping, key_fn, enter, update, exit, force_update_QMARK_)
};
singult.core.map__GT_Unify = function map__GT_Unify(G__3823) {
  return new singult.core.Unify((new cljs.core.Keyword("\ufdd0'data")).call(null, G__3823), (new cljs.core.Keyword("\ufdd0'mapping")).call(null, G__3823), (new cljs.core.Keyword("\ufdd0'key-fn")).call(null, G__3823), (new cljs.core.Keyword("\ufdd0'enter")).call(null, G__3823), (new cljs.core.Keyword("\ufdd0'update")).call(null, G__3823), (new cljs.core.Keyword("\ufdd0'exit")).call(null, G__3823), (new cljs.core.Keyword("\ufdd0'force-update?")).call(null, G__3823), null, cljs.core.dissoc.call(null, 
  G__3823, "\ufdd0'data", "\ufdd0'mapping", "\ufdd0'key-fn", "\ufdd0'enter", "\ufdd0'update", "\ufdd0'exit", "\ufdd0'force-update?"))
};
singult.core.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.instance_QMARK_.call(null, singult.core.Unify, x)) {
    var map__3833 = x;
    var map__3833__$1 = cljs.core.seq_QMARK_.call(null, map__3833) ? cljs.core.apply.call(null, cljs.core.hash_map, map__3833) : map__3833;
    var force_update_QMARK_ = cljs.core._lookup.call(null, map__3833__$1, "\ufdd0'force-update?", null);
    var exit = cljs.core._lookup.call(null, map__3833__$1, "\ufdd0'exit", null);
    var update = cljs.core._lookup.call(null, map__3833__$1, "\ufdd0'update", null);
    var enter = cljs.core._lookup.call(null, map__3833__$1, "\ufdd0'enter", null);
    var key_fn = cljs.core._lookup.call(null, map__3833__$1, "\ufdd0'key-fn", null);
    var mapping = cljs.core._lookup.call(null, map__3833__$1, "\ufdd0'mapping", null);
    var data = cljs.core._lookup.call(null, map__3833__$1, "\ufdd0'data", null);
    var data_arr = function() {
      var a = [];
      var G__3834_3839 = cljs.core.seq.call(null, data);
      while(true) {
        if(G__3834_3839) {
          var d_3840 = cljs.core.first.call(null, G__3834_3839);
          a.push(d_3840);
          var G__3841 = cljs.core.next.call(null, G__3834_3839);
          G__3834_3839 = G__3841;
          continue
        }else {
        }
        break
      }
      return a
    }();
    return new singult.coffee.Unify(data_arr, function(p1__3820_SHARP_) {
      return clj__GT_js.call(null, mapping.call(null, p1__3820_SHARP_))
    }, key_fn, enter, update, exit, force_update_QMARK_)
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        var o = {};
        var G__3835_3842 = cljs.core.seq.call(null, x);
        while(true) {
          if(G__3835_3842) {
            var vec__3836_3843 = cljs.core.first.call(null, G__3835_3842);
            var k_3844 = cljs.core.nth.call(null, vec__3836_3843, 0, null);
            var v_3845 = cljs.core.nth.call(null, vec__3836_3843, 1, null);
            var key_3846 = clj__GT_js.call(null, k_3844);
            if(cljs.core.string_QMARK_.call(null, key_3846)) {
            }else {
              throw"Cannot convert; JavaScript map keys must be strings";
            }
            o[key_3846] = clj__GT_js.call(null, v_3845);
            var G__3847 = cljs.core.next.call(null, G__3835_3842);
            G__3835_3842 = G__3847;
            continue
          }else {
          }
          break
        }
        return o
      }else {
        if(cljs.core.seq_QMARK_.call(null, x)) {
          var a = [];
          a.push(":*:");
          var G__3837_3848 = cljs.core.seq.call(null, x);
          while(true) {
            if(G__3837_3848) {
              var item_3849 = cljs.core.first.call(null, G__3837_3848);
              a.push(clj__GT_js.call(null, item_3849));
              var G__3850 = cljs.core.next.call(null, G__3837_3848);
              G__3837_3848 = G__3850;
              continue
            }else {
            }
            break
          }
          return a
        }else {
          if(cljs.core.coll_QMARK_.call(null, x)) {
            var a = [];
            var G__3838_3851 = cljs.core.seq.call(null, x);
            while(true) {
              if(G__3838_3851) {
                var item_3852 = cljs.core.first.call(null, G__3838_3851);
                a.push(clj__GT_js.call(null, item_3852));
                var G__3853 = cljs.core.next.call(null, G__3838_3851);
                G__3838_3851 = G__3853;
                continue
              }else {
              }
              break
            }
            return a
          }else {
            if("\ufdd0'else") {
              return x
            }else {
              return null
            }
          }
        }
      }
    }
  }
};
singult.core.node_data = singult.coffee.node_data;
singult.core.attr = function attr($n, m) {
  return singult.coffee.attr.call(null, $n, singult.core.clj__GT_js.call(null, m))
};
singult.core.render = function render(v) {
  return singult.coffee.render.call(null, singult.coffee.canonicalize.call(null, singult.core.clj__GT_js.call(null, v)))
};
singult.core.merge_BANG_ = function merge_BANG_($n, v) {
  if(v == null) {
    return null
  }else {
    return singult.coffee.merge.call(null, $n, singult.coffee.canonicalize.call(null, singult.core.clj__GT_js.call(null, v)))
  }
};
singult.core.unify = function() {
  var unify__delegate = function(data, mapping, p__3854) {
    var map__3856 = p__3854;
    var map__3856__$1 = cljs.core.seq_QMARK_.call(null, map__3856) ? cljs.core.apply.call(null, cljs.core.hash_map, map__3856) : map__3856;
    var force_update_QMARK_ = cljs.core._lookup.call(null, map__3856__$1, "\ufdd0'force-update?", null);
    var exit = cljs.core._lookup.call(null, map__3856__$1, "\ufdd0'exit", null);
    var update = cljs.core._lookup.call(null, map__3856__$1, "\ufdd0'update", null);
    var enter = cljs.core._lookup.call(null, map__3856__$1, "\ufdd0'enter", null);
    var key_fn = cljs.core._lookup.call(null, map__3856__$1, "\ufdd0'key-fn", null);
    return new singult.core.Unify(data, mapping, key_fn, enter, update, exit, force_update_QMARK_)
  };
  var unify = function(data, mapping, var_args) {
    var p__3854 = null;
    if(goog.isDef(var_args)) {
      p__3854 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return unify__delegate.call(this, data, mapping, p__3854)
  };
  unify.cljs$lang$maxFixedArity = 2;
  unify.cljs$lang$applyTo = function(arglist__3857) {
    var data = cljs.core.first(arglist__3857);
    var mapping = cljs.core.first(cljs.core.next(arglist__3857));
    var p__3854 = cljs.core.rest(cljs.core.next(arglist__3857));
    return unify__delegate(data, mapping, p__3854)
  };
  unify.cljs$lang$arity$variadic = unify__delegate;
  return unify
}();
singult.core.ignore = function ignore() {
  return new singult.coffee.Ignore
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__$1 = s;
      var limit__$1 = limit;
      var parts = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__$1, 1)) {
          return cljs.core.conj.call(null, parts, s__$1)
        }else {
          var temp__4090__auto__ = cljs.core.re_find.call(null, re, s__$1);
          if(cljs.core.truth_(temp__4090__auto__)) {
            var m = temp__4090__auto__;
            var index = s__$1.indexOf(m);
            var G__3813 = s__$1.substring(index + cljs.core.count.call(null, m));
            var G__3814 = limit__$1 - 1;
            var G__3815 = cljs.core.conj.call(null, parts, s__$1.substring(0, index));
            s__$1 = G__3813;
            limit__$1 = G__3814;
            parts = G__3815;
            continue
          }else {
            return cljs.core.conj.call(null, parts, s__$1)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index = s.length;
  while(true) {
    if(index === 0) {
      return""
    }else {
      var ch = cljs.core._lookup.call(null, s, index - 1, null);
      if(function() {
        var or__3943__auto__ = cljs.core._EQ_.call(null, ch, "\n");
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return cljs.core._EQ_.call(null, ch, "\r")
        }
      }()) {
        var G__3816 = index - 1;
        index = G__3816;
        continue
      }else {
        return s.substring(0, index)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  return goog.string.isEmptySafe(s)
};
clojure.string.escape = function escape(s, cmap) {
  var buffer = new goog.string.StringBuffer;
  var length = s.length;
  var index = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length, index)) {
      return buffer.toString()
    }else {
      var ch = s.charAt(index);
      var temp__4090__auto___3817 = cljs.core._lookup.call(null, cmap, ch, null);
      if(cljs.core.truth_(temp__4090__auto___3817)) {
        var replacement_3818 = temp__4090__auto___3817;
        buffer.append([cljs.core.str(replacement_3818)].join(""))
      }else {
        buffer.append(ch)
      }
      var G__3819 = index + 1;
      index = G__3819;
      continue
    }
    break
  }
};
goog.provide("c2.dom");
goog.require("cljs.core");
goog.require("goog.style");
goog.require("goog.dom.classes");
goog.require("goog.dom.forms");
goog.require("goog.dom");
goog.require("singult.core");
goog.require("clojure.string");
Element.prototype.matchesSelector = Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.oMatchesSelector;
if(cljs.core.truth_(typeof NodeList != "undefined")) {
  NodeList.prototype.cljs$core$ISeqable$ = true;
  NodeList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(array) {
    return cljs.core.array_seq.call(null, array, 0)
  }
}else {
}
HTMLCollection.prototype.cljs$core$ISeqable$ = true;
HTMLCollection.prototype.cljs$core$ISeqable$_seq$arity$1 = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
c2.dom.IDom = {};
c2.dom.__GT_dom = function __GT_dom(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.c2$dom$IDom$__GT_dom$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.c2$dom$IDom$__GT_dom$arity$1(x)
  }else {
    var x__2514__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = c2.dom.__GT_dom[goog.typeOf(x__2514__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = c2.dom.__GT_dom["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDom.->dom", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core.PersistentVector.prototype.c2$dom$IDom$ = true;
cljs.core.PersistentVector.prototype.c2$dom$IDom$__GT_dom$arity$1 = function(v) {
  return singult.core.render.call(null, v)
};
c2.dom.IDom["string"] = true;
c2.dom.__GT_dom["string"] = function(selector) {
  return c2.dom.select.call(null, selector)
};
if(cljs.core.truth_(typeof Node != "undefined")) {
  Node.prototype.c2$dom$IDom$ = true;
  Node.prototype.c2$dom$IDom$__GT_dom$arity$1 = function(node) {
    return node
  }
}else {
}
c2.dom.select = function() {
  var select = null;
  var select__1 = function(selector) {
    return document.querySelector(selector)
  };
  var select__2 = function(selector, container) {
    return c2.dom.__GT_dom.call(null, container).querySelector(selector)
  };
  select = function(selector, container) {
    switch(arguments.length) {
      case 1:
        return select__1.call(this, selector);
      case 2:
        return select__2.call(this, selector, container)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  select.cljs$lang$arity$1 = select__1;
  select.cljs$lang$arity$2 = select__2;
  return select
}();
c2.dom.select_all = function() {
  var select_all = null;
  var select_all__1 = function(selector) {
    return document.querySelectorAll(selector)
  };
  var select_all__2 = function(selector, container) {
    return c2.dom.__GT_dom.call(null, container).querySelectorAll(selector)
  };
  select_all = function(selector, container) {
    switch(arguments.length) {
      case 1:
        return select_all__1.call(this, selector);
      case 2:
        return select_all__2.call(this, selector, container)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  select_all.cljs$lang$arity$1 = select_all__1;
  select_all.cljs$lang$arity$2 = select_all__2;
  return select_all
}();
c2.dom.matches_selector_QMARK_ = function matches_selector_QMARK_(node, selector) {
  return node.matchesSelector(selector)
};
c2.dom.children = function children(node) {
  return c2.dom.__GT_dom.call(null, node).children
};
c2.dom.parent = function parent(node) {
  return c2.dom.__GT_dom.call(null, node).parentNode
};
c2.dom.append_BANG_ = function append_BANG_(container, el) {
  var el__$1 = c2.dom.__GT_dom.call(null, el);
  goog.dom.appendChild(c2.dom.__GT_dom.call(null, container), el__$1);
  return el__$1
};
c2.dom.prepend_BANG_ = function prepend_BANG_(container, el) {
  var el__$1 = c2.dom.__GT_dom.call(null, el);
  goog.dom.insertChildAt(c2.dom.__GT_dom.call(null, container), el__$1, 0);
  return el__$1
};
c2.dom.remove_BANG_ = function remove_BANG_(el) {
  return goog.dom.removeNode(c2.dom.__GT_dom.call(null, el))
};
c2.dom.replace_BANG_ = function replace_BANG_(old, new$) {
  var new$__$1 = c2.dom.__GT_dom.call(null, new$);
  goog.dom.replaceNode(new$__$1, c2.dom.__GT_dom.call(null, old));
  return new$__$1
};
c2.dom.style = function() {
  var style = null;
  var style__1 = function(el) {
    throw new Error("TODO: return map of element styles");
  };
  var style__2 = function(el, x) {
    var el__$1 = c2.dom.__GT_dom.call(null, el);
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return goog.style.getComputedStyle(el__$1, cljs.core.name.call(null, x))
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        var G__3792_3794 = cljs.core.seq.call(null, x);
        while(true) {
          if(G__3792_3794) {
            var vec__3793_3795 = cljs.core.first.call(null, G__3792_3794);
            var k_3796 = cljs.core.nth.call(null, vec__3793_3795, 0, null);
            var v_3797 = cljs.core.nth.call(null, vec__3793_3795, 1, null);
            style.call(null, el__$1, k_3796, v_3797);
            var G__3798 = cljs.core.next.call(null, G__3792_3794);
            G__3792_3794 = G__3798;
            continue
          }else {
          }
          break
        }
        return el__$1
      }else {
        return null
      }
    }
  };
  var style__3 = function(el, k, v) {
    goog.style.setStyle(c2.dom.__GT_dom.call(null, el), cljs.core.name.call(null, k), cljs.core.string_QMARK_.call(null, v) ? v : cljs.core.number_QMARK_.call(null, v) ? cljs.core.truth_(cljs.core.PersistentHashSet.fromArray(["\ufdd0'bottom", "\ufdd0'width", "\ufdd0'top", "\ufdd0'right", "\ufdd0'left", "\ufdd0'height"]).call(null, cljs.core.keyword.call(null, k))) ? [cljs.core.str(v), cljs.core.str("px")].join("") : v : null);
    return el
  };
  style = function(el, k, v) {
    switch(arguments.length) {
      case 1:
        return style__1.call(this, el);
      case 2:
        return style__2.call(this, el, k);
      case 3:
        return style__3.call(this, el, k, v)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  style.cljs$lang$arity$1 = style__1;
  style.cljs$lang$arity$2 = style__2;
  style.cljs$lang$arity$3 = style__3;
  return style
}();
c2.dom.attr = function() {
  var attr = null;
  var attr__1 = function(el) {
    var attrs = c2.dom.__GT_dom.call(null, el).attributes;
    return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
      var iter__2611__auto__ = function iter__3803(s__3804) {
        return new cljs.core.LazySeq(null, false, function() {
          var s__3804__$1 = s__3804;
          while(true) {
            var temp__4092__auto__ = cljs.core.seq.call(null, s__3804__$1);
            if(temp__4092__auto__) {
              var xs__4579__auto__ = temp__4092__auto__;
              var i = cljs.core.first.call(null, xs__4579__auto__);
              return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, attrs[i].name), attrs[i].value], true), iter__3803.call(null, cljs.core.rest.call(null, s__3804__$1)))
            }else {
              return null
            }
            break
          }
        }, null)
      };
      return iter__2611__auto__.call(null, cljs.core.range.call(null, attrs.length))
    }())
  };
  var attr__2 = function(el, x) {
    var el__$1 = c2.dom.__GT_dom.call(null, el);
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return el__$1.getAttribute(cljs.core.name.call(null, x))
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        var G__3805_3807 = cljs.core.seq.call(null, x);
        while(true) {
          if(G__3805_3807) {
            var vec__3806_3808 = cljs.core.first.call(null, G__3805_3807);
            var k_3809 = cljs.core.nth.call(null, vec__3806_3808, 0, null);
            var v_3810 = cljs.core.nth.call(null, vec__3806_3808, 1, null);
            attr.call(null, el__$1, k_3809, v_3810);
            var G__3811 = cljs.core.next.call(null, G__3805_3807);
            G__3805_3807 = G__3811;
            continue
          }else {
          }
          break
        }
        return el__$1
      }else {
        return null
      }
    }
  };
  var attr__3 = function(el, k, v) {
    var el__$1 = c2.dom.__GT_dom.call(null, el);
    if(v == null) {
      el__$1.removeAttribute(cljs.core.name.call(null, k))
    }else {
      if(cljs.core._EQ_.call(null, "\ufdd0'style", k)) {
        c2.dom.style.call(null, el__$1, v)
      }else {
        el__$1.setAttribute(cljs.core.name.call(null, k), v)
      }
    }
    return el__$1
  };
  attr = function(el, k, v) {
    switch(arguments.length) {
      case 1:
        return attr__1.call(this, el);
      case 2:
        return attr__2.call(this, el, k);
      case 3:
        return attr__3.call(this, el, k, v)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  attr.cljs$lang$arity$1 = attr__1;
  attr.cljs$lang$arity$2 = attr__2;
  attr.cljs$lang$arity$3 = attr__3;
  return attr
}();
c2.dom.text = function() {
  var text = null;
  var text__1 = function(el) {
    return goog.dom.getTextContent(c2.dom.__GT_dom.call(null, el))
  };
  var text__2 = function(el, v) {
    var el__$1 = c2.dom.__GT_dom.call(null, el);
    goog.dom.setTextContent(el__$1, v);
    return el__$1
  };
  text = function(el, v) {
    switch(arguments.length) {
      case 1:
        return text__1.call(this, el);
      case 2:
        return text__2.call(this, el, v)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  text.cljs$lang$arity$1 = text__1;
  text.cljs$lang$arity$2 = text__2;
  return text
}();
c2.dom.val = function() {
  var val = null;
  var val__1 = function(el) {
    return goog.dom.forms.getValue(c2.dom.__GT_dom.call(null, el))
  };
  var val__2 = function(el, v) {
    var el__$1 = c2.dom.__GT_dom.call(null, el);
    goog.dom.forms.setValue(el__$1, v);
    return el__$1
  };
  val = function(el, v) {
    switch(arguments.length) {
      case 1:
        return val__1.call(this, el);
      case 2:
        return val__2.call(this, el, v)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  val.cljs$lang$arity$1 = val__1;
  val.cljs$lang$arity$2 = val__2;
  return val
}();
c2.dom.classed_BANG_ = function classed_BANG_(el, class$, classed_QMARK_) {
  goog.dom.classes.enable(c2.dom.__GT_dom.call(null, el), cljs.core.name.call(null, class$), classed_QMARK_);
  return el
};
c2.dom.add_class_BANG_ = function add_class_BANG_(el, class$) {
  return c2.dom.classed_BANG_.call(null, el, class$, true)
};
c2.dom.remove_class_BANG_ = function remove_class_BANG_(el, class$) {
  return c2.dom.classed_BANG_.call(null, el, class$, false)
};
c2.dom.request_animation_frame = function() {
  var or__3943__auto__ = window.requestAnimationFrame;
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    var or__3943__auto____$1 = window.webkitRequestAnimationFrame;
    if(cljs.core.truth_(or__3943__auto____$1)) {
      return or__3943__auto____$1
    }else {
      return function(p1__3812_SHARP_) {
        return setTimeout(function() {
          return p1__3812_SHARP_.call(null)
        }, 10)
      }
    }
  }
}();
goog.provide("c2.core");
goog.require("cljs.core");
goog.require("reflex.core");
goog.require("c2.dom");
goog.require("singult.core");
c2.core.node_data = singult.core.node_data;
c2.core.unify = function() {
  var unify__delegate = function(data, mapping, args) {
    if(cljs.core.seq.call(null, data)) {
      mapping.call(null, cljs.core.first.call(null, data))
    }else {
    }
    return cljs.core.apply.call(null, singult.core.unify, data, mapping, args)
  };
  var unify = function(data, mapping, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return unify__delegate.call(this, data, mapping, args)
  };
  unify.cljs$lang$maxFixedArity = 2;
  unify.cljs$lang$applyTo = function(arglist__3789) {
    var data = cljs.core.first(arglist__3789);
    var mapping = cljs.core.first(cljs.core.next(arglist__3789));
    var args = cljs.core.rest(cljs.core.next(arglist__3789));
    return unify__delegate(data, mapping, args)
  };
  unify.cljs$lang$arity$variadic = unify__delegate;
  return unify
}();
goog.provide("visualizer");
goog.require("cljs.core");
goog.require("c2.core");
goog.require("hiccup.core");
goog.require("c2.scale");
goog.require("hiccup.core");
goog.require("c2.core");
visualizer.i = $("#input");
visualizer.conn = new WebSocket("ws://localhost:8080/qgame");
visualizer.conn.onerror = function() {
  alert("error");
  return console.log(arguments)
};
visualizer.conn.onmessage = function(e) {
  console.log(e);
  var prob_A = JSON.parse(e.data).a;
  var prob_B = JSON.parse(e.data).b;
  var width = 100;
  var bar_height = 100;
  var data = cljs.core.ObjMap.fromObject(["A", "B"], {"A":prob_A, "B":prob_B});
  var s = c2.scale.linear.call(null, "\ufdd0'domain", cljs.core.PersistentVector.fromArray([0, bar_height], true), "\ufdd0'range", cljs.core.PersistentVector.fromArray([0, width], true));
  return $("#bars").html(hiccup.core.html.call(null, c2.core.unify.call(null, data, function(p__3092) {
    var vec__3093 = p__3092;
    var label = cljs.core.nth.call(null, vec__3093, 0, null);
    var prob = cljs.core.nth.call(null, vec__3093, 1, null);
    return cljs.core.PersistentVector.fromArray(["\ufdd0'div", cljs.core.ObjMap.fromObject(["\ufdd0'style"], {"\ufdd0'style":cljs.core.ObjMap.fromObject(["\ufdd0'height", "\ufdd0'width", "\ufdd0'background-color"], {"\ufdd0'height":bar_height, "\ufdd0'width":s.call(null, prob), "\ufdd0'background-color":"gray"})}), cljs.core.PersistentVector.fromArray(["\ufdd0'span", cljs.core.ObjMap.fromObject(["\ufdd0'style"], {"\ufdd0'style":cljs.core.ObjMap.fromObject(["\ufdd0'color"], {"\ufdd0'color":"white"})}), 
    label], true)], true)
  })))
};
visualizer.send_instruction = function send_instruction() {
  console.log("sending...");
  return visualizer.conn.send(visualizer.i.val())
};
$("#send").click(visualizer.send_instruction);
visualizer.i.focus().keyup(function(e) {
  if(cljs.core._EQ_.call(null, e.which, 13)) {
    return visualizer.send_instruction.call(null)
  }else {
    return null
  }
});
