
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
    mixins: [WV.Responder, WV.style.Stylable],
    x: 0,
    y: 0,
    h: 0,
    w: 0,
    previousH: 0,
    previousW: 0,
    autoResizeMask: WV.RESIZE_LEFT_FLEX | WV.RESIZE_RIGHT_FLEX |
                    WV.RESIZE_TOP_FLEX  | WV.RESIZE_BOTTOM_FLEX,
    hidden: false,
    rendered: false,
    resizeSubviews: true,
    clipToBounds: false,
    enabled: true,
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
        config = config || {};

        this.id = config.id || WV.id();

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

        Ext.apply(this, config);

        // Overwrite what was in the config because it does contain what we applied to 'style'.
        // We also need to ensure the we will not be writing styles to the prototype in the case that
        // no style property was passed in the config. We will fill the empty value in later
        // in the call to setStyle.
        this.style = {};

        // Animations keyed by their id
        this.animations = {};

        // Put all the subviews we wish to add together (class level and config level) and add them all at once
        var subviewsToAdd =  this.constructor.prototype.subviews.concat(config.subviews || []);
        this.subviews = [];

        // Set the styles and other visual properties
        this.setStyle(style, true);
        this.setHidden(this.hidden);
        this.setClipToBounds(this.clipToBounds);
        this.setEnabled(this.enabled);

        WV.addToCache(this);

        // Add all of our subviews
        for (var i = 0, l = subviewsToAdd.length; i < l; i++)
        {
            this.addSubview(subviewsToAdd[i]);
        }

        // Add ourself to the superView
        if (this.superView)
        {
            // We have not really been added to a superview yet so prevent confusion by removing the reference
            var sv =  this.superView;
            delete this.superView;
            sv.addSubview(this);
        }

        return this;
    },

    addSubview: function(view)
    {
        var sv = view.superView,
            vtag;

        if (!(view instanceof WV.View) && (typeof view === 'object'))
        {
            view = view.vtype ? WV.create(view.vtype, view) : new WV.View(view);
        }
        if (this !== sv)
        {
            if (sv)
            {
                view.removeFromSuperView();
            }

            sv = view.superView = this;
            view.nextResponder = this;

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

            view.subviewIndex = this.subviews.length;
            this.subviews[this.subviews.length] = view;

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
            if (view.window) { view.setNeedsDisplay(); }
        }

        return this;
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
        this.nextResponder = undefined;
        this.subviewIndex = undefined;
        this.window = undefined;

        if (sv) { sv.setNeedsDisplay(); }

        return this;
    },

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

            this.setNeedsDisplay(WV.rectUnion({ x: previousX, y: previousY, w: this.previousW, h: this.previousH },
                                              { x: this.x,    y: this.y,    w: this.w,         h: this.h }));
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
        var frame = { x: this.x, y: this.y, w: this.w, h: this.h },
            invalid = rect || frame,
            sv = this.superView;

        // Find the first non-transparent view to start with
        if (sv && !this.isOpaque())
        {
            sv.setNeedsDisplay(this.convertRectToView(invalid, sv));
        }

        // If our current frame completely contains the invalid rect then we are done, just draw ourself on top
        else if (sv && !WV.rectContainsRect(frame, invalid))
        {
            // Otherwise find our first ancestor that completely contains the invalid rect
            sv.setNeedsDisplay(this.convertRectToView(invalid, sv));
        }

        else if (this.window)
        {
            this.window.setViewsNeedDisplay(this);
            // Now make sure to draw all the views that could potentially be drawn beneath the current one
            // because they are further right on the tree
            // TODO: optimize this by looking at the frames for all the views to the right to see if they intersect with the invalid rect
            while (sv)
            {
              for (var i = this.subviewIndex + 1; i < sv.subviews.length; i++)
              {
                this.window.setViewsNeedDisplay(sv.subviews[i]);
              }
              sv = sv.superView;
            }
        }
        return this;
    },

    redrawIfNeeded: function(top)
    {
        //console.log('Redrawing: %s', this.id);
        if (this.window && !this.hidden)
        {
            WV.debug('Drawing: ', this.id);
            var ctx = this.window.context2d,
                frame = this.getFrame(),
                origin,
                i, l = this.subviews.length;

            ctx.save();

            if (top !== false)
            {
                // Start with the first view in window coordinates
                origin = this.convertPointToView(frame);
            }
            else
            {
                origin = { x: frame.x, y: frame.y };
            }

            ctx.translate(origin.x, origin.y);

            this.baseDraw(frame, ctx);
            this.drawBorder(frame, ctx);

            if (l)
            {
                if (this.clipToBounds)
                {
                    this.roundedRect(ctx, frame.w, frame.h, this.style.cornerRadius || 0, 0, true);
                }
                for (i = 0; i < l; i++)
                {
                    this.subviews[i].window = this.window; // TODO: Do this somewhere else?
                    this.subviews[i].redrawIfNeeded(false);
                }
            }
            ctx.restore();
            this.needsDisplay = false;
        }
    },

    baseDraw: function(rect, ctx)
    {
        var st = this.style,
            bw = st.borderWidth || 0,
            cr = st.cornerRadius,
            clip = this.clipToBounds,
            linearGradient = st.linearGradient ? st.linearGradient.toCanvasGradient(ctx, rect) : null,
            fill = linearGradient || st.color || 'transparent',
            shadow = st.shadow,
            deg2Rad = Math.PI * 2 / 360;

        ctx.globalAlpha = st.opacity || 1.0;

        if (st.translateX || st.translateY)
        {
            ctx.translate(st.translateX || 0, st.translateY || 0);
        }

        // TODO: Support skew
        if (st.rotate)
        {
            // The calculations below assume a) flipped y-axis b) clockwise rotation
            var radians = parseInt(st.rotate) * deg2Rad,
                cosTheta = Math.cos(radians),
                sinTheta = Math.sin(radians),
                orgX = (st.transformOriginX || 0.5) * this.w,
                orgY = -((st.transformOriginY || 0.5) * this.h),
                orgXAdj, orgYAdj,
                m11, m12, m21, m22;

            // Counter-clockwise
//          m11 = cosTheta, m12 = -sinTheta,
//          m21 = sinTheta, m22 = cosTheta;

           // Clockwise
            m11 = cosTheta, m12 = sinTheta,
            m21 = -sinTheta, m22 = cosTheta;

            // Calculate the shift of the point we are rotating around because the canvas rotates
            // around its origin.
            orgXAdj = orgX - (orgX * m11) - (orgY * m12);
            orgYAdj = orgY - (orgX * m21) - (orgY * m22);

            // Apply the rotation and the shift together
            ctx.transform(m11, m12, m21, m22, orgXAdj, -orgYAdj);
        }
        if (st.scaleX !== 1 || st.scaleY !== 1)
        {
            ctx.scale(st.scaleX || 1, st.scaleY || 1);
        }

        ctx.fillStyle = fill;

        // TODO: Handle shadow in case where image/fill overlap
        if (shadow && !clip) { shadow.apply(ctx); }
        // Draw the elements of views with a corner radius in a particular order
        if (cr)
        {
            if (clip)
            {
                ctx.save();
            }

            // Draw the background up to the border, clipping if needed
            this.roundedRect(ctx, this.w, this.h, cr, 0, clip);

            ctx.fill();
            this.drawImage(ctx, rect);
        }
        else
        {
            if (clip)
            {
              ctx.save();
              ctx.rect(0, 0, this.w, this.h);
              ctx.clip();
            }
            if (bw)
            {
              ctx.fillRect(bw, bw, this.w - 2 * bw, this.h - 2 * bw);
            }
            else
            {
              ctx.fillRect(0, 0, this.w, this.h);
            }

            this.drawImage(ctx, rect);
        }

        if (shadow && !clip) {
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.shadowColor = 'transparent';
        }

        this.draw(ctx, rect);

        if (clip)
        {
            ctx.restore();
        }
    },

    // TODO: Move this to a function added to the Canvas2DContext prototoype
   // TODO: Handle situation where t > cr
    roundedRect: function(ctx, w, h, cr, t, clip)
    {
        ctx.beginPath();

        if (cr)
        {
            ctx.moveTo(t, t + cr);
            ctx.arcTo(t, t, t + cr, t, cr - t);
            ctx.lineTo(w - cr, t);
            ctx.arcTo(w, t, w, t + cr, cr - t);
            ctx.lineTo(w, h - cr);
            ctx.arcTo(w, h, w - cr, h, cr - t);
            ctx.lineTo(t + cr, h);
            ctx.arcTo(t, h, t, h - cr, cr - t);
        }
        else
        {
            ctx.rect(0, 0, w, h);
        }
        // "rect" needs begin/close path too or clipping problems result
        ctx.closePath();
        if (clip) { ctx.clip(); }

        return this;
    },

    drawBorder: function(rect, ctx)
    {
        var st = this.style,
            bw = st.borderWidth || 0,
            cr = st.cornerRadius,
            w = this.w - bw/2,
            h = this.h - bw/2,
            t = bw/2;

        if (bw && st.borderColor)
        {
            ctx.strokeStyle = st.borderColor;
            ctx.lineWidth = bw;

            if (cr)
            {
                this.roundedRect(ctx, w, h, cr, t, false);
                ctx.stroke();
            }
            else
            {
                w = this.w - bw,
                h = this.h - bw,
                ctx.strokeRect(t, t, w, h);
            }
        }
    },

    draw: function(rect, ctx) { },

    drawImage: function(ctx, rect)
    {
        if (this.style.image)
        {
            // Convert a config object to a WV.Image instance
            if (!(this.style.image instanceof WV.Image))
            {
                this.style.image = new WV.Image(this.style.image, this);
            }

            this.style.image.draw(ctx, rect);
        }
    },

    imageDidLoad: function(image)
    {
        return this.setNeedsDisplay();
    },

    isOpaque: function()
    {
        var st = this.style,
            color = st.color || 'transparent',
            borderColor = st.borderColor || 'transparent',
            opacity = st.opacity || 1,
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

        if (typeof this.w === 'string') { this.w = this.convertRelative('width', this.w); }
        if (typeof this.h === 'string') { this.h = this.convertRelative('height', this.h); }
        if (typeof this.x === 'string') { this.x = this.convertRelative('x', this.x); }
        if (typeof this.y === 'string') { this.y = this.convertRelative('y', this.y); }

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

        if (top !== false && this.rendered)
        {
            this.removeFromSuperView();
        }
        this.purgeListeners();
        this.rendered = false;
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

    hitTest: function(point)
    {
        var convP, hit,
            subs = this.subviews,
            sv = this.superView;

        if (this.hidden || !this.enabled)
        {
            return null;
        }

        // TODO: Deal with rotated/scaled views. Use layer coords or use larger bounds?

        if (sv && !sv.isPointInRect(point, this.getFrame()))
        {
            return null;
        }

        convP = this.convertPointFromView(point, sv);

        if (subs && subs.length)
        {
            for (var i = (subs.length - 1); i >= 0; i--)
            {
                hit = subs[i].hitTest(convP);
                if (hit) { break; }
            }
        }

        // We are either in the hit subview our ourself
        return hit ? hit : this;
    },

    isPointInRect: function(point, rect)
    {
        return point.x >= rect.x && point.x < (rect.x + rect.w) &&
               point.y >= rect.y && point.y < (rect.y + rect.h);
    },

    // view passed in must be an ancestor for now, if no ancestor passed, assumes Window
    convertPointFromView: function(point, ancestor)
    {
        var convX = point.x,
            convY = point.y,
            v = this;

//            ancestor = ancestor || WV.Window;

        while (v !== ancestor && v.superView)
        {
            convX = convX - v.x;
            convY = convY - v.y;

            v = v.superView;
        }

        return { x: convX, y: convY };
    },

    // view passed in must be an ancestor for now, if no ancestor passed, assumes Window
    convertPointToView: function(point, ancestor)
    {
        var convX = point.x,
            convY = point.y,
            v = this.superView;

//            ancestor = ancestor || WV.Window;

        while (v && (v !== ancestor))
        {
            convX = convX + v.x;
            convY = convY + v.y;

            v = v.superView;
        }

        return { x: convX, y: convY };
    },

    convertRectToView: function(rect, ancestor)
    {
      var r = rect || { x: this.x, y: this.y };

      r = this.convertPointToView(r, ancestor);
      r.w = this.w;
      r.h = this.h;

      return r;
    },

    convertRectFromView: function(rect, ancestor)
    {
      var r = rect || { x: this.x, y: this.y };

      r = this.convertPointFromView(r, ancestor);
      r.w = this.w;
      r.h = this.h;

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