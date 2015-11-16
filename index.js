'use strict';

require('babel-core/register');
// Config
let config = require('config');

// Utils
let co = require('co');
let safeEval = require('notevil');
let express = require('express');
let app = express();
// Middlewares
let bodyParser = require('body-parser');
let useragent = require('express-useragent');
let cors = require('cors');

// Plugins
app.use(cors());
require('./ddos')(app, config);
require('./log')(app, config);

app.use('/public', express.static('public'));
app.use(bodyParser.json());
app.use(useragent.express());
// Plugins
let shortid = require('shortid');
let passgen = require('password-generator');

let models = require('./models')(app, config);
let Url = models.Url;
let ServiceLog = models.ServiceLog;

function _mask(url, withPasscode) {
  return {
    id: url.get('_id'),
    to: url.get('to'),
    short: url.get('short'),
    alias: url.get('alias'),
    passcode: withPasscode ? url.get('passcode') : null,
    conditions: url.get('conditions'),
    private: url.get('private')
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
      conditions: req.body.conditions,
      private: req.body.private
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

    url.set('to', req.body.to || url.get('to'));
    url.set('alias', req.body.alias || url.get('alias'));
    url.set('conditions', req.body.conditions || url.get('conditions'));
    url.set('private', req.body.private || url.get('private'));

    yield url.save();
    res.status(200).jsonp(_mask(url));
  }).catch(next);
});

app.get('/api/url', (req, res, next) => {
  co(function *() {
    let urls = yield Url.ne('private', true).limit(100).sort({ createdAt: -1 }).find();
    res.jsonp(urls.map(item => {
      return _mask(item);
    }));
  }).catch(next);
});

app.get('/api/url/:id', (req, res) => {
  res.status(200).jsonp(_mask(req.shortUrl));
});

app.get('/api/url/short/:shortUrl', (req, res) => {
  res.status(200).jsonp(_mask(req.shortUrl));
});

function *_delete(req, res) {
  let url = req.shortUrl,
      passcode = req.body.passcode;

  if (!passcode || url.get('passcode') !== passcode) {
    return res.status(401).end();
  }

  yield url.remove();
  res.status(204).jsonp(_mask(url));
}

app.delete('/api/url/:id', (req, res, next) => {
  co(function *() {
    yield _delete(req, res);
  }).catch(next);
});

app.delete('/api/url/short/:shortUrl', (req, res, next) => {
  co(function *() {
    yield _delete(req, res);
  }).catch(next);
});

app.get('/' + config.get('urlPrefix') + ':shortUrl', (req, res, next) => {
  co(function* () {
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

    let serviceLog = new ServiceLog({
      at: new Date(),
      ip: req.ip,
      urlId: url.get('_id'),
      from: url.originalUrl,
      to: redirectTo,
      useragent: req.useragent
    });

    try {
      yield serviceLog.save();
      res.redirect(302, redirectTo);
    }
    catch (err) {
      throw err;
    }
  }).catch(next);
});

app.get('/', (req, res) => {
  res.jsonp({ "message": "Nothing here" });
});

// Stop
process.on('SIGINT', () => {
  process.exit();
});

let port = config.get('port');
app.listen(port, () => {
  console.log(`Listening on port ${port} ...`);
});
