"use strict";

var schema = require('../../');



module.exports = function*() {
  var self = this;

  this.s = schema({
    first: {
      type: {
        name: {
          type: Object
        },
      }
    }
  });

  var neutralTestCases = [
    {
      first: {}
    },
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
      first: {
        name: true
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
        name: []
      }
    },
  ];


  neutralTestCases.forEach(function(c) {
    self.s.typeify(c).should.eql(c);
  });
};



