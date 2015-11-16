'use strict';

let morgan = require('morgan');

module.exports = (app, config) => {
  let logConfig = config.get('log');

  if (logConfig.dev) {
    app.use(morgan('dev'));
  }
  if (logConfig.enableLogFile) {
    let FileStreamRotator = require('file-stream-rotator');
    let fs = require('fs');
    let path = require('path');
    let logDestination = path.resolve(logConfig.destination);
    // ensure log directory exists
    /*jshint -W030*/
    fs.existsSync(logDestination) || fs.mkdirSync(logDestination);
    /*jshint +W030*/
    // create a rotating write stream
    let accessLogStream = FileStreamRotator.getStream({
      date_format: 'YYYYMMDD',
      filename: logDestination + '/access-%DATE%.log',
      frequency: 'daily',
      verbose: false
    });
    app.use(morgan('combined', { stream: accessLogStream }));
  }
};
