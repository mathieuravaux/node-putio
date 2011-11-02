vows    = require 'vows'
assert  = require 'assert'
_ = require('underscore')._

node_putio = require(if process.env['COVERAGE'] then '../lib-cov/putio' else '../lib/putio')
PutIO   = node_putio.PutIO

sys = require 'sys'
inspect = (obj) -> sys.puts JSON.stringify obj, null, 4


jquery_url = 'http://code.jquery.com/jquery-1.5.1.js'
hotfile_url = 'http://hotfile.com/dl/107166103/95b6f77/micro_hebdo_24_february_2011.pdf.html'
hotfile_bad_url = 'http://hotfile.com/dl/96205116/d2b86dd/Mac.OS.X.for.Photographers_sevno.rar.html'
all_urls = [hotfile_url, hotfile_bad_url, jquery_url]

require('./expectations').install_into global

suite = vows.describe 'Put.io nodejs driver'

call_to = (method_name, args...) ->
  (topics..., client) ->
    client[method_name] && client[method_name].call(client, args..., @callback)
    undefined # to trigger the asynchronous behaviour of vows

suite.addBatch 'a wrapped synchronous adapter':
  topic: -> PutIO.wrap(@callback, (args...) -> {the_array: [args...]})(null, 'value1', 'value2', 'value3')
  'should wrap a result': (e, res) ->
    assert.equal res.the_array.length, 3
    assert.equal res.the_array[0], 'value1'
    assert.equal res.the_array[2], 'value3'
    

suite.addBatch 'the directory walk helper':
  topic: -> 
    tree = 
      name: '/'
      dirs: [
        { name: 'bin' },
        { name: 'dev' },
        { name: 'etc', dirs: [ { name: 'defaults'}, { name: 'init.d'} ]},
        { name: 'home', dirs: [
         { name: 'root'},
         { name: 'user', dirs: [ { name: 'documents'} ]}
        ]}]
    traversed_dirs = []
    PutIO.walk_dirs(tree, (node) -> traversed_dirs.push(node.name))
    traversed_dirs
  'should traverse all the directories': (traversed_dirs) ->
    assert.equal traversed_dirs.length, 10
    assert.equal traversed_dirs[0], '/'
    assert.equal traversed_dirs[1], 'bin'
    assert.equal traversed_dirs[9], 'documents'

should = (vows_hash) ->
  # create and return a new context (topic + vows)
  # TODO: add support for arguments
  vows_hash.topic = (topics..., putio)->
    method_name = /call to '(.+)'/.exec(@context.name)[1]
    putio[method_name](@callback)
    undefined
  vows_hash

suite.export(module)



suite.addBatch '':
  topic: new PutIO(process.env['PUTIO_TEST_KEY'], process.env['PUTIO_TEST_SECRET'], false) # debug flag

  "call to 'user_info'": should
    'contain the correct username':
      have property 'name': equal to 'bews'
  
  # call to 'user_friends' should 'return a list containing sbellity': response (list) ->
  #  list.pluck('name').include('sbellity')

  # 'call to user_friends':
  #   topic: call_to 'user_friends'
  #   'should include a list containing "sbellity"': (friends) ->
  #     assert.ok _(_(friends).pluck('name')).include 'sbellity'
  "call to 'user_friends'": should
    'include a list containing "001Sharing"':
      have_one that has_property 'name': '001Sharing'




  # call to 'get_access_token' should 'return a 40-chars hex string': response matches /^[0-9a-f]{40}$/i
  'call to get_access_token':
    topic: call_to 'get_access_token'
    'should return a 40 chars hexadecimal string': matches /^[0-9a-f]{40}$/i

  'call to list_messages':
    topic: call_to 'list_messages'
    'should return a bunch of notices': (messages) ->
        assert.ok messages.length > 0

  # call to 'list_subscriptions' should 'contain Californication & Chuck': response (list) ->
  #   assert.ok list.contains 'Chuck'
  #   assert.ok list.contains 'Californication'
  'call to list_subscriptions':
    topic: call_to 'list_subscriptions'
    'should contain Californication & Chuck': (subs) ->
        names = _(subs).chain().pluck('name')
        assert.ok names.include 'Californication'
        assert.ok names.include 'Chuck'

  'call to subscription_info': 
    topic: call_to 'subscription_info', '4487'
    'should return Chuck for 4487': (info) ->
      assert.equal info.name, 'Chuck'
  
  'call to analyze_url(s)':
    'with an empty list':
      topic: call_to 'analyze_url', ''
      'should an error an invalid URL': (infos) ->
        assert.equal infos.error, 'The requested URL is not valid!'
      
    'with a direct download link (jquery)': 
      topic: call_to 'analyze_url', jquery_url
      'should report the correct file information': (infos) ->
        assert.equal infos.human_size, "211.8K"
        assert.equal infos.name, "jquery-1.5.1.js"
        assert.equal infos.type, "file"

    'with a wait or pay download link (on hotfile)': 
      topic: call_to 'analyze_url', hotfile_url
      'should report the correct file information': (infos) ->
        assert.equal infos.human_size, "50.2M"
        assert.equal infos.name, "micro_hebdo_24_february_2011.pdf"
        assert.equal infos.type, "file"
        assert.equal infos.source, "hotfile.com"

    'with an invalid hotfile link':
      topic: call_to 'analyze_url', hotfile_bad_url
      'should report the correct file information': (infos) ->
        assert.strictEqual infos.error, "File not found!"

    'with a bunch of links':
      topic: call_to('analyze_urls', all_urls)
      'should aggregate the reportings': (items) ->
        assert.equal items.singleurl.length, 2
        assert.equal items.error.length, 1

  'call to get_directory_map':
    topic: call_to 'get_directory_map'
    'should report be a tree of nested hashes through their "dirs" property': (root_dir) ->
      # inspect root_dir
      chuck = _(root_dir.dirs).detect (dir) -> dir.name is 'Chuck'
      assert.ok chuck, "The 'Chuck' directory wasn't found."
      assert.ok chuck.dirs[0].name, 'Season 4'
  
  'call to list_directory':
    topic: call_to 'list_directory', '19316435'
    'should return a hash of dir and file descriptions': (list) ->
      dir = _(list).detect (entry) -> entry.name is 'Art of Computer Programming'
      assert.strictEqual dir.is_dir, yes
      book = _(list).detect (entry) -> entry.name is 'Working Effectively with Legacy Code.chm'
      assert.strictEqual book.is_dir, no
      assert.strictEqual book.type, 'file'
      assert.strictEqual book.size, '2320821'
  
  'call to fs_dump':
    topic: call_to 'fs_dump'
    'should return a tree with files and directories, with kind and size details for each': (dump) ->
      # inspect dump
      assert.ok(dump)
      assert.ok dump.size > 1e9
  
  'call to report_disk_usage':
    topic: call_to 'report_disk_usage'
    'should show the top 10 biggest files': (report) ->
      # inspect report
      assert.equal report.top10_files.length, 10
      assert.ok report.top10_files[0].size > 1e9
      assert.equal report.top10_files[0].name, 'Boardwalk.Empire.S01E01.720p.HDTV.x264-IMMERSE.mkv'
  
      assert.equal report.top10_folders.length, 10
      assert.ok report.top10_folders[0].size > 3e9
      assert.equal report.top10_folders[0].name, 'Boardwalk Empire'

  'call to supports_ddl_of with ddl URL':
    topic: (client)-> client.supports_ddl_of hotfile_url
    'should return true': equals true
  'call to supports_ddl_of with unsupported ddl URL':
    topic: (client)-> client.supports_ddl_of "http://filesonic.com/dl/..."
    'should return false': equals false

  'call to extract_urls_from_text':
    topic: call_to('extract_urls_from_text', "dl <a href='#{hotfile_url}'>here:</a> or here: #{jquery_url} !")
    'should return 2 download links': (res) ->
      # TODO: verify how put.io API is exactly meant to respond to this.
      assert.ok res instanceof Array 
  
  'call to extract_urls_from_url':
    topic: call_to('extract_urls_from_url', "http://freebooksource.info/blogroll/the-accidental-billionaires-the-founding-of-facebook-a-tale-of-sex-money-genius-and-betrayal/")
    'should return 2 download links': (res) ->
      # TODO: verify how put.io API is exactly meant to respond to this.
      assert.ok res instanceof Array 

suite.addBatch 'lifecycle':
    topic: new PutIO(process.env['PUTIO_TEST_KEY'], process.env['PUTIO_TEST_SECRET'])
    
    '-> list_transfers':
      topic: call_to 'list_transfers'
      'should not already contain the test urls': (transfers) ->
        # inspect transfers
        assert.strictEqual typeof transfers.length, 'number'
        transfer_names = _(transfers).pluck 'name'
        assert.ok !_(transfer_names).include 'jquery'
        assert.ok !_(transfer_names).include 'micro_hebdo_24_february_2011.pdf'

      '-> add_transfers':
        topic: call_to('add_transfers', [jquery_url, hotfile_url])
        'should return 2 started tranfers': (started_transfers) ->
          assert.ok(started_transfers)
          assert.strictEqual started_transfers.length, 2
          
        # cancel the Hotfile pdf
        '-> list_transfers':
          topic: call_to 'list_transfers'
          'should mention micro hebdo and hand back its ID': (transfers) ->
            micro_hebdo = _(transfers).detect (t) -> t.name is "micro_hebdo_24_february_2011.pdf"
            assert.ok micro_hebdo
            suite.micro_hebdo_id = micro_hebdo.id
            assert.ok micro_hebdo.id
            
          '-> cancel_transfer on micro_hebdo':
            topic: (topics..., client) ->
              client.cancel_transfer suite.micro_hebdo_id, @callback
              undefined
            'should succeed': (transfers) -> null
            
            '-> list_transfers':
              topic: call_to 'list_transfers'
              'should confirm the hotfile download cancellation': (transfers) ->
                micro_hebdo = _(transfers).detect (t) -> t.name is "micro_hebdo_24_february_2011.pdf"
                assert.ok !micro_hebdo
                

