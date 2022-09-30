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