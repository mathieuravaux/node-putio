(function() {
  var equal, equals, has_one, has_properties, has_property, have, have_one, have_properties, have_property, properties, property, tap, that, to;
  suite["export"](module);
  have_property = function(expectations) {
    return function(object) {
      return _(expectations).each(function(expectation, property) {
        var actual;
        actual = object[property];
        inspect({
          actual: actual,
          property: property
        });
        if (!(expectation instanceof Function)) {
          expectation = equals(expectation);
        }
        return expectation(actual);
      });
    };
  };
  equals = function(expected) {
    return function(actual) {
      return assert.equal(actual, expected);
    };
  };
  tap = function(expectations) {
    return function(object) {
      sys.puts("tap: " + (sys.inspect(object)));
      return expectations(object);
    };
  };
  to = function(expectation) {
    return expectation;
  };
  that = to;
  have = to;
  equal = equals = function(expected) {
    var expectation;
    return expectation = function(actual) {
      return assert.equal(actual, expected);
    };
  };
  property = properties = has_property = has_properties = have_property = have_properties = function(expectations) {
    var expectation;
    expectation = function(object) {
      return _(expectations).each(function(expectation, property) {
        var actual;
        actual = object[property];
        if (!(expectation instanceof Function)) {
          expectation = equals(expectation);
        }
        return expectation(actual);
      });
    };
    expectation.toString = function() {
      return "has properties " + (JSON.stringify(expectations));
    };
    return expectation;
  };
  has_one = have_one = function(expectation) {
    return function(actual_collection) {
      var actual_values, assertionErrors, error, result, _i, _len, _results;
      assertionErrors = [];
      actual_values = [];
      result = _(actual_collection).detect(function(actual_one) {
        try {
          expectation(actual_one);
          return true;
        } catch (error) {
          if (error instanceof assert.AssertionError) {
            assertionErrors.push(error);
            actual_values.push(actual_one);
          } else {
            if (!error) {
              throw error;
            }
          }
          return false;
        }
      });
      if (!result) {
        _results = [];
        for (_i = 0, _len = assertionErrors.length; _i < _len; _i++) {
          error = assertionErrors[_i];
          assert.fail("[" + (actual_values.map(sys.inspect).join(', ')), expectation.toString(), void 0, 'in');
          _results.push(console.log("Caught " + error));
        }
        return _results;
      }
    };
  };
  suite.addBatch({
    '"equals" expectation': {
      topic: equals,
      'should work when strings match': function() {
        return equals('miam')('miam');
      },
      'should raise when strings differ': function() {
        return assert.throws(function() {
          return equals('miam')('lol');
        });
      }
    },
    '"has_one" expectation': {
      topic: ['RUNNING', 'STOPPED', 'STOPPING'],
      'should work when an item is present': has_one(that(equals('RUNNING'))),
      'should allow a values as expectation': has_one('RUNNING'),
      'should raise when the item is missing': assert.throws(has_one(that(equals('STARTING'))))
    },
    '"have_property" expectation': {
      topic: {
        mode: 'commando'
      },
      'should accept a direct value for comparison': have_property({
        'mode': 'commando'
      }),
      'should accept matching using a passed expectation': have_property({
        'mode': equals('commando')
      })
    }
  });
}).call(this);
