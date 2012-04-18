
request  = require 'request'
async    = require 'async'
_ = require('underscore')._

sys      = require 'sys'
inspect  = require 'inspect'
puts     = sys.puts

class PutIO
  constructor: (key, secret, debug) ->
    [@key, @secret] = [key, secret]
    @debug = debug || false
  
  debug = -> console.log.apply(null, arguments) if @debug 
  
  wrap = (original_callback, adapter) ->
    # return a replacement callback
    (err, res1, res2, res...) ->
      # sys.puts "wrapping callback called:"
      # inspect err: err, res1: res1, res2: res2, other: res
      return original_callback(err) if err
      adapted_result = adapter(res1, res2, res...)
      # sys.puts "adapted_result: "
      # inspect adapted_result
      original_callback null, adapted_result

  before = wrap
  
  pick_first_item = (array) -> array[0]
  restrict_to     = (property_name) -> (res) -> res[property_name]
  
  request: (resource, method, params, callback) ->
    unless callback
      callback = params
      params = {}
    req_params = 
      "api_key":    @key
      "api_secret": @secret
      "params":     params
    body = "request=" + JSON.stringify(req_params)
    url = "http://api.put.io/v1/#{resource}?method=#{method}&#{body}".replace(/\"/g, "%22")
    debug "Requesting #{url}:"
    request {
      uri: url
      headers:
        'Accept': 'application/json'
    }, (error, response, body) =>
      if error
        debug "Error during HTTP request to #{url}: #{sys.inspect error}"
        return callback
          error: true
          error_message: 'Unable to connect to the Put.io API endpoint.'
      try
        resp = JSON.parse body
      catch error
        debug "Error while parsing put.io response: '#{body}'"
        return callback
          error: true
          error_message: 'Error while parsing the put.io response.'
          body: body
        
      if resp.error
        debug "Put.io errored: '#{resp.error_message}'"
        return callback resp
      
      debug "Successfully requested #{url}..."
      debug body
      callback null, resp.response.results, resp.response

  user_info: (callback) =>
    @request 'user', 'info',
      before callback, pick_first_item
  
  user_friends: (callback) =>
    @request 'user', 'friends',
      callback

  get_access_token: (callback) =>
    @request 'user', 'acctoken',
      before callback, restrict_to 'token'
  
  list_subscriptions: (callback) =>
    @request 'subscriptions', 'list', callback
  
  subscription_info: (id, callback) =>
    @request 'subscriptions', 'info', {id: id},
      before callback, pick_first_item

  analyze_urls: (urls, callback) =>
    @request 'urls', 'analyze', {links: urls},
      before callback, restrict_to 'items'
    
  analyze_url: (url, callback) =>
    @request 'urls', 'analyze', {links: [url]},
      before callback, (res) ->
        items = [ res.items.singleurl...
                , res.items.multiparturl...
                , res.items.torrent...
                , res.items.error... ]
        items[0]

  extract_urls: (url_opt, text_opt, callback) =>
    @request 'urls', 'extracturls', {url: url_opt, txt: escape(text_opt)}, callback
  
  extract_urls_from_text: (text, callback) =>
    @extract_urls(null, text, callback)

  extract_urls_from_url: (url, callback) =>
    @extract_urls(url, null, callback)
  
  list_transfers: (callback) ->  @request 'transfers', 'list', callback

  add_transfer: (link, callback) ->
    @request 'transfers', 'add', {links: [link]},
    before callback, pick_first_item

  add_transfers: (links, callback) ->  @request 'transfers', 'add', {links: links}, callback
  cancel_transfer: (id, callback) ->  @request 'transfers', 'cancel', {id: id}, callback
  
  list_messages: (callback) ->  @request 'messages', 'list', callback
  delete_message: (id, callback) ->  @request 'messages', 'delete', {id: id}, callback
  
  # Example of directory descriptionhash: 
  #
  #     {
  #       dirs: [...],
  #       name: 'Chuck',
  #       default_shared: null,
  #       parent_id: '0',
  #       shared: null,
  #       id: '11828782'
  #     } 
  get_directory_map: (callback) ->
    @request 'files', 'dirmap', callback

  list_directory: (directory_id, callback) ->
    @request 'files', 'list', {parent_id: directory_id}, callback

  delete_file: (file_id, callback) ->
    @request 'files', 'delete', {id: file_id}, callback
  
  walk_dirs = (node, iterator) ->
    iterator node
    _(node.dirs).map (child) ->
      walk_dirs child, iterator
  walk_children = (node, iterator) ->
    iterator node
    _(node.children).map (child) ->
      walk_children child, iterator
  
  all_files = (tree) ->
    list = []
    walk_children tree, (node) ->
      list.push node unless node.is_dir
    list
  
  all_dirs = (tree) ->
    list = []
    walk_children tree, (node) ->
      list.push node if node.is_dir
    list
  
  sum_fn = (n, acc) -> (+n) + +acc
  aggregate_sizes = (node) ->
    node.size = +(node.size || 0)
    if node.children?.length > 0
      node.size = _(_(node.children).map(aggregate_sizes)).inject(sum_fn, 0)
    return node.size
    
  fs_dump: (callback) ->
    @get_directory_map (err, tree) =>
      return callback(err) if err
      ls_requests = {}
      walk_dirs tree, (dir) =>
        console.log "-> Asking for list of dir #{dir}"
        ls_requests[dir.id] = _.bind @list_directory, @, dir.id
      async.parallel ls_requests, (err, ls_results) =>
        return callback(err) if err
        new_tree = _.extend {is_dir: yes}, _.clone(tree)
        delete new_tree.dirs
        walk_children new_tree, (node) ->
          # WARNING: Put.io API problem -> some folders are not listed in with '/files/dirmap'
          node.children = ls_results[node.id]?[0] if node.is_dir
        aggregate_sizes new_tree
        callback(err, new_tree)

  report_disk_usage: (callback) ->
    @fs_dump (err, tree) =>
      return callback(err) if err
      total_size = tree.size
      top10_by_size = (list) -> _(list).sortBy((node) -> -node.size).slice(0, 10)
      add_percentage = (file) -> file.percents = (file.size * 100.0 / tree.size).toFixed(2) + " %"
      
      top10_files = top10_by_size(all_files(tree))
      top10_files.forEach add_percentage
      top10_folders = top10_by_size(all_dirs(tree).slice(1))
      top10_folders = _(top10_folders).map (node) ->
        node = _.clone(node)
        add_percentage(node)
        delete node.children
        node
      
      
      callback null, used: total_size, top10_files: top10_files, top10_folders: top10_folders
      
  
  # to access it when testing
  @wrap: wrap
  @walk_dirs: walk_dirs


PutIO::SUPPORTED_DDL_SITES = ///^http(s?)://(
     rapidshare\.com
  |  hotfile\.com
  |  megaupload\.com
  |  mediafire\.com
  |  uploaded.to
  |  netload.in
  |  fileserve.com
  )///i

PutIO::supports_ddl_of = (url) -> PutIO::SUPPORTED_DDL_SITES.test url

exports.PutIO = PutIO
