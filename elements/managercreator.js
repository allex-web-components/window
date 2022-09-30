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