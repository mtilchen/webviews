
WV.Controller = WV.extend(Object, {
  vtype: 'controller',
  mixins: [WV.Responder],
  constructor: function(config, view) {

    config = config || {};
    WV.apply(this, config);

    if (typeof view === 'object') {  // We got a view instance
      if (view instanceof WV.View) {
        this.view = view;
      }
      else if (view !== null) {  // We got a config object
        this.view = WV.create(view.vtype, view);
      }
      else {
        throw 'View parameter must not be null';
      }
    }
    else if (typeof view === 'string') {  // We got a JSON string config
      var obj = JSON.parse(view);
      this.view = WV.create(obj.vtype, obj);
    }

    else { throw 'View parameter must be an instance of WV.View, a view config object or a JSON string'; }

    this.refs = {};

    var me = this;
    setTimeout(function() {
      me.enterResponderChain();
      me.establishConnections();
      me.init();
    }, 0);
  },

  init: function() {},

  establishConnections: function(view) {
    var v = view || this.view,
        i, len;
    if (typeof v.ref === 'string') {
      this.refs[v.ref] = this.refs[v.ref] || v;  // Use the first ref we find for a name and do not overwrite. Warn?
    }
    for (i = 0, len = v.subviews.length; i < len; i++ ) {
      this.establishConnections(v.subviews[i]);
    }
  },

  enterResponderChain: function() {
    if (this.view.nextResponder instanceof WV.View) {
      this.nextResponder = this.view.nextResponder;
      this.view.nextResponder = this;
    }
    else {
      this.view.nextResponder = this;
    }
  }
});