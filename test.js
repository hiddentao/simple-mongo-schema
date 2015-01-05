"use strict";


var sinon = require('sinon');

var chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

chai.use(require('sinon-chai'));


var schema = require('./simple-mongo-schema.min');


var mocker = null;


var test = module.exports = {
  beforeEach: function() {
    mocker = sinon.sandbox.create({
      useFakeTimers: true
    });
  },
  afterEach: function() {
    mocker.restore();
  }
};


test['construction'] = {
  'no schema': function() {
    expect(function() {
      schema();
    }).to.throw('Schema is empty');
  },
  'have schema': function() {
    expect(function() {
      schema({});
    }).to.not.throw.Error;
  },
};
