# simple-mongo-schema

[![Build Status](https://secure.travis-ci.org/waigo/simple-mongo-schema.png)](http://travis-ci.org/waigo/simple-mongo-schema)

An easy-to-write schema validator for Mongo JSON objects.

This is useful if you're inserting data into MongoDB and wish to perform some 
light-weight data type validation.

## Features

* Elegant, minimal syntax
* Comprehensive error reporting - all validation failures, not just first one
* No external dependencies (so you could browserify this quite easily!)

## Usage

```bash
$ npm install simple-mongo-schema
```

Here is a schema witha ll the possible field types:

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
    houseNum: {
      type: Number
    },
    // value which must be one of given strings
    taxBand: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
  },
  // an array of nested objects which must adhere to given schema
  children: [{
    name: {
      type: String
    },
    age: {
      type: Number
    }
  }],
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
  schema.validate({
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

## Building

To run the tests:

    $ npm install -g gulp
    $ npm install
    $ npm test

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](https://github.com/waigo/simple-mongo-schema/blob/master/CONTRIBUTING.md).

## License

MIT - see [LICENSE.md](https://github.com/waigo/simple-mongo-schema/blob/master/LICENSE.md)