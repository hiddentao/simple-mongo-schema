"use strict";


var _typeToStr = function(typeClass) {
  return typeClass.toString().match(/function\s(.*)\(/)[1];
};


/**
 * A schema.
 */
class Schema {

  constructor (schema) {
    if (!schema) {
      throw new Error('Schema is empty');
    }

    this.schema = schema;
  }

  /**
   * Validate an object against this schema.
   * @throws {Error} If validation fails. The `details` field is an `Array` containing error messages.
   */
  * validate (obj) {
    if (!obj) {
      throw new Error('Object is empty');
    }

    var failures = [];
    
    yield this._doValidate({
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
  }


  /**
   * Validate given object node against given schema node.
   */
  * _doValidate (params) {
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
        if (currentNode.required) {
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
                });
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
            });
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

}




module.exports = function(schema) {
  return new Schema(schema);
};


exports.Schema = Schema;



