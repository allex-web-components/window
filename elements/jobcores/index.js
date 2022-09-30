function createJobCores(lib) {
  'use strict';
  var mylib = {};

  require('./onmanagercreator')(lib, mylib);
  require('./windowcreatorcreator')(lib, mylib);

  return mylib;
}
module.exports = createJobCores;