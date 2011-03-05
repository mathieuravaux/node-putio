(function() {
  var PutIO, all_urls, assert, call_to, hotfile_bad_url, hotfile_url, inspect, jquery_url, node_putio, should, suite, sys, vows, _;
  var __slice = Array.prototype.slice;
  vows = require('vows');
  assert = require('assert');
  _ = require('underscore')._;
  node_putio = require(process.env['COVERAGE'] ? '../lib-cov/putio' : 'node-putio');
  PutIO = node_putio.PutIO;
  sys = require('sys');
  inspect = function(obj) {
    return sys.puts(JSON.stringify(obj, null, 4));
  };
  jquery_url = 'http://code.jquery.com/jquery-1.5.1.js';
  hotfile_url = 'http://hotfile.com/dl/107166103/95b6f77/micro_hebdo_24_february_2011.pdf.html';
  hotfile_bad_url = 'http://hotfile.com/dl/96205116/d2b86dd/Mac.OS.X.for.Photographers_sevno.rar.html';
  all_urls = [hotfile_url, hotfile_bad_url, jquery_url];
  require('./expectations').install_into(global);
  suite = vows.describe('Put.io nodejs driver');
  call_to = function() {
    var args, method_name;
    method_name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return function() {
      var client, topics, _i, _ref;
      topics = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), client = arguments[_i++];
      client[method_name] && (_ref = client[method_name]).call.apply(_ref, [client].concat(__slice.call(args), [this.callback]));
      return;
    };
  };
  suite.addBatch({
    'a wrapped synchronous adapter': {
      topic: function() {
        return PutIO.wrap(this.callback, function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return {
            the_array: __slice.call(args)
          };
        })(null, 'value1', 'value2', 'value3');
      },
      'should wrap a result': function(e, res) {
        assert.equal(res.the_array.length, 3);
        assert.equal(res.the_array[0], 'value1');
        return assert.equal(res.the_array[2], 'value3');
      }
    }
  });
  suite.addBatch({
    'the directory walk helper': {
      topic: function() {
        var traversed_dirs, tree;
        tree = {
          name: '/',
          dirs: [
            {
              name: 'bin'
            }, {
              name: 'dev'
            }, {
              name: 'etc',
              dirs: [
                {
                  name: 'defaults'
                }, {
                  name: 'init.d'
                }
              ]
            }, {
              name: 'home',
              dirs: [
                {
                  name: 'root'
                }, {
                  name: 'user',
                  dirs: [
                    {
                      name: 'documents'
                    }
                  ]
                }
              ]
            }
          ]
        };
        traversed_dirs = [];
        PutIO.walk_dirs(tree, function(node) {
          return traversed_dirs.push(node.name);
        });
        return traversed_dirs;
      },
      'should traverse all the directories': function(traversed_dirs) {
        assert.equal(traversed_dirs.length, 10);
        assert.equal(traversed_dirs[0], '/');
        assert.equal(traversed_dirs[1], 'bin');
        return assert.equal(traversed_dirs[9], 'documents');
      }
    }
  });
  should = function(vows_hash) {
    vows_hash.topic = function() {
      var method_name, putio, topics, _i;
      topics = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), putio = arguments[_i++];
      method_name = /call to '(.+)'/.exec(this.context.name)[1];
      putio[method_name](this.callback);
      return;
    };
    return vows_hash;
  };
  suite["export"](module);
  suite.addBatch({
    '': {
      topic: new PutIO(process.env['PUTIO_TEST_KEY'], process.env['PUTIO_TEST_SECRET'], false),
      "call to 'user_info'": should({
        'contain the correct username': have(property({
          'name': equal(to('bews'))
        }))
      }),
      "call to 'user_friends'": should({
        'include a list containing "001Sharing"': have_one(that(has_property({
          'name': '001Sharing'
        })))
      }),
      'call to get_access_token': {
        topic: call_to('get_access_token'),
        'should return a 40 chars hexadecimal string': matches(/^[0-9a-f]{40}$/i)
      },
      'call to list_messages': {
        topic: call_to('list_messages'),
        'should return a bunch of notices': function(messages) {
          return assert.ok(messages.length > 0);
        }
      },
      'call to list_subscriptions': {
        topic: call_to('list_subscriptions'),
        'should contain Californication & Chuck': function(subs) {
          var names;
          names = _(subs).chain().pluck('name');
          assert.ok(names.include('Californication'));
          return assert.ok(names.include('Chuck'));
        }
      },
      'call to subscription_info': {
        topic: call_to('subscription_info', '4487'),
        'should return Chuck for 4487': function(info) {
          return assert.equal(info.name, 'Chuck');
        }
      },
      'call to analyze_url(s)': {
        'with an empty list': {
          topic: call_to('analyze_url', ''),
          'should an error an invalid URL': function(infos) {
            return assert.equal(infos.error, 'The requested URL is not valid!');
          }
        },
        'with a direct download link (jquery)': {
          topic: call_to('analyze_url', jquery_url),
          'should report the correct file information': function(infos) {
            assert.equal(infos.human_size, "211.8K");
            assert.equal(infos.name, "jquery-1.5.1.js");
            return assert.equal(infos.type, "file");
          }
        },
        'with a wait or pay download link (on hotfile)': {
          topic: call_to('analyze_url', hotfile_url),
          'should report the correct file information': function(infos) {
            assert.equal(infos.human_size, "50.2M");
            assert.equal(infos.name, "micro_hebdo_24_february_2011.pdf");
            assert.equal(infos.type, "file");
            return assert.equal(infos.source, "hotfile.com");
          }
        },
        'with an invalid hotfile link': {
          topic: call_to('analyze_url', hotfile_bad_url),
          'should report the correct file information': function(infos) {
            return assert.strictEqual(infos.error, "File not found!");
          }
        },
        'with a bunch of links': {
          topic: call_to('analyze_urls', all_urls),
          'should aggregate the reportings': function(items) {
            assert.equal(items.singleurl.length, 2);
            return assert.equal(items.error.length, 1);
          }
        }
      },
      'call to get_directory_map': {
        topic: call_to('get_directory_map'),
        'should report be a tree of nested hashes through their "dirs" property': function(root_dir) {
          var chuck;
          chuck = _(root_dir.dirs).detect(function(dir) {
            return dir.name === 'Chuck';
          });
          assert.ok(chuck, "The 'Chuck' directory wasn't found.");
          return assert.ok(chuck.dirs[0].name, 'Season 4');
        }
      },
      'call to list_directory': {
        topic: call_to('list_directory', '11828782'),
        'should return a hash of dir and file descriptions': function(list) {
          var dir, s03e17;
          dir = _(list).detect(function(entry) {
            return entry.name === 'Season 4';
          });
          assert.strictEqual(dir.is_dir, true);
          s03e17 = _(list).detect(function(entry) {
            return entry.name === 'Chuck.S04E17.HDTV.XviD-LOL.avi';
          });
          assert.strictEqual(s03e17.is_dir, false);
          assert.strictEqual(s03e17.type, 'movie');
          return assert.strictEqual(s03e17.size, '366508032');
        }
      },
      'call to fs_dump': {
        topic: call_to('fs_dump'),
        'should return a tree with files and directories, with kind and size details for each': function(dump) {
          assert.ok(dump);
          return assert.ok(dump.size > 1e9);
        }
      },
      'call to report_disk_usage': {
        topic: call_to('report_disk_usage'),
        'should show the top 10 biggest files': function(report) {
          assert.equal(report.top10_files.length, 10);
          assert.ok(report.top10_files[0].size > 1e9);
          assert.equal(report.top10_files[0].name, 'Boardwalk.Empire.S01E01.720p.HDTV.x264-IMMERSE.mkv');
          assert.equal(report.top10_folders.length, 10);
          assert.ok(report.top10_folders[0].size > 3e9);
          return assert.equal(report.top10_folders[0].name, 'Boardwalk Empire');
        }
      },
      'call to supports_ddl_of with ddl URL': {
        topic: function(client) {
          return client.supports_ddl_of(hotfile_url);
        },
        'should return true': equals(true)
      },
      'call to supports_ddl_of with unsupported ddl URL': {
        topic: function(client) {
          return client.supports_ddl_of("http://filesonic.com/dl/...");
        },
        'should return false': equals(false)
      },
      'call to extract_urls_from_text': {
        topic: call_to('extract_urls_from_text', "dl <a href='" + hotfile_url + "'>here:</a> or here: " + jquery_url + " !"),
        'should return 2 download links': function(res) {
          return assert.ok(res instanceof Array);
        }
      },
      'call to extract_urls_from_url': {
        topic: call_to('extract_urls_from_url', "http://freebooksource.info/blogroll/the-accidental-billionaires-the-founding-of-facebook-a-tale-of-sex-money-genius-and-betrayal/"),
        'should return 2 download links': function(res) {
          return assert.ok(res instanceof Array);
        }
      }
    }
  });
  suite.addBatch({
    'lifecycle': {
      topic: new PutIO(process.env['PUTIO_TEST_KEY'], process.env['PUTIO_TEST_SECRET']),
      '-> list_transfers': {
        topic: call_to('list_transfers'),
        'should not already contain the test urls': function(transfers) {
          var transfer_names;
          assert.strictEqual(typeof transfers.length, 'number');
          transfer_names = _(transfers).pluck('name');
          assert.ok(!_(transfer_names).include('jquery'));
          return assert.ok(!_(transfer_names).include('micro_hebdo_24_february_2011.pdf'));
        },
        '-> add_transfers': {
          topic: call_to('add_transfers', [jquery_url, hotfile_url]),
          'should return 2 started tranfers': function(started_transfers) {
            assert.ok(started_transfers);
            return assert.strictEqual(started_transfers.length, 2);
          },
          '-> list_transfers': {
            topic: call_to('list_transfers'),
            'should mention micro hebdo and hand back its ID': function(transfers) {
              var micro_hebdo;
              micro_hebdo = _(transfers).detect(function(t) {
                return t.name === "micro_hebdo_24_february_2011.pdf";
              });
              assert.ok(micro_hebdo);
              suite.micro_hebdo_id = micro_hebdo.id;
              return assert.ok(micro_hebdo.id);
            },
            '-> cancel_transfer on micro_hebdo': {
              topic: function() {
                var client, topics, _i;
                topics = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), client = arguments[_i++];
                client.cancel_transfer(suite.micro_hebdo_id, this.callback);
                return;
              },
              'should succeed': function(transfers) {
                return null;
              },
              '-> list_transfers': {
                topic: call_to('list_transfers'),
                'should confirm the hotfile download cancellation': function(transfers) {
                  var micro_hebdo;
                  micro_hebdo = _(transfers).detect(function(t) {
                    return t.name === "micro_hebdo_24_february_2011.pdf";
                  });
                  return assert.ok(!micro_hebdo);
                }
              }
            }
          }
        }
      }
    }
  });
}).call(this);
