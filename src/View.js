
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
    resizeSubViews: true,
    clipSubViews: false,
    enabled: true,
    draggable: false,
    stateful: false,
    needsDisplay: false,
    toolTip: undefined,

    style: {},

    subViews: [],

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

        // Put all the subViews we wish to add together (class level and config level) and add them all at once
        var subViewsToAdd =  this.constructor.prototype.subViews.concat(config.subViews || []);
        this.subViews = [];

        // Set the styles and other visual properties
        this.setStyle(style, true);
        this.setHidden(this.hidden);
        this.setClipSubViews(this.clipSubViews);
        this.setEnabled(this.enabled);

        WV.addToCache(this);

        // Add all of our subViews
        for (var i = 0, l = subViewsToAdd.length; i < l; i++)
        {
            this.addSubView(subViewsToAdd[i]);
        }

        // Add ourself to the superView
        if (this.superView)
        {
            // We have not really been added to a superview yet so prevent confusion by removing the reference
            var sv =  this.superView;
            delete this.superView;
            sv.addSubView(this);
        }

        return this;
    },

    addSubView: function(view)
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

            view.subViewIndex = this.subViews.length;
            this.subViews[this.subViews.length] = view;

            // Manage the vtag of the new subView if present. If this view already has a view with the same vtag
            // then turn the reference into an Array and store all siblings with identical vtags in it
            if (typeof view.vtag === 'string')
            {
                vtag = this.subViews[view.vtag];

                if (!vtag)
                {
                    this.subViews[view.vtag] = view;
                }
                else if (WV.isArray(vtag))
                {
                    this.subViews[view.vtag].push(view);
                }
                else
                {
                    this.subViews[view.vtag] = [vtag, view];
                }
            }
            if (view.window) { view.setNeedsDisplay(); }
        }

        return this;
    },

    removeFromSuperView: function()
    {
        var sv = this.superView;

        if (sv && (typeof this.subViewIndex === 'number'))
        {
            var i, l, superSubs = sv.subViews;
            for (i = this.subViewIndex + 1, l = superSubs.length; i < l; i++)
            {
                superSubs[i].subViewIndex -= 1;
            }
            superSubs.splice(this.subViewIndex, 1);
        }

        this.superView = undefined;
        this.nextResponder = undefined;
        this.subViewIndex = undefined;
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
                this.window.inLayout = true;
                this.layoutSubViews();
                this.window.inLayout = false;
            }

            // The new frame completely contains the old frame so just mark this view as needing display
            if (WV.rectContainsRect({ x: this.x, y: this.y, w: this.w, h: this.h },
                                    { x: previousX, y: previousY,  w: this.previousW,  h: this.previousH }))
            {
                this.window.setViewsNeedDisplay(this);
            }
            // Otherwise we need to redraw our superview at the very least
            else if (this.superView)
            {
                this.superView.setNeedsDisplay(WV.rectUnion({ x: previousX, y: previousY, w: this.previousW, h: this.previousH },
                                                            { x: this.x,    y: this.y,    w: this.w,         h: this.h }));
            }
        }
        else if (needsLayout)
        {
            this.layoutSubViews();
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
        var bounds = { x: 0, y:0, w: this.w, h: this.h },
            invalid = rect || bounds,
            sv = this.superView;

        // TODO: Keep track of the invalid rect

        // If our current frame completely contains the invalid rect then we are done, just draw ourself on top
        if (!WV.rectContainsRect(bounds, invalid) && sv)
        {
            // Otherwise find our first ancestor that completely contains the invalid rect
            sv.setNeedsDisplay(this.convertRectToView(invalid, this.superView));
        }

        else if (this.window)
        {
            this.window.setViewsNeedDisplay(this);
        }
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
                i, l = this.subViews.length;

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

            if (l)
            {
                for (i = 0; i < l; i++)
                {
                    this.subViews[i].window = this.window; // TODO: Do this somewhere else?
                    this.subViews[i].redrawIfNeeded(false);
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
            deg2Rad = Math.PI * 2 / 360;

        // TODO: Draw basic attributes here
        ctx.globalAlpha = st.opacity || 1.0;

        if (st.translateX || st.translateY)
        {
            ctx.translate(st.translateX || 0, st.translateY || 0);
        }

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
        if (cr)
        {
            var w = this.w - bw / 2,
                h = this.h - bw / 2,
                x = bw / 2,
                y = bw / 2;

            ctx.beginPath();
            ctx.moveTo(x, cr + y);
            ctx.arcTo(x, y, cr + x, y, cr);
            ctx.lineTo(w - cr, y);
            ctx.arcTo(w, y, w, cr + y, cr);
            ctx.lineTo(w, h - cr);
            ctx.arcTo(w, h, w - cr, h, cr);
            ctx.lineTo(cr + x, h);
            ctx.arcTo(x, h, x, h - cr, cr);
            ctx.lineTo(x, cr + y);
            ctx.closePath();
            if (bw)
            {
                ctx.strokeStyle = st.borderColor || 'black';
                ctx.lineWidth = bw;
                ctx.stroke();

                // Draw the background just inside the border
                w = this.w - bw,
                h = this.h - bw,
                x = bw,
                y = bw,
                cr = Math.abs(cr - bw/2);

                ctx.beginPath();
                ctx.moveTo(x, cr + y);
                ctx.arcTo(x, y, cr + x, y, cr);
                ctx.lineTo(w - cr, y);
                ctx.arcTo(w, y, w, cr + y, cr);
                ctx.lineTo(w, h - cr);
                ctx.arcTo(w, h, w - cr, h, cr);
                ctx.lineTo(cr + x, h);
                ctx.arcTo(x, h, x, h - cr, cr);
                ctx.lineTo(x, cr + y);
                ctx.closePath();
                ctx.fillStyle = st.color || 'black';
                ctx.fill();
            }
            else
            {
                ctx.fillStyle = st.color || 'black';
                ctx.fill();
            }
        }
        else
        {
            ctx.fillStyle = st.color || 'black';

            if (bw)
            {
              ctx.strokeStyle = st.borderColor || 'black';
              ctx.lineWidth = bw;
              ctx.strokeRect(bw / 2, bw / 2, this.w - bw, this.h - bw);
              ctx.fillRect(bw, bw, this.w - 2 * bw, this.h - 2 * bw);
            }

            else { ctx.fillRect(0, 0, this.w, this.h); }
        }

        this.draw(rect, ctx);
    },

    draw: function(rect, ctx) { },

    clear: function(previous)
    {
        var origin,
            w, h;

        if (previous)
        {
            origin = { x: this.previousX  || this.x, y: this.previousY || this.y };
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

    setHidden: function(hidden)
    {
        var dirty = (this.hidden !== (hidden === true));

        this.hidden = hidden === true;
        if (dirty)
        {
            this.setNeedsDisplay();
        }
        return this;
    },

    setClipSubViews: function(clip)
    {
        this.clipSubViews = clip === true;
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
        for (var i = 0, l = this.subViews.length; i < l; i++)
        {
            this.subViews[i].destroy(false);
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

    layoutSubViews: function()
    {
        if (!this.resizeSubViews) { return this; }

        var subs = this.subViews,
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
            subs = this.subViews,
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
                for (i = 0,l = this.subViews.length; i < l; i++)
                {
                    if (this.subViews[i].stateful === true)
                    {
                        this.subViews[i].setState(this.state, shallow, force);
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