function createElements (execlib, applib, mylib) {
  'use strict';

  require('./managercreator')(execlib.lib, applib, mylib);

}
module.exports = createElements;
