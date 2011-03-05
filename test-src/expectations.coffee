assert  = require 'assert'
_ = require('underscore')._

sys = require 'sys'
inspect = (obj) -> sys.puts JSON.stringify obj, null, 4


have_property = 
  (expectations) ->
    (object) ->
      _(expectations).each (expectation, property) ->
        actual = object[property]
        inspect actual: actual, property: property
        expectation = equals(expectation) unless expectation instanceof Function
        expectation actual

equals = (expected) ->
  matcher = (actual) -> assert.equal actual, expected
  matcher.toString = -> "is equal to #{sys.inspect expected}"
  matcher


tap = (expectations) ->
  try assert.fail '', '', '', '', tap
  catch fake_error then where = fake_error.stack.split('\n')[1].replace(/^\s+/, '')
  sys.puts "EXPLAIN #{where}:"
  sys.puts "\t#{expectations.toString()}"
  expectations

# just pass the expectations along, for readability
# eg: be, to, has, have, that, etc...
stop_word = (expectation) -> expectation


has_properties =
  (expectations) ->
    matcher = (object) ->
      _(expectations).each (expectation, property) ->
        actual = object?[property]
        expectation = equals(expectation) unless expectation instanceof Function
        expectation actual
    matcher.toString = -> "has properties #{JSON.stringify expectations}"
    matcher

has_one =
  (expectation) ->
    expectation = equals(expectation) unless expectation instanceof Function
    matcher = (actual_collection) ->
      assertionErrors = []
      actual_values = []
      result = _(actual_collection).detect (actual_one) ->
        try
          expectation(actual_one)
          true
        catch error 
          if error instanceof assert.AssertionError
            assertionErrors.push error
            actual_values.push actual_one
          else
            throw error
          false
      unless result
        assert.fail("[#{actual_values.map(sys.inspect).join ', '}]", expectation.toString(), undefined, 'in')
    matcher.toString = -> "has one item that #{expectation.toString()}"
    matcher

matches = 
  (regex) ->
    assert.ok(regex)
    matcher = (actual) ->
      assert.fail(actual, regex.toString(), null, 'RegExp.test') unless regex.test actual
    matcher.toString = -> "matches #{regex.toString()}"
    matcher
  

exports.matchers =
  tap: tap

  to:   stop_word
  that: stop_word
  has:  stop_word
  have: stop_word
  
  equal:    equals
  equals:   equals
  match:    matches
  matches:  matches

  has_one:  has_one
  have_one: has_one
  
  property:        has_properties
  properties:      has_properties
  has_property:    has_properties
  has_properties:  has_properties
  have_property:   has_properties
  have_properties: has_properties

  expectations_intalled: () -> true

exports.install_into = (scope) ->
  scope[k] = v for k, v of exports.matchers
  scope


