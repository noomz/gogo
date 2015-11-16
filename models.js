'use strict';

let Mongorito = require('mongorito');
let Model = Mongorito.Model;

class Url extends Model {
  configure () {
    this.before('create', 'validate');
    this.before('update', 'validate');
  }

  * validate (next) {
    if (!this.get('conditions')) {
      this.set('conditions', []);
    }

    let criterias = [
      { 'short': this.get('short') },
      { 'alias': this.get('short') },
    ];
    if (this.get('alias')) {
      criterias.push({ 'short': this.get('alias') });
      criterias.push({ 'alias': this.get('alias') });
    }

    let query = Url.or(criterias);

    if (this.get('_id')) {
      query = query.ne('_id', this.get('_id'));
    }

    let url = yield query.findOne();
    if (url) {
      throw new Error('`short` or `alias` is duplicated');
    }

    yield next;
  }
}

class ServiceLog extends Model {

}

module.exports = (app, config) => {
  Mongorito.connect(config.get('mongodb'));

  process.on('SIGINT', () => {
    Mongorito.disconnect();
  });

  return {
    Url: Url,
    ServiceLog: ServiceLog
  };
};
