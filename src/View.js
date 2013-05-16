
WV.RESIZE_NONE        = 0;
WV.RESIZE_LEFT_FLEX   = 1 << 0;
WV.RESIZE_RIGHT_FLEX  = 1 << 1;
WV.RESIZE_TOP_FLEX    = 1 << 2;
WV.RESIZE_BOTTOM_FLEX = 1 << 3;
WV.RESIZE_WIDTH_FLEX  = 1 << 4;
WV.RESIZE_HEIGHT_FLEX = 1 << 5;
WV.RESIZE_ALL = 63;

WV.View = WV.extend(Ext.util.Observable, {
    vtype: 'view',
    mixins: [WV.Responder, WV.Stylable],
    x: 0,
    y: 0,
    h: 0,
    w: 0,
    previousH: 0,
    previousW: 0,
    autoResizeMask: WV.RESIZE_LEFT_FLEX | WV.RESIZE_RIGHT_FLEX |
                    WV.RESIZE_TOP_FLEX  | WV.RESIZE_BOTTOM_FLEX,
    hidden: false,
    resizeSubviews: true,
    clipToBounds: false,
    enabled: true,
    interactionEnabled: true,
    draggable: false,
    stateful: false,
    needsDisplay: false,
    toolTip: undefined,

    style: {},

    subviews: [],

    nextKeyView: null,
    previousKeyView: null,

    constructor: function(config)
    {
        WV.View.superclass.constructor.call(this);

        config = config || {};

        this.id = config.id || WV.id();

        this.enableBubble('imagerequest');
        this.enableBubble('imageload');

        // Merge styles in from the superclass unless we want to override
        if (this.constructor._styleMerged !== true)
        {
            var proto = this.constructor.prototype;

            proto.style = proto.style || {};

            proto.overrideStyle === true ? Ext.apply(proto.style, WV.View.prototype.style)
                                         : Ext.applyIf(proto.style, this.constructor.superclass.style);

            this.constructor._styleMerged = true;
        }

        // Use the merged base style unless we want to override it completely
        var style = Ext.apply({}, config.style);
        Ext.apply(style, WV.View.prototype.style);

        if (config.overrideStyle !== true)
        {
            Ext.applyIf(style, this.constructor.prototype.style);
        }

        var animationConfigs = config.animations;

        Ext.apply(this, config);

        // Overwrite what was in the config because it does contain what we applied to 'style'.
        // We also need to ensure the we will not be writing styles to the prototype in the case that
        // no style property was passed in the config. We will fill the empty value in later
        // in the call to setStyle.
        this.style = {};

        // Animations keyed by their id
        this.animations = {};

        // Put all the subviews we wish to add together (class level and config level, if present) and add them all at once
        var subviewsToAdd =  (this.constructor.prototype.subviews || []).concat(config.subviews || []);
        this.subviews = [];

        // Set the styles and other visual properties
        this.setStyle(style, true);
        this.setHidden(this.hidden);
        this.clipToBounds = !!this.clipToBounds;
        this.setEnabled(this.enabled);

        WV.addToCache(this);

        // If a superView was passed in then size ourself relatively if needed
        if (this.superView)
        {
            this.convertDimensions();
        }

        // m11, m12, m21, m22, tx, ty - Identitity matrix
        this._transform = [1, 0, 0, 1, 0, 0];

        // Add all of our subviews
        for (var i = 0, l = subviewsToAdd.length; i < l; i++)
        {
            this.addSubview(subviewsToAdd[i]);
        }

        if (animationConfigs)
        {
          this.addAnimation(animationConfigs);
        }

        if (this.mask === true) {
          this.mask = new WV.LoadMask({ owner: this });
        }
        // We got a config object for a mask
        else if (this.mask && (typeof this.mask === 'object')
                           && !(this.mask instanceof  WV.LoadMask)) {
          this.mask = WV.create(this.mask.vtype || 'loadmask', WV.apply({ owner: this }, this.mask));
        }

        return this;
    },

    insertSubview: function(view, idx)
    {
        var sv = view.superView,
            subviewCount = this.subviews.length,
            vtag,
            i, l;

        idx = Math.min(idx === undefined ? subviewCount : idx, subviewCount);

        if (!(view instanceof WV.View) && (typeof view === 'object'))
        {
            // Set the superView here so we can convert relative dimensions of the added view its subviews
            // may depend on (created and added recursively by calling the constructor)
            view.superView = this;

            view = view.vtype ? WV.create(view.vtype, view) : new WV.View(view);
        }
        if (this !== sv)
        {
            if (sv)
            {
                view.removeFromSuperView();
            }

            view.superView = this;

            if (view.nextResponder instanceof WV.Controller) {
              view.nextResponder.nextResponder = this;
            }
            else {
              view.nextResponder = this;
            }

            // If the view is stateful then set its state to match that of the new superView if it too is stateful,
            // unless the view has explicitly set its own state
            if (view.stateful === true)
            {
                if (this.stateful && !view.hasOwnProperty('state'))
                {
                    view.setState(this.state, true, true); // shallow = true, force = true
                }
                else
                {
                    view.setState(view.state, true, true); // shallow = true, force = true
                }
            }

            if (this.window)
            {
                if (view.window)
                {
                    // Added to view that already has been drawn
                }
                else
                {
                    view.window = this.window;
                    // Convert percentages to numbers relative to superView in case string configs were used
                    view.convertDimensions();
                }

                // Maintain the keyView loop
                var last = this.window.lastViewAdded;
                if (!last.nextKeyView || last.nextKeyView === this.window)
                {
                    last.setNextKeyView(view);
                }
                if (!view.nextKeyView)
                {
                    view.setNextKeyView(this.window);
                }
                this.window.lastViewAdded = view;
            }
            else
            {
                view.convertDimensions();
            }

            this.subviews.splice(idx, 0, view);
            // re-index
            for (i = idx, l = subviewCount + 1; i < l; i++)
            {
              this.subviews[i].subviewIndex = i;
            }

            // Manage the vtag of the new subview if present. If this view already has a view with the same vtag
            // then turn the reference into an Array and store all siblings with identical vtags in it
            if (typeof view.vtag === 'string')
            {
                vtag = this.subviews[view.vtag];

                if (!vtag)
                {
                    this.subviews[view.vtag] = view;
                }
                else if (WV.isArray(vtag))
                {
                    this.subviews[view.vtag].push(view);
                }
                else
                {
                    this.subviews[view.vtag] = [vtag, view];
                }
            }

            view.viewDidMoveToSuperview(this);
            this.setNeedsDisplay();
        }

        else // View was already a subview of this superView (this === sv), so just move and re-index
        {
          var oldIdx = view.subviewIndex;

          this.subviews.splice(oldIdx, 1);
          this.subviews.splice(idx, 0, view);
          for (i = Math.min(oldIdx, idx), l  = subviewCount; i < l; i++)
          {
            this.subviews[i].subviewIndex = i;
          }

          if (idx < oldIdx)
          {
            this.setNeedsDisplay();
          }
          else
          {
            view.setNeedsDisplay();
          }
        }

        return this;
    },

    addSubview: function(view)
    {
      return this.insertSubview(view, this.subviews.length);
    },

    bringSubviewToFront: function(view)
    {
      return this.insertSubview(view, this.subviews.length);
    },

    sendSubviewToBack: function(view)
    {
      return this.insertSubview(view, 0);
    },

    removeFromSuperView: function()
    {
        var sv = this.superView;

        if (sv && (typeof this.subviewIndex === 'number'))
        {
            var i, l, superSubs = sv.subviews;
            for (i = this.subviewIndex + 1, l = superSubs.length; i < l; i++)
            {
                superSubs[i].subviewIndex -= 1;
            }
            superSubs.splice(this.subviewIndex, 1);
        }

        this.superView = undefined;
        this.subviewIndex = undefined;
        this.window = undefined;

        if (this.nextResponder instanceof WV.Controller) {
          this.nextResponder.nextResponder = undefined;
        }
        else {
          this.nextResponder = undefined;
        }

        this.viewDidMoveToSuperview(null);

        if (sv) { sv.setNeedsDisplay(); }

        return this;
    },

    viewDidMoveToSuperview: function(superview) { /* template */},

    getFrame: function()
    {
        return {
            x: this.x,
            y: this.y,
            h: this.h,
            w: this.w
        };
    },

    setFrame: function(frame)
    {
        this.previousW = this.w;
        this.previousH = this.h;

        var previousX = this.x,
            previousY = this.y,
            needsLayout = false,
            needsDisplay = false;

        this.x = (typeof frame.x === 'number') ? frame.x : this.convertRelative('x', frame.x) || this.x;
        this.y = (typeof frame.y === 'number') ? frame.y : this.convertRelative('y', frame.y) || this.y;
        this.w = (typeof frame.w === 'number') ? frame.w : this.convertRelative('width', frame.w) || this.w;
        this.h = (typeof frame.h === 'number') ? frame.h : this.convertRelative('height', frame.h) || this.h;

        if (this.x !== previousX) { needsDisplay = true; }
        if (this.y !== previousY) { needsDisplay = true; }
        if (this.w !== this.previousW) { needsLayout = true; }
        if (this.h !== this.previousH) { needsLayout = true; }

      if (this.window && (needsDisplay || needsLayout) && !this.window.inLayout)
      {
        if (needsLayout)
        {
          // Prevent drawing while geometry is recalculated
          this.window.inLayout = true;
          this.layoutSubviews();
          this.window.inLayout = false;
        }

        var previousRect = { x: previousX, y: previousY, w: this.previousW, h: this.previousH },
            newRect = { x: this.x, y: this.y, w: this.w, h: this.h },
            union = WV.rectUnion(previousRect, newRect);

        if (WV.rectContainsRect(newRect, union))
        {
          this.setNeedsDisplay();
        }
        else if (this.superView)
        {
          this.superView.setNeedsDisplay();
        }
      }

      else if (needsLayout)
        {
            this.layoutSubviews();
        }

        return this;
    },

    getSize: function()
    {
        return {
            h: this.h,
            w: this.w
        };
    },

    setSize: function(w, h)
    {
        return this.setFrame({ x: this.x, y: this.y, w: w, h: h });
    },

    getOrigin: function()
    {
        return {
            x: this.x,
            y: this.y
        };
    },

    setOrigin: function(x, y)
    {
        return this.setFrame({ x: x, y: y, w: this.w, h: this.h });
    },

    // rect must be in coordinate system of "this"
    setNeedsDisplay: function(rect)
    {
        var bounds = { x: 0, y: 0, w: this.w, h: this.h },
            invalid = rect || bounds,
            clipsv,
            sv = clipsv = this.superView;

        // Find the first non-transparent view or view that contains the invalid rect to start with
        if (sv && (!this.isOpaque() || !sv.isOpaque() || (!this.clipToBounds && !WV.rectContainsRect(bounds, invalid))))
        {
            return sv.setNeedsDisplay(this.convertRectToView(invalid, sv));
        }

        // We are opaque, so find out if we have an ancestor who might be clipping us
        else
        {
          while (clipsv)
          {
            if (clipsv.clipToBounds && !WV.rectContainsRect({ x: 0, y: 0, w: clipsv.w, h: clipsv.h }, this.convertRectToView(invalid, clipsv)))
            {
              return clipsv.setNeedsDisplay();
            }
            clipsv = clipsv.superView;
          }
        }

      // We are opaque with no clipping ancestor or we are the root view, so just draw ourself and look for anything that could be positioned on top of us
      if (this.window)
      {
          this.window.setViewsNeedDisplay(this);
          // Now make sure to draw all the views that could potentially be drawn over the current one
          // because they are further right on the tree
          // TODO: optimize this by looking at the frames for all the views to the right to see if they intersect with the invalid rect
          while (sv)
          {
            for (var i = this.subviewIndex + 1; i < sv.subviews.length; i++)
            {
              if (WV.rectIntersectsRect(this.convertRectToView(invalid, sv), sv.subviews[i].getFrame()))
              {
                  this.window.setViewsNeedDisplay(sv.subviews[i]);
//                sv.subviews[i].setNeedsDisplay();
              }
            }
            sv = sv.superView;
          }
      }
      return this;
    },

    redrawIfNeeded: function(top) {
        if (this.visible()) {
//        WV.debug('Drawing: ', this.id);
          var ctx = this.window.context2d,
              alpha,
              st = this.style,
              mask = this.mask,
              i, l = this.subviews.length;

          alpha = ctx.globalAlpha;

          ctx.save();

          ctx.globalAlpha = alpha * (st.opacity === 0 ? 0 : st.opacity || 1.0);

          if (top !== false) {
            // We need to replay the transformations from our superview and up
            this.accumulateTransforms(ctx);
          }
          else {
            this.applyTransform(ctx);
          }

          // We are masked and configured to not draw ourself so just draw the mask
          if (mask && mask.isShowing() && !mask.drawOwnerWhileShowing) {
            this.mask.redrawIfNeeded(false);
            this.mask.window = this.window;
          }

          // Otherwise draw ourself and our subviews
          else {
            this.baseDraw({ x: 0, y: 0, w: this.w, h: this.h }, ctx);

            if (l) {
              for (i = 0; i < l; i++) {
                  this.subviews[i].window = this.window; // TODO: Do this somewhere else?
                  this.subviews[i].redrawIfNeeded(false);
              }
            }
          }

          ctx.restore();

          ctx.globalAlpha = alpha;
        }
    },

    applyTransform: function(ctx) {
      /*
       Transforms are applied from style properties in order:
          1) translate
          2) rotate (clockwise around transform origin),
          3) scale (centered on transform origin)
       */
      // TODO: Support skew

      var st = this.style,
          tx = (st.translateX || 0) + this.x,
          ty = (st.translateY || 0) + this.y,
          tm = [1, 0, 0, 1, tx, ty], // Identity plus the original translation
          sx = st.scaleX === 0 ? 0 : st.scaleX || 1,
          sy = st.scaleY === 0 ? 0 : st.scaleY || 1,
          orgX = (st.transformOriginX === 0 ? 0 : (st.transformOriginX || 0.5)) * this.w,
          orgY = (st.transformOriginY === 0 ? 0 : (st.transformOriginY || 0.5)) * this.h;

      // Translate to the transform origin so rotation and scaling will take place around that point
      tm = WV.multiplyMatrix(tm, [1,0,0,1, orgX, orgY]);

      if (st.rotate) {
          // The calculations below assume a) flipped y-axis b) clockwise rotation
          var deg2Rad = Math.PI / 180,
              radians = st.rotate * deg2Rad,
              cosTheta = Math.cos(radians),
              sinTheta = Math.sin(radians),
              m11, m12, m21, m22;

          // Clockwise
          m11 = cosTheta, m12 = -sinTheta,
          m21 = sinTheta, m22 = cosTheta;

         // Counter-Clockwise
//          m11 = cosTheta; m12 = sinTheta;
//          m21 = -sinTheta; m22 = cosTheta;

          // Rotate
          tm = WV.multiplyMatrix(tm, [m11, m21, m12, m22, 0, 0]);
      }

      if (sx !== 1 || sy !== 1) {
        // Scale
        tm = WV.multiplyMatrix(tm, [sx, 0, 0, sy, 0, 0]);
      }

      // Undo the transform origin translation
      tm = WV.multiplyMatrix(tm, [1,0,0,1, -orgX, -orgY]);
      this._transform = tm;
      ctx.transform(tm[0], tm[1], tm[2], tm[3], tm[4], tm[5]);
    },

    accumulateTransforms: function(ctx) {
      if (this.superView) {
        this.superView.accumulateTransforms(ctx);
      }
      this.applyTransform(ctx);
    },

    baseDraw: function(rect, ctx)
    {
        var st = this.style,
            bw = st.borderWidth || 0,
            cr = st.cornerRadius,
            clip = this.clipToBounds || bw,
            linearGradient = st.linearGradient ? st.linearGradient.toCanvasGradient(ctx, rect) : null,
            fill = linearGradient || st.color || 'transparent',
            shadow = st.shadow;

        if (!this.clipToBounds)
        {
            ctx.save();
        }

        if (shadow) { shadow.apply(ctx); }
        this.roundedRect(ctx, this.w, this.h, cr);

        if (fill !== 'transparent')
        {
          ctx.fillStyle = fill;
          ctx.fill();
        }

        if (clip)
        {
          if (this.clipToBounds)
          {
            ctx.clip();
            this.drawImage(ctx, rect);
          }
          else
          {
            this.drawImage(ctx, rect);
            ctx.clip();
          }
        }
        else { this.drawImage(ctx, rect); }

       if (shadow)
       {
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.shadowColor = 'transparent';
        }
        if (bw)
        {
          // TODO: Draw this on top of subviews?
          ctx.strokeStyle = st.borderColor || 'black';
          ctx.lineWidth = 2 * bw;
          ctx.stroke();
        }

        this.draw(ctx, rect);

        if (!this.clipToBounds)
        {
          ctx.restore();
        }
    },

    // TODO: Move this to a function added to the Canvas2DContext prototoype
    roundedRect: function(ctx, w, h, cr)
    {
      var pi = Math.PI;

      ctx.beginPath();

      if (cr)
      {
        ctx.moveTo(w/2, 0);
        ctx.arc(w - cr, cr, cr, (3 * pi)/2, 0, false);
        ctx.lineTo(w, h/2);
        ctx.arc(w - cr, h - cr, cr, 0, pi/2, false);
        ctx.lineTo(w/2, h);
        ctx.arc(cr, h - cr, cr, pi/2, pi, false);
        ctx.lineTo(0, h/2);
        ctx.arc(cr, cr, cr, pi, (3 * pi)/2, false);
        ctx.lineTo(w/2, 0);
        ctx.closePath();
      }
      else
      {
          ctx.rect(0, 0, w, h);
      }

      return this;
    },

    draw: function(rect, ctx) { },

    drawImage: function(ctx, rect)
    {
        if (this.style.image)
        {
            this.style.image.draw(ctx, rect);
        }
    },

    isOpaque: function()
    {
        var st = this.style,
            color = st.color || 'transparent',
            borderColor = st.borderColor || 'transparent',
            opacity = st.opacity === 0 ? 0 : st.opacity || 1,
            regex = /^transparent$|rgba(.*)(0\.\d)|(,0)\)$/;  // Look for alpha < 1 in rgba() style color strings

        return !(opacity < 1 || regex.exec(color) || (st.borderWidth && regex.exec(borderColor)));
    },

    clear: function(previous)
    {
        var origin,
            w, h;

        if (previous)
        {
            origin = { x: this.x, y: this.y };
            h = this.previousH || this.h;
            w = this.previousW || this.w;
        }
        else
        {
            origin = { x: this.x, y: this.y };
            h = this.h;
            w = this.w;
        }
        if (this.window)
        {
            origin = this.convertPointToView(origin);
            this.window.context2d.clearRect(origin.x, origin.y, Math.ceil(w), Math.ceil(h));
        }
        return this;
    },

    // private
    // Converts a string expression of a dimension relative to the superview to a number
    convertRelative: function(dim, val)
    {
        var sv = this.superView,
            convVal,
            result;

        if (!sv || !(typeof val === 'string')) { return undefined; }

        switch(dim)
        {
            case 'height':
                convVal = sv.h;
                break;
            case 'width':
                convVal = sv.w;
                break;
            case 'x':
                convVal = sv.w;
                break;
            case 'y':
                convVal = sv.h;
                break;
            default:
                throw Error(dim + ' is not a valid dimension spec');
        }

        if (val.indexOf('%') > 0)
        {
            result = (parseFloat(val, 10) / 100) * convVal;
        }
        else if (val === 'center')
        {
            if (dim === 'x')
            {
                result = (sv.w / 2) - (this.w / 2);
            }
            else if (dim === 'y')
            {
                result = (sv.h / 2) - (this.h / 2);
            }
            else
            {
                throw Error('\'center\' cannot be applied to dimension: ' + dim);
            }
        }
        // Try to evaluate the expression as a dynamic function passing in the dimensions of the superview
        else
        {
            var funcBody = 'return ' + val + ';',
                idRegExp = /{([^}]+)}/g,
                lastMatch,
                fn;

            // Replaces: {id} with: WV.get('id')
            while (lastMatch = idRegExp.exec(funcBody))
            {
                funcBody = funcBody.replace(lastMatch[0], 'WV.get(\'' + lastMatch[1] + '\')');
            }

            // Expression can reference the x,y,w,h of the superView
            fn = new Function(['x', 'y', 'w', 'h'], funcBody);

            try
            {
                result = fn.call(this, this.superView.x, this.superView.y, this.superView.w, this.superView.h);
            }
            catch(e)
            {
                WV.log(e);
                throw Error('Invalid relative size expression: ' + val);
            }
            if (typeof result !== 'number')
            {
                throw Error('Result of a relative size expression must be a Number. Got: ' + result);
            }
        }

        return result;
    },

    convertDimensions: function()
    {
        if (!this.superView) { return this; }

        // Call convertRelative this way to allow this function to be called on object literals
        if (typeof this.w === 'string') { this.w = WV.View.prototype.convertRelative.call(this, 'width', this.w); }
        if (typeof this.h === 'string') { this.h = WV.View.prototype.convertRelative.call(this, 'height', this.h); }
        if (typeof this.x === 'string') { this.x = WV.View.prototype.convertRelative.call(this, 'x', this.x); }
        if (typeof this.y === 'string') { this.y = WV.View.prototype.convertRelative.call(this, 'y', this.y); }

        return this;
    },

    setX: function(x)
    {
        return this.setOrigin(x, this.y);
    },

    setY: function(y)
    {
        return this.setOrigin(this.x, y);
    },

    setWidth: function(w)
    {
        return this.setSize(w, this.h);
    },

    setHeight: function(h)
    {
        return this.setSize(this.w, h);
    },

    getContentWidth: function()
    {
        return this.w - (2 * (this.style.borderWidth || 0));
    },

    getContentHeight: function()
    {
        return this.h - (2 * (this.style.borderWidth || 0));
    },

    setHidden: function(hide)
    {
        var sv = this.superView;

        if (!this.hidden && hide)
        {
            this.hidden = true;
           //TODO: Need to hide subviews outside of our bounds
            if (sv) { sv.setNeedsDisplay(); }
        }
        else if (this.hidden && !hide)
        {
            this.hidden = false;
            this.setNeedsDisplay();
        }
        return this;
    },

    visible: function() {
      var st = this.style,
          alpha = st.opacity === undefined ? 1 : st.opacity;

      return !this.hidden && (alpha >= 0.01) && !!this.window;
    },

    setClipToBounds: function(clip)
    {
        //TODO: If we are turning clipping on then we are shrinking and need to repaint our superview
        //TODO: Make sure subviews are not drawn outside of our bounds with clipping on
        this.clipToBounds = clip === true;
        this.setNeedsDisplay();
        return this;
    },

    setEnabled: function(enabled)
    {
        var op = this.style.opacity === 0 ? 0 : (this.style.opacity || 1.0);

        if (this.enabled && !enabled)
        {
            this._prevOpacity = op;
            this._prevCursor = this.style.cursor;
            this.setStyle('cursor', 'default');
            // TODO: Look for Window.firstResponder in descendants and resign it?
            this.resignFirstResponder();
            this.setOpacity(Math.min(op || 0.33, 0.33));
            this.enabled = false;
        }
        else if (!this.enabled && enabled)
        {
            this.style.opacity = op = this._prevOpacity;
            this.setStyle('cursor', this._prevCursor || 'auto');
            this.enabled = true;
            this.setOpacity(op === 0 ? 0 : (op || 1.0));
        }

        return this;
    },

    destroy: function(top)
    {
        for (var i = 0, l = this.subviews.length; i < l; i++)
        {
            this.subviews[i].destroy(false);
        }

        WV.removeFromCache(this);
        this.id = undefined;

        if (top !== false)
        {
            this.removeFromSuperView();
        }
        this.purgeListeners();
    },

    layoutSubviews: function()
    {
        if (!this.resizeSubviews) { return this; }

        var subs = this.subviews,
            i, l = subs.length;

        for (i = 0; i < l; i++)
        {
            subs[i].doAutoResize(); // Will call layoutSubviews recursively as sizes change
        }
        return this;
    },

    doAutoResize: function()
    {
        var sv = this.superView,
            m = this.autoResizeMask,
            f,
            dX, dY,
            dW, dH, pc;

        if (!m || !sv || (m === WV.RESIZE_NONE)) { return; }

        f = this.getFrame();

        dW = sv.w - sv.previousW;
        pc = dW / sv.previousW;

        switch(m & (WV.RESIZE_LEFT_FLEX | WV.RESIZE_RIGHT_FLEX | WV.RESIZE_WIDTH_FLEX))
        {
            case WV.RESIZE_NONE:
                break;
            case WV.RESIZE_LEFT_FLEX:
                f.x = f.x + dW;
                break;
            case WV.RESIZE_RIGHT_FLEX:
                break;
            case WV.RESIZE_WIDTH_FLEX:
                f.w = f.w + dW;
                break;
            case WV.RESIZE_LEFT_FLEX | WV.RESIZE_RIGHT_FLEX: // TODO Test
                f.x = f.x + dW/2;
                break;
            case WV.RESIZE_LEFT_FLEX | WV.RESIZE_WIDTH_FLEX: // TODO Test
                dX = f.x * pc;
                f.x = f.x + dX;
                f.w = f.w + dW - dX;
                break;
            case WV.RESIZE_RIGHT_FLEX | WV.RESIZE_WIDTH_FLEX:
                f.w = f.w + f.w * pc;
                break;
            case WV.RESIZE_LEFT_FLEX | WV.RESIZE_RIGHT_FLEX | WV.RESIZE_WIDTH_FLEX:
                f.w = f.w + f.w * pc;
                f.x = f.x + f.x * pc;
        }

        dH = sv.h - sv.previousH;
        pc = dH / sv.previousH;

        switch(m & (WV.RESIZE_TOP_FLEX | WV.RESIZE_BOTTOM_FLEX | WV.RESIZE_HEIGHT_FLEX))
        {
            case WV.RESIZE_NONE:
                break;
            case WV.RESIZE_TOP_FLEX:
                f.y = f.y + dH;
                break;
            case WV.RESIZE_BOTTOM_FLEX:
                break;
            case WV.RESIZE_HEIGHT_FLEX:
                f.h = f.h + dH;
                break;
            case WV.RESIZE_TOP_FLEX | WV.RESIZE_BOTTOM_FLEX: // TODO Test
                f.y = f.y + dH/2;
                break;
            case WV.RESIZE_TOP_FLEX | WV.RESIZE_HEIGHT_FLEX: // TODO Test
                dY = f.y * pc;
                f.y = f.y + dY;
                f.h = f.h + dH - dY;
                break;
            case WV.RESIZE_BOTTOM_FLEX | WV.RESIZE_HEIGHT_FLEX:
                f.h = f.h + f.h * pc;
                break;
            case WV.RESIZE_TOP_FLEX | WV.RESIZE_BOTTOM_FLEX | WV.RESIZE_HEIGHT_FLEX:
                f.h = f.h + f.h * pc;
                f.y = f.y + f.y * pc;
        }
        this.setFrame(f);
    },

    // point must be in this view's coordinate system
    hitTest: function(point, top) {

      if (!this.visible() || !this.interactionEnabled) {
          return null;
      }

      var hit,
          st = this.style,
          sv = this.superView,
          subs = this.subviews,
          ctx = this.window.context2d;

      ctx.save();

      if (top !== false) {
        // Identity
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // Replay all the transforms from the window down to ourself.
        this.accumulateTransforms(ctx);
        // Point needs to be in window coordinates for use in isPointInPath
        point = this.convertPointToView(point);
      }
      else {
        // We don't need to replay the transformations of our ancestors because we are ina a recursive call
        this.applyTransform(ctx);
      }

      // Replay our path, but don't draw anything
      this.roundedRect(ctx, this.w, this.h, st.cornerRadius);

      // Check to see if the point is inside
      if (sv && !ctx.isPointInPath(point.x, point.y)) {
          ctx.restore();
          return null;
      }

      if (subs.length) {
        for (var i = (subs.length - 1); i >= 0; i--) {
            hit = subs[i].hitTest(point, false);
            if (hit) { break; }
        }
      }

      ctx.restore();

      // We are either inside the hit subview or inside ourself
      return hit ? hit : this;
    },

    computeTransform: function() {
      var tm = this._transform,
          sv = this.superView;

      if (sv) {
        tm = WV.multiplyMatrix(sv.computeTransform(), tm);
      }

      return tm;
    },

    // If "fromView" is null/undefined then assume "from" is the window
    convertPointFromView: function(point, fromView) {
      var tmTo = this.computeTransform(),
          x, y;

      if (fromView) {
        // Get the point in window coordinates
        point = fromView.convertPointToView(point, null);
      }

      y = (tmTo[1] * point.x - tmTo[1] * tmTo[4] + tmTo[5] * tmTo[0] -point.y * tmTo[0]) /
          (tmTo[1] * tmTo[2] - tmTo[3] * tmTo[0]);

      x = (point.x - tmTo[2] * y - tmTo[4]) / tmTo[0];

      return { x: x, y: y };
    },

    // If "fromView" is null/undefined then assume "from" is the window
    convertPointToView: function(point, toView) {
      var tmFrom = this.computeTransform(),
          x, y;

      // Convert the point to window coordinates. The window always has the identity transform
      x = tmFrom[0] * point.x + tmFrom[2] * point.y + tmFrom[4];
      y = tmFrom[1] * point.x + tmFrom[3] * point.y + tmFrom[5];

      if (toView) {
        return toView.convertPointFromView({x: x, y: y}, null);
      }

      return { x: x, y: y };
    },

    convertRectToView: function(rect, ancestor)
    {
      var r = rect || { x: 0, y: 0 };

      r = this.convertPointToView(r, ancestor);
      r.w = rect ? rect.w : this.w;
      r.h = rect ? rect.h : this.h;

      return r;
    },

    convertRectFromView: function(rect, ancestor)
    {
      var r = rect || { x: 0, y: 0 };

      r = this.convertPointFromView(r, ancestor);
      r.w = rect ? rect.w : ancestor.w;
      r.h = rect ? rect.h : ancestor.h;

      return r;
    },

    isDescendantOf: function(v)
    {
        var sv = this,
            fn = typeof v === 'function' ? v : function() { return sv === v; };

        while (sv)
        {
            if (fn(sv) === true)
            {
                return true;
            }
            sv = sv.superView;
        }
        return false;
    },

    isHiddenOrHasHiddenAncestor: function()
    {
        return this.isDescendantOf(function(sv) {
            return sv.hidden === true;
        })
    },

    canBecomeKeyView: function()
    {
        return this.canBecomeFirstResponder() && !this.isDescendantOf(function(sv) {
            return !sv.enabled || sv.hidden; //
        })
    },
    getNextKeyView: function()
    {
        return this.nextKeyView;
    },
    setNextKeyView: function(v)
    {
        if (v)
        {
            this.nextKeyView = v;
            v.previousKeyView = this;
        }
        return v;
    },
    getNextValidKeyView: function()
    {
        var v = this.getNextKeyView();
        while (true)
        {
            if (v === this || v.canBecomeKeyView())
            {
                return v;
            }
            v = v.getNextKeyView();
        }
    },
    getPreviousKeyView: function()
    {
        return this.previousKeyView;
    },
    getPreviousValidKeyView: function()
    {
        var v = this.getPreviousKeyView();
        while (true)
        {
            if (v === this || v.canBecomeKeyView())
            {
                return v;
            }
            v = v.getPreviousKeyView();
        }
    },

    viewWithVtag: function(vtag)
    {
        var i, l, views = WV.findByVtag(vtag);

        if (!views) { return null; }
        else
        {
            if (!Array.isArray(views))
            {
              views = [views];
            }
            for (i = 0, l = views.length; i < l; i++)
            {
                if (views[i].isDescendantOf(this))
                {
                    return views[i];
                }
            }
            return null;
        }
    },

    setState: function(newState, shallow, force)
    {
        // TODO: Account for possible difference in ordering of 'equal' states
        if (typeof newState === 'string' && (force || (newState !== this.state)))
        {
            var end, start = new Date();

            var i, s, l,
                sv = this.superView;

            this.styleMap = this.styleMap || ((sv && sv.styleMap) ? sv.styleMap[this.vtag] : null);

            if (!this.styleMap)
            {
                var msg = 'Could not find a styleMap for this stateful view: ' + this.toString();
                WV.log(msg);
                throw new Error(msg);
            }

            this.state = newState;

            this.setStyle(this.styleMap.computeStyleForStates(this.state));

            if (shallow !== true)
            {
                for (i = 0,l = this.subviews.length; i < l; i++)
                {
                    if (this.subviews[i].stateful === true)
                    {
                        this.subviews[i].setState(this.state, shallow, force);
                    }
                }
            }
            end = new Date();
            WV.debug('setState(', this.state, '): ', this.id, ',', this.vtype, ' ', end.getTime() - start.getTime(), 'ms');
        }
        return this;
    },
    changeState: function(states, top)
    {
        var i, l;

        if (states && states.remove)
        {
            if (Ext.isArray(states.remove))
            {
                for (i = 0, l = states.remove.length; i < l; i++)
                {
                    this.changeState({ remove: states.remove[i] }, false);
                }
            }
            else { this.removeState(states.remove, true); }
        }

        if (states && states.add)
        {
            if (Ext.isArray(states.add))
            {
                for (i = 0, l = states.add.length; i < l; i++)
                {
                    this.changeState({ add: states.add[i] }, false);
                }
            }
            else { this.addState(states.add, true); }
        }

        if (top !== false) { this.setState(this.state, false, true); }
        return this;
    },
    addState: function(state, cancelUpdate)
    {
        if (typeof state === 'string' && (this.state || '').indexOf(state) < 0)
        {
            var newState;
            if (this.state.length > 0)
            {
                newState = this.state + ',' + state;
            }
            else
            {
                newState = state;
            }
            cancelUpdate === true ? this.state = newState : this.setState(newState);
        }
        return this;
    },
    removeState: function(state, cancelUpdate)
    {
        if (typeof state === 'string')
        {
            var re = new RegExp(String.format('^{0},|{0},|,{0}|{0}$', state), 'g'),
                newState = this.state.replace(re, '');

            cancelUpdate === true ? this.state = newState : this.setState(newState);
        }
        return this;
    },
    getBubbleTarget: function()
    {
        return this.superView;
    },
    toString: function()
    {
        return ['id: ', this.id, '\n',
                 '{ x: ', this.x.toFixed(2),
                  ' y: ', this.y.toFixed(2),
                  ' w: ', this.w.toFixed(2),
                  ' h: ', this.h.toFixed(2), ' }\n'].join('');
    }
});