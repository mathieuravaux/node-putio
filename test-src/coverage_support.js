//
//  Extracted from expresso, reformat to put in a node module
//  Perhaps as an extension to vows
//  Anyway, this is awesome to have in expresso
//

var sys = require("sys")
process.on('exit', function() {
  function print(str){
      sys.error(colorize(str));
  }

  /**
   * Colorize the given string using ansi-escape sequences.
   * Disabled when --boring is set.
   *
   * @param {String} str
   * @return {String}
   */

  function colorize(str){
      var colors = { bold: 1, red: 31, green: 32, yellow: 33 };
      return str.replace(/\[(\w+)\]\{([^]*?)\}/g, function(_, color, str){
          return '\x1B[' + colors[color] + 'm' + str + '\x1B[0m';
      });
  }
  /**
   * Pad the given string to the maximum width provided.
   *
   * @param  {String} str
   * @param  {Number} width
   * @return {String}
   */

  function lpad(str, width) {
      str = String(str);
      var n = width - str.length;
      if (n < 1) return str;
      while (n--) str = ' ' + str;
      return str;
  }

  /**
   * Pad the given string to the maximum width provided.
   *
   * @param  {String} str
   * @param  {Number} width
   * @return {String}
   */

  function rpad(str, width) {
      str = String(str);
      var n = width - str.length;
      if (n < 1) return str;
      while (n--) str = str + ' ';
      return str;
  }
  function populateCoverage(cov) {
      cov.LOC =
      cov.SLOC =
      cov.totalFiles =
      cov.totalHits =
      cov.totalMisses =
      cov.coverage = 0;
      for (var name in cov) {
          var file = cov[name];
          if (Array.isArray(file)) {
              // Stats
              ++cov.totalFiles;
              cov.totalHits += file.totalHits = coverage(file, true);
              cov.totalMisses += file.totalMisses = coverage(file, false);
              file.totalLines = file.totalHits + file.totalMisses;
              cov.SLOC += file.SLOC = file.totalLines;
              if (!file.source) file.source = [];
              cov.LOC += file.LOC = file.source.length;
              file.coverage = (file.totalHits / file.totalLines) * 100;
              // Source
              var width = file.source.length.toString().length;
              file.source = file.source.map(function(line, i){
                  ++i;
                  var hits = file[i] === 0 ? 0 : (file[i] || ' ');
                      if (hits === 0) {
                          hits = '\x1b[31m' + hits + '\x1b[0m';
                          line = '\x1b[41m' + line + '\x1b[0m';
                      } else {
                          hits = '\x1b[32m' + hits + '\x1b[0m';
                      }
                  return '\n     ' + lpad(i, width) + ' | ' + hits + ' | ' + line;
              }).join('');
          }
      }
      cov.coverage = (cov.totalHits / cov.SLOC) * 100;
  }
  
  function coverage(data, val) {
      var n = 0;
      for (var i = 0, len = data.length; i < len; ++i) {
          if (data[i] !== undefined && data[i] == val) ++n;
      }
      return n;
  }

  function reportCoverage(cov) {
      // Stats
      print('\n   [bold]{Test Coverage}\n');
      var sep = '   +------------------------------------------+----------+------+------+--------+',
          lastSep = '                                              +----------+------+------+--------+';
      sys.puts(sep);
      sys.puts('   | filename                                 | coverage | LOC  | SLOC | missed |');
      sys.puts(sep);
      for (var name in cov) {
          var file = cov[name];
          if (Array.isArray(file)) {
              sys.print('   | ' + rpad(name, 40));
              sys.print(' | ' + lpad(file.coverage.toFixed(2), 8));
              sys.print(' | ' + lpad(file.LOC, 4));
              sys.print(' | ' + lpad(file.SLOC, 4));
              sys.print(' | ' + lpad(file.totalMisses, 6));
              sys.print(' |\n');
          }
      }
      sys.puts(sep);
      sys.print('     ' + rpad('', 40));
      sys.print(' | ' + lpad(cov.coverage.toFixed(2), 8));
      sys.print(' | ' + lpad(cov.LOC, 4));
      sys.print(' | ' + lpad(cov.SLOC, 4));
      sys.print(' | ' + lpad(cov.totalMisses, 6));
      sys.print(' |\n');
      sys.puts(lastSep);
      // Source
      for (var name in cov) {
          if (name.match(/\.js$/)) {
              var file = cov[name];
              if ((file.coverage < 100) || !quiet) {
                 print('\n   [bold]{' + name + '}:');
                 print(file.source);
                 sys.print('\n');
              }
          }
      }
  }

  if (typeof _$jscoverage === 'object') {
    console.log("We should report the coverage !!!");
    populateCoverage(_$jscoverage);
    reportCoverage(_$jscoverage);
  }
});