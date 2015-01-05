"use strict";


var sinon = require('sinon');

var chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

chai.use(require('sinon-chai'));


var schema = require('./');


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


var tryCatch = function(schemaObj, obj) {
  try {
    schemaObj.validate(obj);
    return null;
  } catch (e) {
    return e;
  }
};


var tryNoCatch = function(schemaObj, obj) {
  try {
    schemaObj.validate(obj);
  } catch (e) {
    console.error('Unexpected error: ' + JSON.stringify(e.failures));
    throw e;
  }
};



test['bad schema'] = function() {
  var s = schema({
    name: {},
    address: {},
  });

  var e = tryCatch(s, {
    name: 'test'
  });

  e.failures.should.eql([
    '/name: invalid schema',
    '/address: invalid schema',
  ]);
};

test['simple match'] = function() {
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

  tryNoCatch(s, {
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


test['simple mismatch'] = function() {
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

  var e = tryCatch(s, {
    name: 13,
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
    "/numSiblings: must be a number",
    "/born: must be of type Date",
    "/hasKids: must be true or false",
    "/cars: must be of type Array"
  ]);
};




test['not required'] = function() {
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

  tryNoCatch(s, {});
};




test['required'] = function() {
  var s = schema({
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

  var e = tryCatch(s, {});

  e.failures.should.eql(
    ["/name: missing value",
    "/numSiblings: missing value",
    "/born: missing value",
    "/hasKids: missing value",
    "/cars: missing value",
    "/address: missing value"]
  );
};




test['array of items'] = {
  'match': function() {
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
    
    tryNoCatch(s, {
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
  'mismatch': function() {
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
  
    var e = tryCatch(s, {
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

    e.failures.should.eql([ '/children/0/age: must be a number',
    '/children/1/name: must be a string',
    '/children/1/age: must be a number' ]
    );
  }
};





