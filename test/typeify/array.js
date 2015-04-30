"use strict";

var schema = require('../../');



exports.default = function*() {
  var self = this;

  this.s = schema({
    first: {
      type: {
        name: {
          type: Array
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





exports.specific = function*() {
  var self = this;

  var s = schema({
    first: {
      type: {
        name: {
          type: [{
            alive: {
              type: Boolean
            }
          }]
        },
      }
    }
  });

  s.typeify({
    first: {
      name: [
        {
          alive: 'false'
        },
        {
          alive: 'yes'
        }
      ]
    }
  }).should.eql({
    first: {
      name: [
        {
          alive: false
        },
        {
          alive: true
        }
      ]
    }    
  });
};
