(function() {
  var PutIO, async, inspect, puts, request, sys, _;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  request = require('request');
  async = require('async');
  _ = require('underscore')._;
  sys = require('sys');
  inspect = require('inspect');
  puts = sys.puts;
  PutIO = (function() {
    var aggregate_sizes, all_dirs, all_files, before, debug, pick_first_item, restrict_to, sum_fn, walk_children, walk_dirs, wrap;
    function PutIO(key, secret, debug) {
      this.extract_urls_from_url = __bind(this.extract_urls_from_url, this);
      this.extract_urls_from_text = __bind(this.extract_urls_from_text, this);
      this.extract_urls = __bind(this.extract_urls, this);
      this.analyze_url = __bind(this.analyze_url, this);
      this.analyze_urls = __bind(this.analyze_urls, this);
      this.subscription_info = __bind(this.subscription_info, this);
      this.list_subscriptions = __bind(this.list_subscriptions, this);
      this.get_access_token = __bind(this.get_access_token, this);
      this.user_friends = __bind(this.user_friends, this);
      this.user_info = __bind(this.user_info, this);
      var _ref;
      _ref = [key, secret], this.key = _ref[0], this.secret = _ref[1];
      this.debug = debug || false;
    }
    debug = function() {
      if (this.debug) {
        return console.log.apply(null, arguments);
      }
    };
    wrap = function(original_callback, adapter) {
      return function() {
        var adapted_result, err, res, res1, res2;
        err = arguments[0], res1 = arguments[1], res2 = arguments[2], res = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
        if (err) {
          return original_callback(err);
        }
        adapted_result = adapter.apply(null, [res1, res2].concat(__slice.call(res)));
        return original_callback(null, adapted_result);
      };
    };
    before = wrap;
    pick_first_item = function(array) {
      return array[0];
    };
    restrict_to = function(property_name) {
      return function(res) {
        return res[property_name];
      };
    };
    PutIO.prototype.request = function(resource, method, params, callback) {
      var body, req_params, url;
      if (!callback) {
        callback = params;
        params = {};
      }
      req_params = {
        "api_key": this.key,
        "api_secret": this.secret,
        "params": params
      };
      body = "request=" + JSON.stringify(req_params);
      url = ("http://api.put.io/v1/" + resource + "?method=" + method + "&" + body).replace(/\"/g, "%22");
      debug("Requesting " + url + ":");
      return request({
        uri: url,
        headers: {
          'Accept': 'application/json'
        }
      }, __bind(function(error, response, body) {
        var resp;
        if (error) {
          debug("Error during HTTP request to " + url + ": " + (sys.inspect(error)));
          return callback({
            error: true,
            error_message: 'Unable to connect to the Put.io API endpoint.'
          });
        }
        try {
          resp = JSON.parse(body);
        } catch (error) {
          debug("Error while parsing put.io response: '" + body + "'");
          return callback({
            error: true,
            error_message: 'Error while parsing the put.io response.',
            body: body
          });
        }
        if (resp.error) {
          debug("Put.io errored: '" + resp.error_message + "'");
          return callback(resp);
        }
        debug("Successfully requested " + url + "...");
        debug(body);
        return callback(null, resp.response.results, resp.response);
      }, this));
    };
    PutIO.prototype.user_info = function(callback) {
      return this.request('user', 'info', before(callback, pick_first_item));
    };
    PutIO.prototype.user_friends = function(callback) {
      return this.request('user', 'friends', callback);
    };
    PutIO.prototype.get_access_token = function(callback) {
      return this.request('user', 'acctoken', before(callback, restrict_to('token')));
    };
    PutIO.prototype.list_subscriptions = function(callback) {
      return this.request('subscriptions', 'list', callback);
    };
    PutIO.prototype.subscription_info = function(id, callback) {
      return this.request('subscriptions', 'info', {
        id: id
      }, before(callback, pick_first_item));
    };
    PutIO.prototype.analyze_urls = function(urls, callback) {
      return this.request('urls', 'analyze', {
        links: urls
      }, before(callback, restrict_to('items')));
    };
    PutIO.prototype.analyze_url = function(url, callback) {
      return this.request('urls', 'analyze', {
        links: [url]
      }, before(callback, function(res) {
        var items;
        items = __slice.call(res.items.singleurl).concat(__slice.call(res.items.multiparturl), __slice.call(res.items.torrent), __slice.call(res.items.error));
        return items[0];
      }));
    };
    PutIO.prototype.extract_urls = function(url_opt, text_opt, callback) {
      return this.request('urls', 'extracturls', {
        url: url_opt,
        txt: escape(text_opt)
      }, callback);
    };
    PutIO.prototype.extract_urls_from_text = function(text, callback) {
      return this.extract_urls(null, text, callback);
    };
    PutIO.prototype.extract_urls_from_url = function(url, callback) {
      return this.extract_urls(url, null, callback);
    };
    PutIO.prototype.list_transfers = function(callback) {
      return this.request('transfers', 'list', callback);
    };
    PutIO.prototype.add_transfer = function(link, callback) {
      return this.request('transfers', 'add', {
        links: [link]
      }, before(callback, pick_first_item));
    };
    PutIO.prototype.add_transfers = function(links, callback) {
      return this.request('transfers', 'add', {
        links: links
      }, callback);
    };
    PutIO.prototype.cancel_transfer = function(id, callback) {
      return this.request('transfers', 'cancel', {
        id: id
      }, callback);
    };
    PutIO.prototype.list_messages = function(callback) {
      return this.request('messages', 'list', callback);
    };
    PutIO.prototype.delete_message = function(id, callback) {
      return this.request('messages', 'delete', {
        id: id
      }, callback);
    };
    PutIO.prototype.get_directory_map = function(callback) {
      return this.request('files', 'dirmap', callback);
    };
    PutIO.prototype.list_directory = function(directory_id, callback) {
      return this.request('files', 'list', {
        parent_id: directory_id
      }, callback);
    };
    walk_dirs = function(node, iterator) {
      iterator(node);
      return _(node.dirs).map(function(child) {
        return walk_dirs(child, iterator);
      });
    };
    walk_children = function(node, iterator) {
      iterator(node);
      return _(node.children).map(function(child) {
        return walk_children(child, iterator);
      });
    };
    all_files = function(tree) {
      var list;
      list = [];
      walk_children(tree, function(node) {
        if (!node.is_dir) {
          return list.push(node);
        }
      });
      return list;
    };
    all_dirs = function(tree) {
      var list;
      list = [];
      walk_children(tree, function(node) {
        if (node.is_dir) {
          return list.push(node);
        }
      });
      return list;
    };
    sum_fn = function(n, acc) {
      return (+n) + +acc;
    };
    aggregate_sizes = function(node) {
      var _ref;
      node.size = +(node.size || 0);
      if (((_ref = node.children) != null ? _ref.length : void 0) > 0) {
        node.size = _(_(node.children).map(aggregate_sizes)).inject(sum_fn, 0);
      }
      return node.size;
    };
    PutIO.prototype.fs_dump = function(callback) {
      return this.get_directory_map(__bind(function(err, tree) {
        var ls_requests;
        if (err) {
          return callback(err);
        }
        ls_requests = {};
        walk_dirs(tree, __bind(function(dir) {
          return ls_requests[dir.id] = _.bind(this.list_directory, this, dir.id);
        }, this));
        return async.parallel(ls_requests, __bind(function(err, ls_results) {
          var new_tree;
          if (err) {
            return callback(err);
          }
          new_tree = _.extend({
            is_dir: true
          }, _.clone(tree));
          delete new_tree.dirs;
          walk_children(new_tree, function(node) {
            var _ref;
            if (node.is_dir) {
              return node.children = (_ref = ls_results[node.id]) != null ? _ref[0] : void 0;
            }
          });
          aggregate_sizes(new_tree);
          return callback(err, new_tree);
        }, this));
      }, this));
    };
    PutIO.prototype.report_disk_usage = function(callback) {
      return this.fs_dump(__bind(function(err, tree) {
        var add_percentage, top10_by_size, top10_files, top10_folders, total_size;
        if (err) {
          return callback(err);
        }
        total_size = tree.size;
        top10_by_size = function(list) {
          return _(list).sortBy(function(node) {
            return -node.size;
          }).slice(0, 10);
        };
        add_percentage = function(file) {
          return file.percents = (file.size * 100.0 / tree.size).toFixed(2) + " %";
        };
        top10_files = top10_by_size(all_files(tree));
        top10_files.forEach(add_percentage);
        top10_folders = top10_by_size(all_dirs(tree).slice(1));
        top10_folders = _(top10_folders).map(function(node) {
          node = _.clone(node);
          add_percentage(node);
          delete node.children;
          return node;
        });
        return callback(null, {
          used: total_size,
          top10_files: top10_files,
          top10_folders: top10_folders
        });
      }, this));
    };
    PutIO.wrap = wrap;
    PutIO.walk_dirs = walk_dirs;
    return PutIO;
  })();
  PutIO.prototype.SUPPORTED_DDL_SITES = /^http(s?):\/\/(rapidshare\.com|hotfile\.com|megaupload\.com|mediafire\.com|uploaded.to|netload.in|fileserve.com)/i;
  PutIO.prototype.supports_ddl_of = function(url) {
    return PutIO.prototype.SUPPORTED_DDL_SITES.test(url);
  };
  exports.PutIO = PutIO;
}).call(this);
