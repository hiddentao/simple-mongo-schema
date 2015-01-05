"use strict";

var _typeToStr = function(typeClass) {
  return typeClass.toString().match(/function\s(.*)\(/)[1];
};


/**
 * Construct a new schema.
 */
var Schema = function(schema) {
  if (!schema) {
    throw new Error('Schema is empty');
  }

  this.schema = schema;
};


/**
 * Validate an object against this schema.
 * @throws {Error} If validation fails. The `details` field is an `Array` containing error messages.
 */
Schema.prototype.validate = function(obj) {
  if (!obj) {
    throw new Error('Object is empty');
  }

  var failures = [];
  
  this._doValidate({
    failures: failures,
    schema: {
      path: '',
      node: this.schema,
    },
    object: obj,
  });

  if (failures.length) {
    var e = new Error('Validation failed');

    e.failures = failures.map(function(e) {
      return e[0] + ': ' + e[1];
    });

    throw e;
  }
};

/**
 * Validate given object node against given schema node.
 */
Schema.prototype._doValidate = function(params) {
  var schemaPath = params.schema.path, 
    schemaNode = params.schema.node,
    obj = params.object,
    failures = params.failures;

  var self = this;

  for (var key in schemaNode) {
    var currentPath = schemaPath + '/' + key,
      currentNode = schemaNode[key],
      objectNode = obj[key],
      currentNodeType = currentNode.type;

    // if type not set
    if (!currentNodeType) {
      failures.push([currentPath, 'invalid schema']);
      continue;
    }

    // missing?
    if (undefined === objectNode) {
      if (currentNode.required) {
        failures.push([currentPath, 'missing value']);
      }

      continue;
    }

    switch (currentNodeType) {
      case String:
        if ('string' !== typeof objectNode) {
          failures.push([currentPath, 'must be a string']);
        }
        break;
      case Boolean:
        if ('boolean' !== typeof objectNode) {
          failures.push([currentPath, 'must be true or false']);
        }
        break;
      case Number:
        if ('number' !== typeof objectNode) {
          failures.push([currentPath, 'must be a number']);
        }
        break;
      case Date:
      case Object:
      case Array:
        if (!(objectNode instanceof currentNodeType)) {
          failures.push([currentPath, 'must be of type ' + _typeToStr(currentNodeType)]);
        }
        break;
      default:
        // if value should be an array
        if (currentNodeType instanceof Array) {
          if (!(objectNode instanceof Array)) {
            failures.push([currentPath, 'must be an array']);
          } else {
            var subSchema = currentNodeType[0];

            for (var index in objectNode) {
              var item = objectNode[index];

              self._doValidate({
                failures: failures,
                schema: {
                  path: currentPath + '/' + index,
                  node: subSchema,
                },
                object: item,
              });
            }
          }
        }
        // else it just be an object
        else {
          self._doValidate({
            failures: failures,
            schema: {
              path: currentPath,
              node: currentNodeType,
            },
            object: objectNode,
          });
        }
    }
  }
};



module.exports = function(schema) {
  return new Schema(schema);
};


exports.Schema = Schema;



