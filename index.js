(function (execlib) {
  var lib = execlib.lib,
    lR = execlib.execSuite.libRegistry,
    applib = lR.get('allex_applib'),
    mylib = {};

  require('./elements')(execlib, applib, mylib);

  lR.register('allex_windowwebcomponent', mylib);
})(ALLEX)
