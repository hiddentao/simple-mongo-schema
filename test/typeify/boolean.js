"use strict";

var schema = require('../../');


module.exports = function*() {
  var self = this;

  this.s = schema({
    first: {
      type: {
        name: {
          type: Boolean
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
  ];


  var falseTestCases = [
    {
      first: {
        name: false
      }
    },
    {
      first: {
        name: 0
      }
    },
    {
      first: {
        name: '0'
      }
    },
    {
      first: {
        name: 'no'
      }
    },
    {
      first: {
        name: 'NO'
      }
    },
    {
      first: {
        name: 'false'
      }
    },
    {
      first: {
        name: 'FALSE'
      }
    },
  ];



  var trueTestCases = [
    {
      first: {
        name: true
      }
    },
    {
      first: {
        name: 1
      }
    },
    {
      first: {
        name: '1'
      }
    },
    {
      first: {
        name: 'yes'
      }
    },
    {
      first: {
        name: 'YES'
      }
    },
    {
      first: {
        name: 'true'
      }
    },
    {
      first: {
        name: 'TRUE'
      }
    },
  ];

  neutralTestCases.forEach(function(c) {
    self.s.typeify(c).should.eql(c);
  });

  falseTestCases.forEach(function(c) {
    self.s.typeify(c).should.eql({
      first: {
        name: false
      }
    });
  });

  trueTestCases.forEach(function(c) {
    self.s.typeify(c).should.eql({
      first: {
        name: true
      }
    });
  });
};
