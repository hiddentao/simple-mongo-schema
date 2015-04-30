"use strict";


var _typeToStr = function(typeClass) {
  return typeClass.toString().match(/function\s(.*)\(/)[1];
};


/**
 * A schema.
 */
var Schema = function(schema) {
  if (!schema) {
    throw new Error('Schema is empty');
  }

  this.schema = schema;  
}

/**
 * Validate an object against this schema.
 * @param {Object} obj Object to validate.
 * @param {Object} [options] Additional options.
 * @param {Boolean} [options.ignoreMissing] Whether to ignore missing keys.
 * @throws {Error} If validation fails. The `details` field is an `Array` containing error messages.
 */
Schema.prototype.validate = function*(obj, options) {
  if (!obj) {
    throw new Error('Object is empty');
  }

  options = options || {};
  options.ignoreMissing = options.ignoreMissing || false;

  var failures = [];
  
  yield this._doValidate({
    failures: failures,
    schema: {
      path: '',
      node: this.schema,
    },
    object: obj,
  }, options);

  if (failures.length) {
    var e = new Error('Validation failed');

    e.failures = failures.map(function(e) {
      return e[0] + ': ' + e[1];
    });

    throw e;
  }    
}


/**
 * Validate given object node against given schema node.
 */
Schema.prototype._doValidate = function*(params, options) {
  var schemaPath = params.schema.path, 
    schemaNode = params.schema.node,
    obj = params.object,
    failures = params.failures;

  var self = this;

  for (var key in schemaNode) {
    var currentPath = schemaPath + '/' + key,
      currentNode = schemaNode[key],
      objectNode = obj[key],
      currentNodeType = currentNode.type,
      currentNodeValidators = currentNode.validate || [];

    // if type not set
    if (!currentNodeType) {
      failures.push([currentPath, 'invalid schema']);
      continue;
    }

    // missing?
    if (undefined === objectNode) {
      if (currentNode.required && !options.ignoreMissing) {
        failures.push([currentPath, 'missing value']);
      }

      continue;
    }

    switch (currentNodeType) {
      case String:
        if ('string' !== typeof objectNode) {
          failures.push([currentPath, 'must be a string']);
        } else {
          if (Array.isArray(currentNode.enum)) {
            if (0 > currentNode.enum.indexOf(objectNode)) {
              failures.push(
                [currentPath, 'must be one of ' + currentNode.enum.join(', ')]
              );
            }
          }
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
        if (Array.isArray(currentNodeType)) {
          if (!Array.isArray(objectNode)) {
            failures.push([currentPath, 'must be an array']);
          } else {
            var subSchema = currentNodeType[0];

            for (var index in objectNode) {
              var item = objectNode[index];

              yield self._doValidate({
                failures: failures,
                schema: {
                  path: currentPath + '/' + index,
                  node: subSchema,
                },
                object: item,
              }, options);
            }
          }
        }
        // else it just be an object
        else {
          yield self._doValidate({
            failures: failures,
            schema: {
              path: currentPath,
              node: currentNodeType,
            },
            object: objectNode,
          }, options);
        }
    }

    // custom validators
    for (let i in currentNodeValidators) {
      let fn = currentNodeValidators[i];

      try {
        yield fn(objectNode);
      } catch (err) {
        failures.push([currentPath, err.message]);
      }
    }
  }
}




/**
 * Helper to typeify()
 */
Schema.prototype._doTypeify = function(params) {
  var self = this;

  var schemaPath = params.schema.path, 
    schemaNode = params.schema.node,
    object = params.object,
    result = params.result;


  for (var key in schemaNode) {
    var currentPath = schemaPath + '/' + key,
      currentNode = schemaNode[key],
      objectNode = object[key],
      currentNodeType = currentNode.type;

    // console.log(currentPath, currentNodeType.toString(), key, objectNode, result);

    // if type not set
    if (!currentNodeType) {
      continue;
    }

    // missing?
    if (undefined === objectNode) {
      continue;
    }

    // null?
    if (null === objectNode) {
      result[key] = objectNode;
      continue;
    }

    try {
      switch (currentNodeType) {
        case String:
          if ('string' !== typeof objectNode) {
            objectNode = '' + objectNode;
          }
          break;
        case Boolean:
          if ('boolean' !== typeof objectNode) {
            var tmp = ('' + objectNode).toLowerCase();

            if ('false' === tmp || '0' === tmp || 'no' === tmp) {
              objectNode = false;
            } else if ('true' === tmp || '1' === tmp || 'yes' === tmp) {
              objectNode = true;
            }
          }
          break;
        case Number:
          if ('number' !== typeof objectNode) {
            var tmp = '' + objectNode;

            tmp = (0 <= tmp.indexOf('.')) 
              ? parseFloat(tmp) 
              : parseInt(tmp);

            if (!Number.isNaN(tmp)) {
              objectNode = tmp;
            }
          }
          break;
        case Date:
          if (!(objectNode instanceof Date)) {
            try {
              var tmp = new Date(objectNode);
              
              if (0 < tmp) {
                objectNode = tmp;
              }
            } catch (err) {
              // do nothing
            }
          }
          break;
        case Object:
        case Array:
          // not much we can do here
        default:
          // if value should be an array
          if (Array.isArray(currentNodeType)) {
            if (Array.isArray(objectNode)) {
              var subSchema = currentNodeType[0];

              for (var index in objectNode) {
                var item = objectNode[index];

                self._doTypeify({
                  schema: {
                    path: currentPath + '/' + index,
                    node: subSchema,
                  },
                  object: item,
                  result: item,
                });
              }
            }
          }
          // else it just be an object
          else {
            self._doTypeify({
              schema: {
                path: currentPath,
                node: currentNodeType,
              },
              object: objectNode,
              result: objectNode,
            });
          }
      }
    } catch (err) {
      // do nothing
    } 

    // set final result
    result[key] = objectNode;
  }
}




/**
 * Decode the correct type for given object's properties based on this schema.
 *
 * This will iterate through the object's properties. If a property path is 
 * present in the schema then it will attempt to modify the property's value 
 * such that its runtime type matches what the schema expects for that property.
 *
 * This method is useful if you have parsed JSON data which you wish to insert, 
 * but in the case where all the property values are strings and the schema 
 * expects some of them to be booleans, dates, etc. 
 *
 * Any properties in the object which are not present in the schema are left 
 * unchanged. And any schema properties not present in the object are ignored.
 * 
 * @param {Object} obj Object to typeify.
 * @return {Object} Copy of the original object with new property values.
 */
Schema.prototype.typeify = function(obj) {
  if (!obj) {
    return obj;
  }

  var newObj = {};

  this._doTypeify({
    schema: {
      path: '',
      node: this.schema,
    },
    object: obj,
    result: newObj,
  });

  return newObj;
}




module.exports = function(schema) {
  return new Schema(schema);
};


exports.Schema = Schema;



