
WV.LoadMask = WV.extend(WV.View, {
  vtype: 'loadmask',
  /**
   * @property incompleteCount
   * @readonly
   */
  /**
   * @property owner
   * @readonly
   */
  autoResizeMask: WV.RESIZE_WIDTH_FLEX | WV.RESIZE_HEIGHT_FLEX,
  autoMaskImageLoading: false,
  drawOwnerWhileShowing: true,
  initiallyShowing: false,

  style: {
    color: 'rgba(0,0,0,0.5)'
  },
  constructor: function(config) {
    this.incompleteCount = 0;
    WV.LoadMask.superclass.constructor.call(this, config);
    if (!(config.owner instanceof WV.View)) {
      throw '"owner" property of mask must be a WV.View';
    }

    // Automatically show this mask as images are loaded in the owner and its descendants
    if (this.autoMaskImageLoading) {
      this.owner.addListener('imagerequest', function(view, image, count) {
        this.incompleteCount++;
        WV.debug("Increment count for " + this.owner.id + ': ' + this.incompleteCount);
        if (this.incompleteCount > 0) {
          this.show();
        }
      }, this);

      this.owner.addListener('imageload', function(view, image, count) {
        if (this.incompleteCount > 0) {
          this.incompleteCount--;
          WV.debug("Decrement count for " + this.owner.id + ': ' + this.incompleteCount);
        }
        if (this.incompleteCount === 0) {
          this.hide();
        }
      }, this);
    }

    if (this.initiallyShowing) {
      this.show();
    }
  },
  show: function() {
    if (!this.isShowing()) {
      var size = this.owner.getSize(),
          me = this;

      this.setSize(size.w, size.h);
      this.setHidden(true);
      this.owner.addSubview(this);
      this._timeoutRef = setTimeout(function() {
        me.setHidden(false);
      }, 50);

      WV.debug('Showing mask for: ' + this.owner.id);
    }
  },
  hide: function() {
    clearTimeout(this._timeoutRef);
    this._timeoutRef = undefined;

    if (this.isShowing()) {
      this.removeFromSuperView();
    }

    WV.debug('Hiding mask for: ' + this.owner.id);
  },

  isShowing: function() {
    return this.superView === this.owner;
  },

  // Swallow all events
  mouseDown: function() {},
  mouseMove: function() {},
  mouseUp: function() {},
  mouseDragged: function() {},
  mouseEntered: function() {},
  mouseExited: function() {},
  mouseWheel: function() {},
  click: function() {},
  contextMenu: function() {},
  dragStart: function() {},
  drag: function() {},
  dragEnd: function() {},
  keyDown: function() {},
  keyUp: function() {},
  touchesBegan: function() {},
  touchesMoved: function() {},
  touchesEnded: function() {},
  touchesCancelled: function() {}
});

WV.AppLoadMask = WV.extend(WV.LoadMask, {
  vtype: 'apploadmask',
  autoMaskImageLoading: true,
  drawOwnerWhileShowing: false,
  initiallyShowing: true
});