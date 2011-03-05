(function() {
  var assert, expect, inspect, suite, sys, throwed_during_install, vows, _;
  vows = require('vows');
  assert = require('assert');
  _ = require('underscore')._;
  sys = require('sys');
  inspect = function(obj) {
    return sys.puts(JSON.stringify(obj, null, 4));
  };
  expect = require('./expectations');
  try {
    expect.install_into(global);
  } catch (error) {
    throwed_during_install = error;
  }
  suite = vows.describe('Expectations DSL');
  suite.addBatch({
    '"install_into" helper': {
      topic: throwed_during_install,
      "should not throw exceptions": function() {
        return assert.equal(throwed_during_install, null);
      },
      "should add the helpers": function() {
        return assert.doesNotThrow(expectations_intalled);
      }
    },
    '"equals" expectation': {
      topic: 'RUNNING',
      'should work when strings match': equals('RUNNING'),
      'should raise when strings differ': function(actual) {
        var fn;
        fn = function() {
          return equals('STOPPING')(actual);
        };
        return assert.throws(fn, function(e) {
          return e.expected === 'STOPPING' && e.actual === 'RUNNING';
        });
      }
    },
    '"has_one" expectation': {
      topic: ['RUNNING', 'STOPPED', 'STOPPING'],
      'should work when an item is present': has_one(that(equals('RUNNING'))),
      'should allow a values as expectation': has_one('RUNNING'),
      'should raise when the item is missing': function() {
        return assert.throws(has_one(that(equals('STARTING'))));
      }
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
      }),
      'should raise when the property is missing': function(actual) {
        var fn;
        fn = function() {
          return (have_property({
            'name': equals('a name')
          }))(actual);
        };
        return assert.throws(fn, function(e) {
          return e.actual === void 0 && e.expected === 'a name';
        });
      }
    }
  });
  suite["export"](module);
}).call(this);
