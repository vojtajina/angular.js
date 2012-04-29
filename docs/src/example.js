var seqCount = 0;

function ids(list) {
  return list.map(function(item) { return item.id; }).join(' ');
};


exports.Example = function() {
  this.module = '';
  this.deps = ['angular.js'];
  this.html = [];
  this.css = [];
  this.js = [];
  this.unit = [];
  this.scenario = [];
}

exports.Example.prototype.addSource = function(name, content) {
  var ext = name == 'scenario.js' ? 'scenario' : name.split('.')[1],
      id = name + '-' + (seqCount++);
  
  this[ext].push({name: name, content: content, id: id});
  if (name.match(/\.js$/)) {
    this.deps.push(name);
  }
};

exports.Example.prototype.toHtml = function() {
  return '<h1>Demo Source Code</h1>\n' +
          this.toHtmlEdit() +
          this.toHtmlTabs() +
          '<h1>Demo Source Code</h1>\n' +
          this.toHtmlEmbed();
};


exports.Example.prototype.toHtmlEdit = function() {
  var out = [];
  out.push('<div source-edit="' + this.module + '"');
  out.push(' source-edit-html="' + ids(this.html) + '"');
  out.push(' source-edit-css="' + ids(this.css) + '"');
  out.push(' source-edit-js="' + ids(this.js) + '"');
  out.push(' source-edit-unit="' + ids(this.unit) + '"');
  out.push(' source-edit-scenario="' + ids(this.scenario) + '"');
  out.push('></div>\n');
  return out.join('');
};

exports.Example.prototype.toHtmlTabs = function() {
  var out = [],
      self = this;

  out.push('<div class="tabbable">');
  htmlTabs(this.html);
  htmlTabs(this.css);
  htmlTabs(this.js);
  htmlTabs(this.unit);
  htmlTabs(this.scenario);
  out.push('</div>');
  return out.join('');

  function htmlTabs(sources) {
    sources.forEach(function(source) {
      var wrap = '';

      if (source.name === 'index.html') {
        wrap = ' ng-html-wrap="' + self.module + ' ' + ids(self.deps) + '"';
      }

      out.push(
        '<div class="tab-pane" title="' + source.name + '">\n' +
          '<pre class="prettyprint linenums" ng-set-text="' + source.id + '"' + wrap + '></pre>\n' +
          '<script type="text" id="' + source.id + '">' + source.content + '</script>\n' +
        '</div>\n');
    });
  }
};

exports.Example.prototype.toHtmlEmbed = function() {
  var out = [];
  out.push('<div class="well"');
  out.push(' ng-embed-app="' + this.module + '"');
  out.push(' ng-set-html="' + this.html[0].id + '"');
  out.push(' ng-eval-javascript="' + ids(this.js) + '">')
  out.push('</div>');
  return out.join('');
};

