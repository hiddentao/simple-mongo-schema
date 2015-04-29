"use strict";

var schema = require('../../');


module.exports = function*() {
  var self = this;

  this.s = schema({
    first: {
      type: {
        name: {
          type: String
        },
      }
    }
  });

  var neutralTestCases = [
      {
      first: {
        name: null
      }
    },
    {
      first: {
        name: undefined
      }
    },
    {
      first: {}
    },
  ];

  var okTestCases = [
    {
      first: {
        name: ['bla']
      }
    },
    {
      first: {
        name: {
          a: 123
        }
      }
    },
    {
      first: {
        name: function() {}
      }
    },
    {
      first: {
        name: 'blabla'
      }
    },
    {
      first: {
        name: 2323
      }
    },
    {
      first: {
        name: true
      }
    },
  ];

  neutralTestCases.forEach(function(c) {
    self.s.typeify(c).should.eql(c);
  })
  ;
  okTestCases.forEach(function(c) {
    self.s.typeify(c).should.eql({
      first: {
        name: '' + c.first.name
      }
    });
  });
};
