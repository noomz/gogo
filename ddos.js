'use strict';

module.exports = (app, config) => {
  if (config.get('enableDDOSprotection')) {
    let Ddos = require('ddos');
    let ddos = new Ddos(config.get('DDOSparams'));
    app.use(ddos.express);
  }
};
