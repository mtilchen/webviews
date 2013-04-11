(function() {


  var imageViewRefs = {}; // Keep track of image use by view via "reference count"

  WV.Image = WV.extend(Object, {
      vtype: 'image',
      preserveAspect: 'width',
      loaded: false,
      useNaturalSize: false,
      naturalWidth: 0,
      naturalHeight: 0,

      constructor: function(config, ownerView) {
        if (typeof config === 'string') {
          config = { src: config };
        }
        WV.apply(this, config);

        // Assign an owner if one is supplied
        this.ownerView = ownerView || this.ownerView;

        this._image = new Image();

        // Do this async so that observers have a chance to listen for 'imagerequest'
        var me = this;
        setTimeout(function() {
          me.load();
        }, 5);
      },

      draw: function(ctx, rect) {
        var w = (this.useNaturalSize || this.useNaturalWidth) ? this.naturalWidth : this.w || rect.w,
          h = (this.useNaturalSize || this.useNaturalHeight) ? this.naturalHeight : this.h || rect.h,
          x = this.x || 0,
          y = this.y || 0,
          sr = this.srcRect;

        if (this.loaded) {
          if (this.pattern) {
            if (typeof this.pattern === 'string') {
              this.pattern = ctx.createPattern(this._image, this.pattern);
            }
            ctx.fillStyle = this.pattern;
            ctx.fillRect(x, y, w, h);
          }
          else if (sr) {
            ctx.drawImage(this._image, sr.x, sr.y, sr.w, sr.h, x, y, w, h);
          }
          else {
            ctx.drawImage(this._image, x, y, w, h);
          }
        }
        else { WV.debug('Image not loaded: ' + this.id); }
      },

      load: function() {
        if (!this._image || this._loadRequest) { return; }

        this._loadRequest = true;
        Ext.EventManager.addListener(this._image, 'load', function(e, img) {
          this.naturalHeight = img.height;
          this.naturalWidth = img.width;
          this.loaded = true;

          if (this.ownerView) {
            this.ownerView.setNeedsDisplay();
            var count = imageViewRefs[this.ownerView.id] - 1;
            imageViewRefs[this.ownerView.id] = Math.max(0, count);
            this.ownerView.fireEvent('imageload', this.ownerView, this, count);
          }
          this.onLoad(this.ownerView, this._image);
        }, this, { single: true });
        if (this.ownerView) {
          var count = imageViewRefs[this.ownerView.id] = imageViewRefs[this.ownerView.id] || 0;
          imageViewRefs[this.ownerView.id] = count + 1;
          this.ownerView.fireEvent('imagerequest', this.ownerView, this, count);
        }
        this._image.src = this.src;
      },

      onLoad: function(owner, img) {}

    //    setHeight: function(h)
    //    {
    //        return this.setSize(h, this.w);
    //    },
    //
    //    setWidth: function(w)
    //    {
    //        return this.setSize(this.h, w);
    //    },
    //
    //    setSize: function(w, h)
    //    {
    //        if (!this.loaded)
    //        {
    //            return WV.ImageView.superclass.setSize.call(this, w, h);
    //        }
    //        else if (this.preserveAspect === 'width')
    //        {
    //            if (typeof w === 'string')
    //            {
    //                w = this.convertRelative('width', w);
    //            }
    //            WV.ImageView.superclass.setSize.call(this, w, this.naturalHeight / this.naturalWidth * w);
    //        }
    //        else if (this.preserveAspect === 'height')
    //        {
    //            if (typeof h === 'string')
    //            {
    //                h = this.convertRelative('height', h);
    //            }
    //            WV.ImageView.superclass.setSize.call(this, this.naturalWidth / this.naturalHeight * h, h);
    //        }
    //        else
    //        {
    //            WV.ImageView.superclass.setSize.call(this, w, h);
    //        }
    //        return this;
    //    },
    //    setNaturalSize: function()
    //    {
    //        return this.setSize(this.naturalWidth, this.naturalHeight);
    //    }
  });

  WV.Image.getUnloadedCount = function(viewid) {
    return imageViewRefs[viewid];
  }
})();
