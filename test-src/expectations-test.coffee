vows    = require 'vows'
assert  = require 'assert'
_ = require('underscore')._

sys = require 'sys'
inspect = (obj) -> sys.puts JSON.stringify obj, null, 4

expect = require('./expectations')

try expect.install_into global
catch error then throwed_during_install = error

suite = vows.describe('Expectations DSL')
suite.addBatch
  '"install_into" helper':
    topic: throwed_during_install
    "should not throw exceptions": -> assert.equal throwed_during_install, null
    "should add the helpers": -> assert.doesNotThrow expectations_intalled

  '"equals" expectation':
      topic: 'RUNNING'
      'should work when strings match': equals 'RUNNING'
      'should raise when strings differ': (actual) ->
        fn = -> equals('STOPPING')(actual)
        assert.throws fn, (e) -> e.expected is 'STOPPING' && e.actual is 'RUNNING'
  
  '"has_one" expectation':
      topic: ['RUNNING', 'STOPPED', 'STOPPING']
      'should work when an item is present':   has_one that equals 'RUNNING'
      'should allow a values as expectation':  has_one 'RUNNING'
      'should raise when the item is missing': ->  assert.throws has_one that equals 'STARTING'
  
  '"have_property" expectation':
      topic: {mode: 'commando'}
      'should accept a direct value for comparison':
          have_property 'mode': 'commando'
      'should accept matching using a passed expectation':
          have_property 'mode': equals 'commando'
      'should raise when the property is missing': (actual) ->
          fn = -> (have_property 'name': equals 'a name')(actual)
          assert.throws fn, (e) -> e.actual is undefined && e.expected is 'a name'


suite.export(module)



# 1st step: DRY: generate the nested hashes
# -----------------------------------------
# call to 'user_info' should 'contain the correct username': (err, user) ->
#   assert.equal user.name, 'bews'

# 2nd step: DRY: generate expectations
# --------------------------------
# call to 'user_info' should 'contain the correct username': response field 'name' equals 'bews'

# 3rd step: wrap responded data structures into _ for easy manipulation. Wrap 'assert' to accept _-chained values ?