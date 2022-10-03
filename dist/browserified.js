(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function createElements (execlib, applib, mylib) {
  'use strict';

  require('./managercreator')(execlib.lib, applib, mylib);

}
module.exports = createElements;

},{"./managercreator":5}],2:[function(require,module,exports){
function createJobCores(lib) {
  'use strict';
  var mylib = {};

  require('./onmanagercreator')(lib, mylib);
  require('./windowcreatorcreator')(lib, mylib);

  return mylib;
}
module.exports = createJobCores;
},{"./onmanagercreator":3,"./windowcreatorcreator":4}],3:[function(require,module,exports){
function createOnManagerJobCore (lib, mylib) {
  'use strict';

  function OnManagerJobCore (manager) {
    this.manager = manager;
  }
  OnManagerJobCore.prototype.destroy = function () {
    this.manager = null;
  }
  OnManagerJobCore.prototype.shouldContinue = function () {
    if (!this.manager) {
      return new lib.Error('NO_WINDOW_MANAGER', 'No WindowManager for '+this.constructor.name);
    }
    if (!this.manager.windowNeeded) {
      return new lib.Error('WINDOW_MANAGER_ALREADY_DESTROYED', 'WindowManager is already destroyed for '+this.constructor.name);
    }
  };

  mylib.Base = OnManagerJobCore;
}
module.exports = createOnManagerJobCore;
},{}],4:[function(require,module,exports){
function createWindowCreatorJobCore (lib, mylib) {
  'use strict';

  var Base = mylib.Base;

  function WindowCreatorJobCore (manager, sessioncloner, createparams) {
    Base.call(this, manager);
    this.cloner = sessioncloner;
    this.createparams = createparams;
    this.sessionid = null;
  }
  lib.inherit(WindowCreatorJobCore, Base);
  WindowCreatorJobCore.prototype.destroy = function () {
    this.sessionid = null;
    this.createparams;
    this.cloner = null;
    Base.prototype.destroy.call(this);
  };
  WindowCreatorJobCore.prototype.shouldContinue = function () {
    var ret = Base.prototype.shouldContinue.call(this);
    if (ret) {
      return ret;
    }
    if (!(this.createparams && 'footprint' in this.createparams)) {
      return new lib.Error('NO_CREATION_FOOTPRINT', this.constructor.name+' needs a footprint in creationparams');
    }
    if (!lib.isFunction(this.cloner)) {
      return new lib.Error('SESSION_CLONER_NOT_A_FUNCTION', this.constructor.name+' needs a session cloner function');
    }
  };

  WindowCreatorJobCore.prototype.checkWindow = function () {
    return this.manager.windows.get(this.createparams.footprint);
  };
  WindowCreatorJobCore.prototype.onCheckWindow = function (window) {
    this.handleWindow(window);
  };
  WindowCreatorJobCore.prototype.cloneSession = function () {
    if (this.windowFound) {
      return;
    }
    return this.cloner();
  };
  WindowCreatorJobCore.prototype.onCloneSession = function (sessobj) {
    if (this.windowFound) {
      return;
    }
    if (!(sessobj && sessobj.session)) {
      throw new lib.Error('CLONESESSION_RESPONSE_INVALID');
    }
    this.sessionid = sessobj.session;
  };
  WindowCreatorJobCore.prototype.createWindow = function () {
    var url = lib.joinStringsWith(
      (this.createparams.host || (window.location.origin+window.location.pathname))+
      '?allexsessionid='+this.sessionid
      ,
      (this.createparams.query ? 'allexquery='+this.createparams.query : '')
      ,
      '&'
    );
    var target = this.createparams.target || '_blank';
    var features = '';
    lib.joinStringsWith(features, this.createparams.left ? 'left='+this.createparams.left : '', ',');
    lib.joinStringsWith(features, this.createparams.top ? 'top='+this.createparams.top : '', ',');
    lib.joinStringsWith(features, this.createparams.width ? 'width='+this.createparams.width : '', ',');
    lib.joinStringsWith(features, this.createparams.height ? 'height='+this.createparams.height : '', ',');
    lib.joinStringsWith(features, this.createparams.popup ? 'popup' : '', ',');
      
    return window.open(
      url,
      target,
      features
    );
  };
  WindowCreatorJobCore.prototype.onCreateWindow = function (window) {
    this.handleWindow(window);
  };

  WindowCreatorJobCore.prototype.steps = [
    'checkWindow',
    'onCheckWindow',
    'cloneSession',
    'onCloneSession',
    'createWindow',
    'onCreateWindow'
  ];

  WindowCreatorJobCore.prototype.handleWindow = function (window) {
    this.windowFound = window;
    if (this.windowFound) {
      this.windowFound.focus();
    }
  };

  mylib.WindowCreator = WindowCreatorJobCore;
}
module.exports = createWindowCreatorJobCore;
},{}],5:[function(require,module,exports){
function createWindowManagerElement (lib, applib, mylib) {
  'use strict';
  var BasicElement = applib.getElementType('BasicElement'),
    qlib = lib.qlib;
  var jobcores = require('./jobcores')(lib);

  function WindowManagerElement (id, options) {
    BasicElement.call(this, id, options);
    this.windowNeeded = this.createBufferableHookCollection();
    this.windows = new lib.Map();
  }
  lib.inherit(WindowManagerElement, BasicElement);
  WindowManagerElement.prototype.__cleanUp = function () {
    if (this.windows) {
      this.windows.destroy();
    }
    this.windows = null;
    if (this.windowNeeded) {
      this.windowNeeded.destroy();
    }
    this.windowNeeded = null;
    BasicElement.prototype.__cleanUp.call(this);
  };

  WindowManagerElement.prototype.staticEnvironmentDescriptor = function (myname) {
    return {
      logic: [{
        triggers: 'element.'+myname+'!windowNeeded',
        references: 'environment.'+this.getConfigVal('environmentname')+'>cloneMySession',
        handler: this.onWindowNeeded.bind(this)
      }]
    };
  };

  WindowManagerElement.prototype.createWindow = function (createobj) {
    if (!this.windowNeeded) {
      return;
    }
    //let it throw
    this.windowNeeded.fire({
      host: createobj.host,
      footprint: footprintof(createobj.params),
      query: JSON.stringify(createobj.params)
    });
  };

  WindowManagerElement.prototype.onWindowNeeded = function (cloner, createobj) {
    return this.jobs.run('.', qlib.newSteppedJobOnSteppedInstance(
      new jobcores.WindowCreator(this, cloner, createobj)
    ));
  };

  var zeroString = String.fromCharCode(0);
  function footprintof (obj) {
    var str = '';
    if (!lib.isVal(obj)) {
      return '';
    }
    var keys = Object.keys(obj).sort();
    var i;
    var val;
    for (i=0; i<keys.length; i++) {
      lib.joinStringsWith(str, keys[i], zeroString);
      val = obj[keys[i]];
      if (lib.isNumber(val)) {
        val = val+'';
      }
      if (lib.isBoolean(val)) {
        val = val+'';
      }
      if (lib.isString(val)) {
        lib.joinStringsWith(str, val, '=');
        continue;
      }
      if ('object' == typeof val) {
        lib.joinStringsWith(str, footprintof(val), '=');
        continue;
      }
      throw new lib.JSONizingError('UNSUPPORTED_OBJECT', val, 'Cannot make footprint of');
    }
    return str;
  }

  applib.registerElementType('WindowManager', WindowManagerElement);
}
module.exports = createWindowManagerElement;
},{"./jobcores":2}],6:[function(require,module,exports){
(function (execlib) {
  var lib = execlib.lib,
    lR = execlib.execSuite.libRegistry,
    applib = lR.get('allex_applib'),
    mylib = {};

  require('./elements')(execlib, applib, mylib);

  lR.register('allex_windowwebcomponent', mylib);
})(ALLEX)

},{"./elements":1}]},{},[6]);
