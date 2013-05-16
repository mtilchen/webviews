WV.init(function(win) {

  // The second argument to 'load' is a WV.Controller config object.
  WV.load('simpleview.json', {
    // In-line controller and responder implementations
    viewDidLoad: function(view) {
      /*
         By the time this is called our "refs" are set up. Any views/subviews in the view we loaded
         that declared a "ref" property are available in this controller's "refs" object.
         ie: this.refs['refname']
     */
      win.addSubview(view);
    },
    mouseEntered: function(e) {
      // Is the view with the ref named "simple" the target of this event?
      if (e.target === this.refs['simple']) {
        e.target.setStyle('color', 'lightgray');
      }
    },
    mouseExited: function(e) {
      if (e.target === this.refs['simple']) {
        e.target.setStyle('color', 'gray');
      }
    }
  });

});