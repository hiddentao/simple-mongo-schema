(function (name, definition){
  "use strict";

  if ('function' === typeof define){ // AMD
    define(definition);
  } else if ('undefined' !== typeof module && module.exports) { // Node.js
    module.exports = definition();
  } else { // Browser
    var global = window || this,
      old = global[name],
      theModule = definition();

    theModule.noConflict = function () {
      global[name] = old;
      return theModule;
    };

    global[name] = theModule;
  }
})('SimpleSchema', function () {
  "use strict";

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

    if (!obj) {
      return failures.push([schemaPath, 'value missing']);
    }

    for (var key in schemaNode) {
      if (!schemaNode.hasOwnProperty(key)) {
        continue;
      }

      var currentPath = schemaPath + '.' + key,
        currentNode = schemaNode[key],
        currentNodeKeys = Object.keys(currentNode),
        objectNode = obj[key];

      // if value is a sub-object
      if (
        (!currentNode.type && currentNodeKeys.length) || (currentNode.type && currentNode.type.type)) {
        self._doValidate({
          failures: failures,
          schema: {
            path: currentPath,
            node: currentNode,
          },
          object: objectNode,
        });
      }
      // if value is an array
      else if (currentNode instanceof Array) {
        if (!(objectNode instanceof Array)) {
          failures.push([currentPath, 'must be an array']);
        } else {
          var subSchema = currentNode[0];

          for (var index in objectNode) {
            var item = objectNode[index];
            
            self._doValidate({
              failures: failures,
              schema: {
                path: currentPath + '.' + index,
                node: subSchema,
              },
              object: item,
            });
          }
        }
      }
      // else it's a normal value specifier
      else if (currentNode.type) {
        // required?
        if (currentNode.required && undefined === objectNode) {
          failures.push([currentPath, 'required']);
        }

        if (!(objectNode instanceof currentNode.type)) {
          failures.push([currentPath, 'must be of type ' + currentNode.type]);
        }
      }
      // else it's unknown
      else {
        failures.push([currentPath, 'invalid schema']);
      }
    }
  };


  // export
  return function(schema) {
    return new Schema(schema);
  };

});