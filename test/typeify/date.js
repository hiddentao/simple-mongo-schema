"use strict";

var schema = require('../../');



module.exports = function*() {
  var self = this;

  this.s = schema({
    first: {
      type: {
        name: {
          type: Date
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


  var dateTestCases = [
    {
      first: {
        name: new Date(2014,0,2)
      }
    },
    {
      first: {
        name: new Date(2014,0,2).toString()
      }
    },
    {
      first: {
        name: '2014-01-02 00:00:00'
      }
    },
  ]

  neutralTestCases.forEach(function(c) {
    self.s.typeify(c).should.eql(c);
  });

  dateTestCases.forEach(function(c) {
    var ret = self.s.typeify(c);

    ret.first.name.getTime().should.eql(new Date(2014,0,2).getTime());
  });
};



