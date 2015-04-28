"use strict";


var sinon = require('sinon');

var chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

chai.use(require('sinon-chai'));

require('co-mocha');


var schema = require('./');


var mocker = null;


var test = module.exports = {
  beforeEach: function*() {
    mocker = sinon.sandbox.create({
      useFakeTimers: true
    });
  },
  afterEach: function*() {
    mocker.restore();
  }
};


test['construction'] = {
  'no schema': function*() {
    expect(function() {
      schema();
    }).to.throw('Schema is empty');
  },
  'have schema': function*() {
    expect(function() {
      schema({});
    }).to.not.throw.Error;
  },
};


var tryCatch = function*(schemaObj, obj, options) {
  try {
    yield schemaObj.validate(obj, options);
    return null;
  } catch (e) {
    return e;
  }
};


var tryNoCatch = function*(schemaObj, obj, options) {
  try {
    yield schemaObj.validate(obj, options);
  } catch (e) {
    console.error('Unexpected error: ' + JSON.stringify(e.failures));
    throw e;
  }
};



test['bad schema'] = function*() {
  var s = schema({
    name: {},
    address: {},
  });

  var e = yield tryCatch(s, {
    name: 'test'
  });

  e.failures.should.eql([
    '/name: invalid schema',
    '/address: invalid schema',
  ]);
};

test['simple match'] = function*() {
  var s = schema({
    name: {
      type: String
    },
    numSiblings: {
      type: Number
    },
    born: {
      type: Date,
    },
    hasKids: {
      type: Boolean,
    },
    cars: {
      type: Array
    },
    address: {
      type: Object
    }
  });

  yield tryNoCatch(s, {
    name: 'test',
    numSiblings: 13,
    born: new Date(),
    hasKids: false,
    cars: [1, 2],
    address: {
      houseNum: 2
    },
  });
};


test['simple mismatch'] = function*() {
  var s = schema({
    name: {
      type: String
    },
    type: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    numSiblings: {
      type: Number
    },
    born: {
      type: Date,
    },
    hasKids: {
      type: Boolean,
    },
    cars: {
      type: Array
    },
    address: {
      type: Object
    }
  });

  var e = yield tryCatch(s, {
    name: 13,
    type: 'far',
    numSiblings: 'blah',
    born: 'fire',
    hasKids: new Date(),
    cars: {
      houseNum: 2,
    },
    address: [1, 2]
  });

  e.failures.should.eql([
    "/name: must be a string",
    "/type: must be one of low, medium, high",
    "/numSiblings: must be a number",
    "/born: must be of type Date",
    "/hasKids: must be true or false",
    "/cars: must be of type Array"
  ]);
};




test['not required'] = function*() {
  var s = schema({
    name: {
      type: String,
    },
    numSiblings: {
      type: Number
    },
    born: {
      type: Date,
    },
    hasKids: {
      type: Boolean,
    },
    cars: {
      type: Array
    },
    address: {
      type: Object
    }
  });

  yield tryNoCatch(s, {});
};




test['required'] = {
  beforeEach: function*() {
    this.s = schema({
      name: {
        type: String,
        required: true,
      },
      numSiblings: {
        type: Number,
        required: true,
      },
      born: {
        type: Date,
        required: true,
      },
      hasKids: {
        type: Boolean,
        required: true,
      },
      cars: {
        type: Array,
        required: true,
      },
      address: {
        type: Object,
        required: true,
      }
    });
  },

  'missing': function*() {
    var e = yield tryCatch(this.s, {});

    e.failures.should.eql([
      "/name: missing value",
      "/numSiblings: missing value",
      "/born: missing value",
      "/hasKids: missing value",
      "/cars: missing value",
      "/address: missing value"
    ]);
  },

  'ignore missing': function*() {
    yield tryNoCatch(this.s, {}, {
      ignoreMissing: true
    });
  }
};




test['array of items'] = {
  'match': function*() {
    var Child = {
      name: {
        type: String
      },
      age: {
        type: Number
      }
    };

    var s = schema({
      name: {
        type: String,
      },
      children: {
        type: [Child]
      }
    });
    
    yield tryNoCatch(s, {
      name: 'john',
      children: [
        {
          name: 'jennifer',
          age: 23,
        },
        {
          name: 'mark',
          age: 54,
        },
      ]
    });
  },
  'mismatch': function*() {
    var Child = {
      name: {
        type: String
      },
      age: {
        type: Number
      }
    };

    var s = schema({
      name: {
        type: String,
      },
      children: {
        type: [Child]
      }
    });
  
    var e = yield tryCatch(s, {
      name: 'john',
      children: [
        {
          name: 'jennifer',
          age: '23',
        },
        {
          name: 23,
          age: 'blah',
        },
      ]
    });

    e.failures.should.eql([ 
      '/children/0/age: must be a number',
      '/children/1/name: must be a string',
      '/children/1/age: must be a number' 
    ]);
  }
};





test['sub-object'] = {
  'match': function*() {
    var Child = {
      name: {
        type: String
      },
      age: {
        type: Number
      }
    };

    var s = schema({
      name: {
        type: String,
      },
      children: {
        type: Child
      }
    });
    
    yield tryNoCatch(s, {
      name: 'john',
      children: {
        name: 'jennifer',
        age: 23,
      },
    });
  },
  'mismatch': function*() {
    var Child = {
      name: {
        type: String
      },
      age: {
        type: Number
      }
    };

    var s = schema({
      name: {
        type: String,
      },
      children: {
        type: Child
      }
    });
  
    var e = yield tryCatch(s, {
      name: 'john',
      children: {
        name: 23,
        age: 'blah',
      },
    });

    e.failures.should.eql([ 
      '/children/name: must be a string',
      '/children/age: must be a number' 
    ]);
  }
};




test['deeply nested objects'] = {
  'match': function*() {
    var Child = {
      name: {
        type: String
      },
      address: {
        type: {
          houseNum: {
            type: Number
          },
          street: {
            type: String
          },
          country: {
            type: String,
          },
        },
      },
      toys: {
        type: [{
          name: {
            type: String
          }
        }]
      }
    };

    var s = schema({
      name: {
        type: String,
      },
      children: {
        type: Child
      },
    });
    
    var e = yield tryCatch(s, {
      name: 'john',
      children: {
        name: 'jennifer',
        address: {
          houseNum: 23,
          street: 'mako',
          country: 1
        },
        toys: [{
          name: null,
        }],
        age: 23,
      },
    });

    e.failures.should.eql([
      "/children/address/country: must be a string",
      "/children/toys/0/name: must be a string"
      ])
  },
  'mismatch': function*() {
    var Child = {
      name: {
        type: String
      },
      address: {
        type: {
          houseNum: {
            type: Number
          },
          street: {
            type: String
          },
          country: {
            type: String,
          },
        },
      },
      toys: {
        type: [{
          name: {
            type: String
          }
        }]
      }
    };

    var s = schema({
      name: {
        type: String,
      },
      children: {
        type: Child
      },
    });
    
    yield tryNoCatch(s, {
      name: 'john',
      children: {
        name: 'jennifer',
        address: {
          houseNum: 23,
          street: 'mako',
          country: 'uk'
        },
        toys: [{
          name: 'blah',
        }],
        age: 23,
      },
    });
  }
};




test['custom validators'] = {
  beforeEach: function*() {
    this.s = schema({
      name: {
        type: String,
        validate: [
          function*(value) {
            if (1 === value.length) {
              throw new Error('too small');
            }
          },
          function*(value) {
            if ('amy' !== value) {
              throw new Error('must be amy');
            }
          },
        ]
      },
    });
  },

  'fail': function*() {
    var e = yield tryCatch(this.s, {
      name: '1',
    });

    e.failures.should.eql([
      "/name: too small",
      "/name: must be amy"
    ]);

    e = yield tryCatch(this.s, {
      name: 'john',
    });

    e.failures.should.eql([
      "/name: must be amy"
    ]);
  },

  'pass': function*() {
    var e = yield tryNoCatch(this.s, {
      name: 'amy',
    });
  },
};




test['typeify'] = {
  'boolean': function*() {
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

  },
};




