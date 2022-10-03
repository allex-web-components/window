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