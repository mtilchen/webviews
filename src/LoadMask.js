
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
  },
  show: function() {
    if (this.superView !== this.owner) {
      var size = this.owner.getSize();
      this.setSize(size.w, size.h);
      this.owner.addSubview(this);
      WV.debug('Showing mask for: ' + this.owner.id);
    }
  },
  hide: function() {
    this.removeFromSuperView();
    WV.debug('Hiding mask for: ' + this.owner.id);
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