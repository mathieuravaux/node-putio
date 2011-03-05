(function() {
  var assert, equals, has_one, has_properties, have_property, inspect, matches, stop_word, sys, tap, _;
  assert = require('assert');
  _ = require('underscore')._;
  sys = require('sys');
  inspect = function(obj) {
    return sys.puts(JSON.stringify(obj, null, 4));
  };
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
    var matcher;
    matcher = function(actual) {
      return assert.equal(actual, expected);
    };
    matcher.toString = function() {
      return "is equal to " + (sys.inspect(expected));
    };
    return matcher;
  };
  tap = function(expectations) {
    var where;
    try {
      assert.fail('', '', '', '', tap);
    } catch (fake_error) {
      where = fake_error.stack.split('\n')[1].replace(/^\s+/, '');
    }
    sys.puts("EXPLAIN " + where + ":");
    sys.puts("\t" + (expectations.toString()));
    return expectations;
  };
  stop_word = function(expectation) {
    return expectation;
  };
  has_properties = function(expectations) {
    var matcher;
    matcher = function(object) {
      return _(expectations).each(function(expectation, property) {
        var actual;
        actual = object != null ? object[property] : void 0;
        if (!(expectation instanceof Function)) {
          expectation = equals(expectation);
        }
        return expectation(actual);
      });
    };
    matcher.toString = function() {
      return "has properties " + (JSON.stringify(expectations));
    };
    return matcher;
  };
  has_one = function(expectation) {
    var matcher;
    if (!(expectation instanceof Function)) {
      expectation = equals(expectation);
    }
    matcher = function(actual_collection) {
      var actual_values, assertionErrors, result;
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
            throw error;
          }
          return false;
        }
      });
      if (!result) {
        return assert.fail("[" + (actual_values.map(sys.inspect).join(', ')) + "]", expectation.toString(), void 0, 'in');
      }
    };
    matcher.toString = function() {
      return "has one item that " + (expectation.toString());
    };
    return matcher;
  };
  matches = function(regex) {
    var matcher;
    assert.ok(regex);
    matcher = function(actual) {
      if (!regex.test(actual)) {
        return assert.fail(actual, regex.toString(), null, 'RegExp.test');
      }
    };
    matcher.toString = function() {
      return "matches " + (regex.toString());
    };
    return matcher;
  };
  exports.matchers = {
    tap: tap,
    to: stop_word,
    that: stop_word,
    has: stop_word,
    have: stop_word,
    equal: equals,
    equals: equals,
    match: matches,
    matches: matches,
    has_one: has_one,
    have_one: has_one,
    property: has_properties,
    properties: has_properties,
    has_property: has_properties,
    has_properties: has_properties,
    have_property: has_properties,
    have_properties: has_properties,
    expectations_intalled: function() {
      return true;
    }
  };
  exports.install_into = function(scope) {
    var k, v, _ref;
    _ref = exports.matchers;
    for (k in _ref) {
      v = _ref[k];
      scope[k] = v;
    }
    return scope;
  };
}).call(this);
