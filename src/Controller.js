
WV.Controller = WV.extend(Object, {
  vtype: 'controller',
  mixins: [WV.Responder],
  constructor: function(config, view) {

    config = config || {};
    WV.apply(this, config);

    this.refs = {};

    if (this.view) {
      this.setView(this.view);
    }
  },

  setView: function(view) {
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

    var me = this;
    setTimeout(function() {
      me.enterResponderChain();
      me.establishConnections();
      me.viewDidLoad(me.view);
    }, 0);
  },

  viewDidLoad: function(view) {},

  establishConnections: function(view) {
    var v = view || this.view,
        me = this,
        i, len;

    if (!v) { return; }

    // Add refs
    if (typeof v.ref === 'string') {
      this.refs[v.ref] = this.refs[v.ref] || v;  // Use the first ref we find for a name and do not overwrite. Warn?
    }

    // Add actions
    // TODO: Support 'target' as a key-path into this controller
    // TODO: Action defs should be normalized to an object literal: { 'ename': 'methodname' } or  { 'ename': { 'action': 'methodname', 'target': 'target.key.path' } }
    if (typeof v.actions === 'string' || Array.isArray(v.actions)) {
      var actionCfgs = Array.isArray(v.actions) ? v.actions : [v.actions];

      // Actions defined as "eventname" ":" "methodname"
      actionCfgs.forEach(function(action) {
        var cfg = action.split(':'),
            eName =  (cfg[0] || '').trim(),
            method = (cfg[1] || '').trim();

        if (eName && method && (typeof me[method] === 'function')) {
          // Run the event handler in the scope of this controller
          v.addListener(eName, me[method], me);
        }
      });
    }
    for (i = 0, len = v.subviews.length; i < len; i++ ) {
      this.establishConnections(v.subviews[i]);
    }
  },

  enterResponderChain: function() {
    if (!this.view) { return; }

    if (this.view.nextResponder instanceof WV.View) {
      this.nextResponder = this.view.nextResponder;
      this.view.nextResponder = this;
    }
    else {
      this.view.nextResponder = this;
    }
  }
});