
WV.RESIZE_NONE        = 0;
WV.RESIZE_LEFT_FLEX   = 1 << 0;
WV.RESIZE_RIGHT_FLEX  = 1 << 1;
WV.RESIZE_TOP_FLEX    = 1 << 2;
WV.RESIZE_BOTTOM_FLEX = 1 << 3;
WV.RESIZE_WIDTH_FLEX  = 1 << 4;
WV.RESIZE_HEIGHT_FLEX = 1 << 5;

WV.View = WV.extend(Ext.util.Observable, {
    vtype: 'view',
    x: 0,
    y: 0,
    h: 0,
    w: 0,
    z: 0,
    previousH: 0,
    previousW: 0,
    bwOffset: 0, // Offset for borderWidth of superView
    autoResizeMask: WV.RESIZE_LEFT_FLEX | WV.RESIZE_RIGHT_FLEX |
                    WV.RESIZE_TOP_FLEX  | WV.RESIZE_BOTTOM_FLEX,
    visible: true,
    rendered: false,
    resizeSubViews: true,
    clipSubViews: false,
    draggable: false,

    style: {
        position: 'absolute',
        boxSizing: 'border-box'
    },

    tag: 'div',

    domTpl: { id: '{id}', tag: '{tag}', cls: '{cls}', html: '{html}{_subViewHtml}', title: '{title}', style: '{_styleString}' },

    constructor: function(config)
    {
        config = config || {};

        this.id = config.id || WV.id();
        this.z = WV.z();

        // Accumulate default styles into a reusable base style object on a per-class basis
        if (!this.constructor._style)
        {
            this.constructor._style = WV.accumulate(this.constructor, 'style');
        }

        // Set styles
        var styles;
        Ext.applyIf(styles = config.style || {}, this.constructor._style);

        config.style = {}; // Start the styles empty and we will add them later

        Ext.apply(this, config);

        this.subViews = [];

        if (this.dom)
        {
            this.rendered = true;
            this.dom.id = this.id;
            this.bWOffSet = this.superView ? parseInt(this.superView.style.borderWidth, 10) || 0 : 0;
            this.dom.style.left = (this.x - this.bWOffSet) + 'px';
            this.dom.style.top = (this.y - this.bWOffSet) + 'px';
            this.dom.style.width =  this.w + 'px';
            this.dom.style.height =  this.h + 'px';
            this.dom.style.zIndex = this.z;
            this.setDraggable(this.draggable === true);
        }

        this.setStyle(styles);
        this.setVisible(this.visible);
        this.setClipSubViews(this.clipSubViews);

        WV.addToCache(this);

        if (config.subViews)
        {
            for (var i = 0; i < config.subViews.length; i++)
            {
                this.addSubView(config.subViews[i]);
            }
        }
        
        if (this.superView)
        {
            // We have not really been added to a superview yet so prevent confusion by removing the reference
            var sv =  this.superView;
            delete this.superView;
            sv.addSubView(this);
        }

        return this;
    },

    layoutSubViews: function()
    {
        if (!this.resizeSubViews) { return; }

        var subs = this.subViews;
        for (var i = 0, len = subs.length; i < len; i++)
        {
            subs[i].doAutoResize(); // Will call layoutSubviews recursively as sizes change
        }

        return this;
    },

    addSubView: function(view)
    {
        var sv = view.superView;

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

            if (this.rendered)
            {
                if (view.rendered)
                {
                    view.dom.style.zIndex = view.z;
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
        }
        return this;
    },

    removeFromSuperView: function()
    {
        if (!this.superView) { return this; }

        if (typeof this.subViewIndex === 'number')
        {
            var superSubs = this.superView.subViews;
            superSubs.splice(this.subViewIndex, 1);
        }

        if (this.superView.rendered)
        {
            this.superView.dom.removeChild(this.dom);
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
            previousBw = this.bwOffset,
            sv = this.superView,
            needsLayout = false;

        this.x = (typeof frame.x === 'number') ? frame.x : this.convertRelative('x', frame.x) || this.x;
        this.y = (typeof frame.y === 'number') ? frame.y : this.convertRelative('y', frame.y) || this.y;
        this.w = (typeof frame.w === 'number') ? frame.w : this.convertRelative('width', frame.w) || this.w;
        this.h = (typeof frame.h === 'number') ? frame.h : this.convertRelative('height', frame.h) || this.h;
        this.bWOffSet = sv ? parseInt(sv.style.borderWidth, 10) || 0 : 0;

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
            if (this.x !== previousX || this.bwOffset !== previousBw) { this.dom.style.left = (this.x - this.bWOffSet) + 'px'; }
            if (this.y !== previousY || this.bwOffset !== previousBw) { this.dom.style.top =  (this.y - this.bWOffSet) + 'px'; }
            if (this.w !== this.previousW) { this.dom.style.width =  this.w + 'px'; needsLayout = true; }
            if (this.h !== this.previousH) { this.dom.style.height = this.h + 'px'; needsLayout = true; }
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
            if (this.w !== this.previousW) { this.dom.style.width =  this.w + 'px'; needsLayout = true; }
            if (this.h !== this.previousH) { this.dom.style.height = this.h + 'px'; needsLayout = true; }
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
            previousZ = this.z,
            previousBw = this.bwOffset;

        this.x = (typeof x === 'number') ? x : this.convertRelative('x', x) || this.x;
        this.y = (typeof y === 'number') ? y : this.convertRelative('y', y) || this.y;
        this.z = (typeof z === 'number') ? z : this.z;
        this.bWOffSet = this.superView ? parseInt(this.superView.style.borderWidth, 10) || 0 : 0;

        if (this.rendered)
        {
            if (this.x !== previousX || this.bwOffset !== previousBw) { this.dom.style.left = (this.x - this.bWOffSet) + 'px'; }
            if (this.y !== previousY || this.bwOffset !== previousBw) { this.dom.style.top =  (this.y - this.bWOffSet) + 'px'; }
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

        if (!sv) { return 0; }

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
        return this.w - (2 * (parseInt(this.style.borderWidth, 10) || 0)); /*- this.getPadding("lr") */
    },

    getContentHeight: function()
    {
        return this.h - (2 * (parseInt(this.style.borderWidth, 10) || 0)); /*- this.getPadding("tb") */
    },

    setVisible: function(visible)
    {
        this.visible = visible !== false;
        this.setStyle('display', this.visible ? '' : 'none');
        return this;
    },

    setClipSubViews: function(clip)
    {
        this.clipSubViews = clip === true;
        this.setStyle('overflow',  this.clipSubViews ? 'hidden' : '');
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

    setStyle: function(name, value)
    {
        if (typeof name === 'object')
        {
            for (var s in name)
            {
                this.setStyle(s, name[s]);
            }
            return this;
        }

        var setFn = this['set' + name.replace(/([a-z])/, name.charAt(0).toUpperCase())],
            transP;

        if (setFn)
        {
            setFn.call(this, value);
        }
        else
        {
            transP = WV.styleLib[name] || name;
            this.style[name] = value;
            if (this.rendered)
            {
                 this.dom.style[transP] = value;
            }
        }
        return this;
    },

    setBorder: function(b)
    {
        var vals = b.split(' '),
            w = vals[0],
            st = vals[1],
            col = vals[2];

        this.setBorderWidth(w || '');
        this.setStyle('borderStyle', st || '');
        this.setStyle('borderColor', col || '');

        return this;
    },

    setBorderWidth: function(bw)
    {
        var i = 0,
            len = this.subViews.length;

        if (this.style.borderWidth !== bw)
        {
            this.style.borderWidth = bw;

            if (this.rendered)
            {
                this.dom.style.borderWidth = bw;
            }

            for (i = 0,len = this.subViews.length; i < len; i++)
            {
                this.subViews[i].setOrigin();
            }
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

        for (var i = 0, len = subs.length; i < len; i++)
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
            WV.log('Init Dom time: ', end.getTime() - start.getTime(), 'ms');
            
            return this;
        }
    },

    afterRender: function()
    {
        if (this.draggable === true)
        {
            this.setDraggable(true);
        }

        return this;
    },

    initDom: function()
    {
        for(var i = 0; i < this.subViews.length; i++)
        {
            this.subViews[i].initDom();
        }

        if ((this.dom = document.getElementById(this.id)))
        {
            this.rendered = true;
            this.afterRender();
        }
    },


    buildStyle: function()
    {
        var prop, trans, buf = [],
            re = /([A-Z])/g,
            bw = this.superView ? parseInt(this.superView.style.borderWidth, 10) || 0 : 0;

        function deCamel(c) { return '-' + c.toLowerCase(); }

        buf[buf.length] = 'width: ' + this.w + 'px';
        buf[buf.length] = 'height: ' + this.h + 'px';
        buf[buf.length] = 'left: ' + (this.x - bw) + 'px';
        buf[buf.length] = 'top: ' + (this.y - bw) + 'px';
        buf[buf.length] = 'z-index: ' + this.z;

        for (prop in this.style)
        {
            trans = WV.styleLib[prop] || prop;
            trans = trans.replace(re, deCamel);
            buf[buf.length] = trans + ': ' + this.style[prop];
        }

        buf[buf.length - 1] += ';';

        return buf.join('; ');
    },
    
    doAutoResize: function()
    {
        var sv = this.superView,
            m = this.autoResizeMask,
            f,
            dW, dH, pc;
        
        if (!m || !sv) { return; }

        f = this.getFrame();

        dW = sv.w - sv.previousW;
        pc = dW / sv.previousW;

        if (m & WV.RESIZE_WIDTH_FLEX)
        {
            if (!(m & WV.RESIZE_LEFT_FLEX) && !(m & WV.RESIZE_RIGHT_FLEX))
            {
                f.w = f.w + dW;
            }
            else
            {
                f.w = f.w + f.w * pc;
            }
        }
        if (m & WV.RESIZE_LEFT_FLEX)
        {
            if (m & WV.RESIZE_WIDTH_FLEX)
            {
                f.x = f.x + f.x * pc;
            }
            else
            {
                f.x = f.x + dW;
            }
        }

        dH = sv.h - sv.previousH;
        pc = dH / sv.previousH;

        if (m & WV.RESIZE_HEIGHT_FLEX)
        {
            if (!(m & WV.RESIZE_TOP_FLEX) && !(m & WV.RESIZE_BOTTOM_FLEX))
            {
                f.h = f.h + dH;
            }
            else
            {
                f.h = f.h + f.h * pc;
            }
        }
        if (m & WV.RESIZE_TOP_FLEX)
        {
            if (m & WV.RESIZE_HEIGHT_FLEX)
            {
                f.y = f.y + f.y * pc;
            }
            else
            {
                f.y = f.y + dH;
            }
        }

        this.setFrame(f);
    },

    hitTest: function(point)
    {
        var convP, hit,
            subs = this.subViews,
            sv = this.superView;

        if (!this.visible)
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
            for (var i = 0; i < subs.length; i++)
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

    // view passed in must be an ancestor for now, if no ancestor passed, assumes PageView
    convertPointFromView: function(point, ancestor)
    {
        var convX = point.x,
            convY = point.y,
            v = this;

            ancestor = ancestor || WV.PageView;

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

    toString: function()
    {
        return ['id: ', this.id, '\n',
                 '{ x: ', this.x.toFixed(2),
                  ' y: ', this.y.toFixed(2),
                  ' w: ', this.w.toFixed(2),
                  ' h: ', this.h.toFixed(2), ' }\n'].join('');
    }
});

WV.TemplateView = WV.extend(WV.View, {
    vtype: 'templateview',
    constructor: function(config)
    {
        config = config || {};

        config.dataSource = config.dataSource || this;

        WV.TemplateView.superclass.constructor.call(this, config);
        return this;
    },
    getTemplateData: function()
    {
        return this.templateData;
    },

    refresh: function()
    {
        this.template.overwrite(this.dom, this.dataSource.getTemplateData());
        return this;
    },
    
    afterRender: function()
    {
        WV.TemplateView.superclass.afterRender.call(this);
        this.refresh();
    }
});

WV.ScrollView = WV.extend(WV.View, {
    vtype: 'scrollview',
    showVerticalScroll: false,
    showHorizontalScroll: false,

    constructor: function(config)
    {
        config = config || {};
        config.style = config.style || {};
        
        Ext.apply(config.style, {
            margin: '0px',
            border: '0 none',
            padding: '0px',
            overflowY: config.showVerticalScroll ? 'scroll' : 'auto',
            overflowX: config.showHorizontalScroll ? 'scroll' : 'auto'
        });

        WV.ScrollView.superclass.constructor.call(this, config);

        return this;
    },

    setClipSubViews: function(clip)
    {
        return this;
    },

    getContentWidth: function()
    {
        return this.rendered ? this.dom.clientWidth : this.w;
    },

    getContentHeight: function()
    {
        return this.rendered ? this.dom.clientHeight : this.h;
    },

    setShowVerticalScroll: function(show)
    {
        this.showVerticalScroll = show === true;

        this.setStyle('overflowY', this.showVerticalScroll ? 'scroll' : 'auto');
    },

    setShowHorizontalScroll: function(show)
    {
        this.showHorizontalScroll = show === true;

        this.setStyle('overflowX', this.showHorizontalScroll ? 'scroll' : 'auto');
    }
});

WV.Label = WV.extend(WV.View, {
    vtype: 'label',
    h: 21,
    w: 100,
    tag: 'span',
    text: 'Label',
    domTpl: { html: '{text}', type: '{type}', name: '{name}' }
});

WV.Button = WV.extend(WV.View, {
    vtype: 'button',
    h: 21,
    w: 300,
    tag: 'button',
    text: 'Button',
    type: 'button',
    domTpl: { html: '{text}', type: '{type}', name: '{name}' }
});

WV.Image = WV.extend(WV.View, {
    vtype: 'image',
    tag: 'img',
    autoResizeMask: WV.RESIZE_NONE,
    resizeSubViews: false,
    visible: false,
    preserveAspect: 'width',
    actualWidth: 0,
    actualHeight: 0,

    afterRender: function()
    {
        WV.Image.superclass.afterRender.call(this);

        this.setSrc(this.src);
    },

    setSize: function(w, h)
    {
        if (!this.rendered)
        {
            return WV.Image.superclass.setSize.call(this, w, h);
        }
        if (!w && !h)
        {
            WV.Image.superclass.setSize.call(this, this.dom.width, this.dom.height);
        }
        else if (this.preserveAspect === 'width')
        {
            if (typeof w === 'string')
            {
                w = this.convertRelative('width', w);
            }
            WV.Image.superclass.setSize.call(this, w, this.actualHeight / this.actualWidth * w);
        }
        else if (this.preserveAspect === 'height')
        {
            if (typeof h === 'string')
            {
                h = this.convertRelative('height', h);
            }
            WV.Image.superclass.setSize.call(this, this.actualWidth / this.actualHeight * h, h);
        }
        else
        {
            WV.Image.superclass.setSize.call(this, w, h);
        }

        return this;
    },
    // private
    preLoad: function()
    {
        if (Ext.isIE)
        {
            // On IE we must do this to get the actual width/height from the dom.
            var tmpImg = new Image();
            Ext.EventManager.addListener(tmpImg, 'load', function(e, img) {
                this.actualHeight = tmpImg.height;
                this.actualWidth = tmpImg.width;
                tmpImg = undefined;
                this.load();
            }, this, { single: true });
            tmpImg.src = this.src;
        }
    },
    // private
    load: function()
    {
        if (this.rendered)
        {
            Ext.EventManager.addListener(this.dom, 'load', function(e, img) {
                if (!Ext.isIE)
                {   // We already got this from the temporary image in preLoad
                    this.actualHeight = this.dom.height;
                    this.actualWidth = this.dom.width;
                }
                this.setSize(this.w, this.h);
                this.setVisible(true);

            }, this, { single: true });
            this.dom.src = this.src;
        }
    },
    setSrc: function(src)
    {
        this.src = src;

        Ext.isIE ? this.preLoad() : this.load();

        return this;
    }
});