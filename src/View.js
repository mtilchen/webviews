
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
    z: 0,
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
    toolTip: undefined,

    style: {
        position: 'absolute',
        boxSizing: 'border-box',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box'
    },

    tag: 'div',

    domTpl: { id: '{id}', tag: '{tag}', cls: '{cls}', html: '{html}{_subViewHtml}',
              title: '{toolTip}', style: '{_styleString}' },

    subViews: [],

    nextKeyView: null,
    previousKeyView: null,

    constructor: function(config)
    {
        config = config || {};

        this.id = config.id || WV.id();
        this.z = WV.z();

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

        if (this.dom)
        {
            this.rendered = true;
            this.dom.id = this.id;
            this.dom.style.left = this.x + 'px';
            this.dom.style.top = this.y + 'px';
            this.dom.style.width =  this.w + 'px';
            this.dom.style.height =  this.h + 'px';
            this.dom.style.zIndex = this.z;
            this.setDraggable(this.draggable === true);
        }

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

            view.z = WV.z();

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

            if (this.rendered)
            {
                if (view.rendered)
                {
                    view.dom.style.zIndex = view.z;
                    // This will adjust to the borderWidth of the new superView
                    view.setStyle('marginLeft', view.style.marginLeft);
                    view.setStyle('marginTop', view.style.marginTop);
                    this.dom.appendChild(view.dom);
                }
                else
                {
                    // Convert percentages to numbers relative to superView in case string configs were used
                    view.convertDimensions();
                    if (view.renderOnAdd !== false && sv.deferSubViewRender !== true)
                    {
                        view.render();
                    }
                }
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
        }
        // Maintain the keyView loop
        var last = WV.Window.lastViewAdded;
        if (!last.nextKeyView || last.nextKeyView === WV.Window)
        {
            last.setNextKeyView(view);
        }
        if (!view.nextKeyView)
        {
            view.setNextKeyView(WV.Window);
        }
        WV.Window.lastViewAdded = view;
        return this;
    },

    removeFromSuperView: function()
    {
        if (this.superView && (typeof this.subViewIndex === 'number'))
        {
            var i, l, superSubs = this.superView.subViews;
            for (i = this.subViewIndex + 1, l = superSubs.length; i < l; i++)
            {
                superSubs[i].subViewIndex -= 1;
            }
            superSubs.splice(this.subViewIndex, 1);
        }

        if (this.dom && this.dom.parentNode)
        {
            this.dom.parentNode.removeChild(this.dom);
        }

        this.superView = undefined;
        this.nextResponder = undefined;
        this.subViewIndex = undefined;

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
            sv = this.superView,
            needsLayout = false;

        this.x = (typeof frame.x === 'number') ? frame.x : this.convertRelative('x', frame.x) || this.x;
        this.y = (typeof frame.y === 'number') ? frame.y : this.convertRelative('y', frame.y) || this.y;
        this.w = (typeof frame.w === 'number') ? frame.w : this.convertRelative('width', frame.w) || this.w;
        this.h = (typeof frame.h === 'number') ? frame.h : this.convertRelative('height', frame.h) || this.h;

        if (!Ext.isGecko && sv)
        {
            if (parseInt(this.x + this.w) === Math.ceil(sv.w))
            {
                this.w = Math.ceil(this.w);
            }
            if (parseInt(this.y + this.h) === Math.ceil(sv.h))
            {
                this.h = Math.ceil(this.h);
            }
        }

        if (this.rendered)
        {
            if (this.x !== previousX) { this.dom.style.left = this.x + 'px'; }
            if (this.y !== previousY) { this.dom.style.top =  this.y + 'px'; }
            if (this.w !== this.previousW) { this.dom.style.width = Math.max(this.w, 0) + 'px'; needsLayout = true; }
            if (this.h !== this.previousH) { this.dom.style.height = Math.max(this.h, 0) + 'px'; needsLayout = true; }
        }

        if (needsLayout)
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
        var needsLayout = false;

        this.previousW = this.w;
        this.previousH = this.h;
        this.w = (typeof w === 'number') ? w : this.convertRelative('width', w) || this.w;
        this.h = (typeof h === 'number') ? h : this.convertRelative('height', h) || this.h;

        if (this.rendered)
        {
            if (this.w !== this.previousW) { this.dom.style.width =  Math.max(this.w, 0) + 'px'; needsLayout = true; }
            if (this.h !== this.previousH) { this.dom.style.height = Math.max(this.h, 0) + 'px'; needsLayout = true; }
        }

        if (needsLayout)
        {
            this.layoutSubViews();
        }

        return this;
    },

    getOrigin: function()
    {
        return {
            x: this.x,
            y: this.y
        };
    },

    setOrigin: function(x, y, z)
    {
        var previousX = this.x,
            previousY = this.y,
            previousZ = this.z;

        this.x = (typeof x === 'number') ? x : this.convertRelative('x', x) || this.x;
        this.y = (typeof y === 'number') ? y : this.convertRelative('y', y) || this.y;
        this.z = (typeof z === 'number') ? z : this.z;

        if (this.rendered)
        {
            if (this.x !== previousX) { this.dom.style.left = this.x + 'px'; }
            if (this.y !== previousY) { this.dom.style.top =  this.y + 'px'; }
            if (this.z !== previousZ) { this.dom.style.zIndex = this.z; }
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

    setZ: function(z)
    {
        return this.setOrigin(this.x, this.y, z);
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
        return this.w - (2 * (parseInt(this.style.borderWidth, 10) || 0));
    },

    getContentHeight: function()
    {
        return this.h - (2 * (parseInt(this.style.borderWidth, 10) || 0));
    },

    setHidden: function(hidden)
    {
        this.hidden = hidden === true;
        this.setStyle('display', this.hidden ? 'none' : 'block');
        return this;
    },

    setClipSubViews: function(clip)
    {
        this.clipSubViews = clip === true;
        this.setStyle('overflow',  this.clipSubViews ? 'hidden' : 'visible');
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

    setDraggable: function(draggable)
    {
        this.draggable = draggable === true;
        if (this.rendered)
        {
            this.dom.draggable = this.draggable;
        }
        return this;
    },

    render: function(top)
    {
        // TODO: Handle subviews that are already rendered mixed with unrendered ones

        if (!this.constructor._domTpl)
        {
            this.constructor._domTplSpec = WV.accumulate(this.constructor, 'domTpl');
            this.constructor._domTpl = WV.createTemplate(this.constructor._domTplSpec);
        }

        if (this.hasOwnProperty('domTpl'))
        {
            Ext.applyIf(this.domTpl, this.constructor._domTplSpec);
            this._domTpl = WV.createTemplate(this.domTpl);
        }

        var tpl = this._domTpl || this.constructor._domTpl,
            sv = this.superView,
            buf = [],
            html,
            subs = this.subViews;

        for (var i = 0, l = subs.length; i < l; i++)
        {
            buf[buf.length] = subs[i].render(false);
        }

        if (top === false)
        {
            this._subViewHtml = buf.join('');

            this._styleString = this.buildStyle();

            html = tpl.apply(this);

            delete this._subViewHtml;
            delete this._styleString;

            return html;
        }
        else
        {
            if (this.dom)
            {
                this.dom.innerHTML = buf.join('');
            }
            else if (sv.rendered && sv.dom)
            {
                this._subViewHtml = buf.join('');
                this._styleString = this.buildStyle();

                this.dom = tpl.append(sv.dom, this, true).dom;

                delete this._subViewHtml;
                delete this._styleString;
            }

            delete this._domTpl;

            var start = new Date(),
                        end;
            this.initDom();

            end = new Date();
            WV.debug('Init Dom time: ', end.getTime() - start.getTime(), 'ms');

            return this;
        }
    },

    afterRender: function()
    {
        if (this.draggable === true)
        {
            this.setDraggable(true);
        }
        if (typeof this.nextKeyView === 'string')
        {
            this.setNextKeyView(WV.get(this.nextKeyView));
        }
        return this;
    },

    initDom: function()
    {
        for(var i = 0, l = this.subViews.length; i < l; i++)
        {
            this.subViews[i].initDom();
        }

        if ((this.dom = document.getElementById(this.id)))
        {
            this.rendered = true;
            this.afterRender();
        }
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
        this.dom = undefined;
        this.rendered = false;
    },

    layoutSubViews: function()
    {
        if (!this.resizeSubViews) { return this; }

        var subs = this.subViews;
        for (var i = 0, l = subs.length; i < l; i++)
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
        return point.x >= parseInt(rect.x) && point.x < parseInt(rect.x + rect.w) &&
               point.y >= parseInt(rect.y) && point.y < parseInt(rect.y + rect.h);
    },

    // view passed in must be an ancestor for now, if no ancestor passed, assumes Window
    convertPointFromView: function(point, ancestor)
    {
        var convX = point.x,
            convY = point.y,
            v = this;

            ancestor = ancestor || WV.Window;

        while (v !== ancestor && v.superView)
        {
            convX = convX - v.x;
            convY = convY - v.y;
            if (v instanceof WV.ScrollView && v.rendered)
            {
                convX = convX + v.dom.scrollLeft;
                convY = convY + v.dom.scrollTop;
            }
            v = v.superView;
        }

        return { x: Math.ceil(convX), y: Math.ceil(convY) };
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