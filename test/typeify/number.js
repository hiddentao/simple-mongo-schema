"use strict";

var schema = require('../../');


module.exports = function*() {
  var self = this;

  this.s = schema({
    first: {
      type: {
        name: {
          type: Number
        },
      }
    }
  });

  var negativeTestCases = [
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
        name: ['bla']
      }
    },
    {
      first: {
        name: {
          a: true
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
  ];


  var integerCases = [
    {
      first: {
        name: 234
      }
    },
    {
      first: {
        name: '234'
      }
    },
  ];


  var floatCases = [
    {
      first: {
        name: 234.2
      }
    },
    {
      first: {
        name: '234.2'
      }
    },
  ];

  negativeTestCases.forEach(function(c) {
    self.s.typeify(c).should.eql(c);
  });

  integerCases.forEach(function(c) {
    self.s.typeify(c).should.eql({
      first: {
        name: parseInt(234)
      }
    });
  });

  floatCases.forEach(function(c) {
    self.s.typeify(c).should.eql({
      first: {
        name: parseFloat(234.2)
      }
    });
  });
};
