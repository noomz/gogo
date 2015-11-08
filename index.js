'use strict';

require('babel-core/register');

let app = require('express')();
let co = require('co');
let safeEval = require('notevil');
// Middlewares
let bodyParser = require('body-parser');
let useragent = require('express-useragent');

app.use(bodyParser.json());
app.use(useragent.express());
// Config
let config = require('config');
// Plugins
let shortid = require('shortid');
let passgen = require('password-generator');
let Mongorito = require('mongorito');
let Model = Mongorito.Model;
Mongorito.connect(config.get('mongodb'));

class Url extends Model {
  configure () {
    this.before('create', 'validate');
    this.before('update', 'validate');
  }

  * validate (next) {
    if (!this.get('conditions')) {
      this.set('conditions', []);
    }

    let url = yield Url.or([
      { 'short': this.get('short') },
      { 'alias': this.get('alais') }
    ]).findOne();

    if (url &&
        url.get('_id').toString() !== this.get('_id').toString()) {
      throw new Error('`short` or `alias` is duplicated');
    }

    yield next;
  }
}

function _mask(url, withPasscode) {
  return {
    to: url.get('to'),
    short: url.get('short'),
    alias: url.get('alias'),
    passcode: withPasscode ? url.get('passcode') : null,
    conditions: url.get('conditions')
  };
}

app.param('shortUrl', (req, res, next, shortUrl) => {
  co(function* () {
    try {
      var url = yield Url.or([
        { 'short': shortUrl },
        { 'alias': shortUrl }
      ]).findOne();

      if (!url || !url.get('to')) {
        res.status(404).end();
      }
      else if (url) {
        req.shortUrl = url;
        next();
      }
    }
    catch (err) {
      throw err;
    }
  }).catch(next);
});

app.param('id', (req, res, next, id) => {
  co(function* () {
    try {
      var url = yield Url.where('_id', id).findOne();

      if (!url || !url.get('to')) {
        res.status(404).end();
      }
      else if (url) {
        req.shortUrl = url;
        next();
      }
    }
    catch (err) {
      throw err;
    }
  }).catch(next);
});

app.post('/api/url', (req, res, next) => {
  co(function* () {
    let url = new Url({
      to: req.body.to,
      short: shortid.generate(),
      alias: req.body.alias,
      passcode: passgen(8, false),
      conditions: req.body.conditions
    });

    yield url.save();
    res.status(201).jsonp(_mask(url, true));
  }).catch(next);
});

app.put('/api/url/:id', (req, res, next) => {
  co(function* () {
    let url = req.shortUrl,
        passcode = req.body.passcode;

    if (!passcode || url.get('passcode') !== passcode) {
      return res.status(401).end();
    }

    url.set('alias', req.body.alias || url.get('alias'));
    url.set('conditions', req.body.conditions || url.get('conditions'));

    yield url.save();
    res.status(200).jsonp(_mask(url));
  }).catch(next);
});

app.get('/api/url/:id', (req, res) => {
  res.status(200).jsonp(_mask(req.shortUrl));
});

app.get('/api/url/short/:shortUrl', (req, res) => {
  res.status(200).jsonp(_mask(req.shortUrl));
});

app.get('/' + config.get('urlPrefix') + ':shortUrl', (req, res) => {
  let url = req.shortUrl,
      redirectTo = req.shortUrl.get('to');

  for (let condition of url.get('conditions')) {
    if (!condition || !condition.expression || !condition.to) {
      continue;
    }

    let result = safeEval(condition.expression, {
      useragent: req.useragent
    });
    if (result) {
      redirectTo = condition.to;
      break;
    }
  }
  res.redirect(302, redirectTo);
});

app.get('/', (req, res) => {
  res.jsonp({ "message": "Nothing here" });
});

// Stop
process.on('SIGINT', () => {
  Mongorito.disconnect();
  app.close(); // TODO: error now.
});

app.listen(config.get('port'));
