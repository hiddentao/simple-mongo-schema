# simple-mongo-schema

[![Build Status](https://secure.travis-ci.org/hiddentao/simple-mongo-schema.png)](http://travis-ci.org/hiddentao/simple-mongo-schema)

An easy-to-write schema validator for Mongo JSON objects.

This is useful if you're inserting data into MongoDB and wish to perform some 
light-weight data type validation.

## Features

* ES6-ready, uses generators
* Elegant, minimal syntax
* Comprehensive error reporting - all validation failures, not just first one
* [Type-matching](#type-matching)
* No external dependencies (so you could browserify this quite easily!)

## Installation

**This package requires ES6 support, i.e. Node 0.11.2+**

```bash
$ npm install simple-mongo-schema
```

## Usage 

Here is a schema with all the possible field types:

```js
var schema = {
  name: {
    type: String
  },
  isMarried: {
    type: Boolean
  },
  numCars: {
    type: Number
  },
  born: {
    type: Date
  },
  // any plain JS object with any keys
  jobDetails: {
    type: Object 
  },
  // a simple array with any data
  favouriteNumbers: {
    type: Array 
  },
  // a nested object which adheres to given schema
  address: {
    type: {
      houseNum: {
        type: Number
      },
      // value which must be one of given strings
      taxBand: {
        type: String,
        enum: ['low', 'medium', 'high'],
      },
    },
  },
  // an array of nested objects which must adhere to given schema
  children: {
    type: [{
      name: {
        type: String,
        // custom validators
        validate: [
          function*(value) {
            if ('john' === value) {
              throw new Error('cannot be john');
            }
          }
        ]
      },
      age: {
        type: Number
      }
    }],
  },
}
``` 


## Example

First we define the schema:


```js
var EmployeeSchema = {
  name: {
    type: String,
    required: true
  },
  born: {
    type: Date,
  }
  numChildren: {
    type: Number,
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
        required: true
      },
    },
  },
  spouse: {
    type: {
      name: {
        type: String,
        required: true      
      } 
    }
  },
};

var CompanySchema = {
  name: {
    type: String,
    required: true
  },
  employees: {
    type: [EmployeeSchema],
    required: true
  },
};
```

Now we can validate data against it:

```js
var schema = require('simple-mongo-schema')(CompanySchema);

try {
  yield schema.validate({
    name: 'my company',
    employees: [
      {
        name: 'john',
        born: 'last year',
        numChildren: 1,
        address: {
          houseNum: 12,
          street: 'view road',
          country: 'uk',
        }
      },
      {
        name: 'mark',
        born: new Date(),
        numChildren: null,
        address: {
          houseNum: 25,
          street: 'view road'
        },
        spouse: {
          name: 23,
          age: 23
        }
      },
    ]
  });  
} catch (err) {
  
  /*
    Error: Validation failed
   */
  console.log(err.toString());  

  /*
  [
    "/employees/0/born: must be of type Date",
    "/employees/1/numChildren: must be a number",
    "/employees/1/address/country: missing value",
    "/employees/1/spouse/name: must be a string"
  ]
  */
  console.log(err.failures);
}
```

### Type matching

When stringifying JSON you often lose type information (e.g. `Date` instances get converted to strings). When the stringified version gets parsed back into a JSON object you can use the `typeify()` function to help restore type information:

```js
var schema = {
  name: {
    type: String
  },
  isMarried: {
    type: Boolean
  },
  numCars: {
    type: Number
  },
  born: {
    type: Date
  }
};

var object = {
  name: 'John',
  isMarried: true,
  numCars: 3,
  born: new Date(2015,0,1)
}

var str = JSON.stringify(object); 

/*
"{"name":"John","isMarried":true,"numCars":3,"born":"2014-12-31T16:00:00.000Z"}"
*/

var newObject = JSON.parse(str);

/*
{
  name: 'John',
  isMarried: true,
  numCars: 3,
  born: "2014-12-31T16:00:00.000Z"
}
*/

var typedObject = schema.typeify(newObject);

/*
{
  name: 'John',
  isMarried: true,
  numCars: 3,
  born: Date("2014-12-31T16:00:00.000Z")
}
*/
```

The type-ification process is quite tolerant of values. For example, for boolean values;

* `false` <- `"false"` or `"FALSE"` or `"no"` or `"NO"` or `"0"` or `0`
* `true` <- `"true"` or `"TRUE"` or `"yes"` or `"YES"` or `"1"` or `1`

To take the previous example again:

```js
var newObject = {
  name: 'John'
  isMarried: 'no'
  numCars: '76'
  born: '2014-12-31T16:00:00.000Z'
};

var typedObject = schema.typeify(newObject);

/*
{
  name: 'John',
  isMarried: false,
  numCars: 76,
  born: Date("2014-12-31T16:00:00.000Z")
}
*/
```


It is also smart enough to know when a conversion isn't possible. Instead of throwing an error it will simply pass through the original value.

Using the schema from our previous example:

```js
var newObject = {
  name: null
  isMarried: function() {}
  numCars: false,
  born: 'blabla'
};

var typedObject = schema.typeify(newObject);

/*
{
  name: null,
  isMarried: function() {}
  numCars: false
  born: 'blabla'
}
*/
```

## Building

To run the tests:

    $ npm install -g gulp
    $ npm install
    $ npm test

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](https://github.com/hiddentao/simple-mongo-schema/blob/master/CONTRIBUTING.md).

## License

MIT - see [LICENSE.md](https://github.com/hiddentao/simple-mongo-schema/blob/master/LICENSE.md)