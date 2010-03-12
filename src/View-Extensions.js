WV.Label = WV.extend(WV.View, {
    vtype: 'label',
    h: 18,
    w: 38,
	cls: 'wv-label',
    text: '',
    autoResizeMask: WV.RESIZE_NONE,
    domTpl: { html: '{text}{_subViewHtml}' },
	style: {
        color: '#000',
        fontFamily: 'Verdana',
		fontSize: '11px',
		fontWeight: 'normal'
	}
});

WV.Link = WV.extend(WV.Label, {
    vtype: 'link',
    cls: 'wv-link',
    tag: 'a',
    domTpl: { href: '{url}', target: '{target}' },
    newWindow: false,
    preventNavigation: false,
    constructor: function(config)
    {
        WV.Link.superclass.constructor.call(this, config);

        this.target = this.newWindow ? '_blank' : (config.target || '');
        return this;
    },
    click: function(e)
    {
        if (this.preventNavigation)
        {
            e.cancel();
        }
        WV.Link.superclass.click.call(this, e);
    }
});

WV.Image = WV.extend(WV.View, {
    vtype: 'image',
    tag: 'img',
    autoResizeMask: WV.RESIZE_NONE,
    resizeSubViews: false,
    preserveAspect: 'width',
    loaded: false,
    useNaturalSize: false,
    naturalWidth: 0,
    naturalHeight: 0,

    afterRender: function()
    {
        WV.Image.superclass.afterRender.call(this);
        this.setSrc(this.src);
    },

    setSize: function(w, h)
    {
        if (!this.loaded)
        {
            return WV.Image.superclass.setSize.call(this, w, h);
        }
        else if (this.preserveAspect === 'width')
        {
            if (typeof w === 'string')
            {
                w = this.convertRelative('width', w);
            }
            WV.Image.superclass.setSize.call(this, w, this.naturalHeight / this.naturalWidth * w);
        }
        else if (this.preserveAspect === 'height')
        {
            if (typeof h === 'string')
            {
                h = this.convertRelative('height', h);
            }
            WV.Image.superclass.setSize.call(this, this.naturalWidth / this.naturalHeight * h, h);
        }
        else
        {
            WV.Image.superclass.setSize.call(this, w, h);
        }
        return this;
    },
    setNaturalSize: function()
    {
        return this.setSize(this.naturalWidth, this.naturalHeight);   
    },
    // private
    preLoad: function()
    {
        // We must use the Image constructor to relaiably get the actual width/height of the image.
        // Subsequent loads should be in the browser cache
        var tmpImg = new Image();
        Ext.EventManager.addListener(tmpImg, 'load', function(e, img) {
            this.naturalHeight = tmpImg.height;
            this.naturalWidth = tmpImg.width;
            tmpImg = undefined;
            this.load();
        }, this, { single: true });
        tmpImg.src = this.src;
    },
    // private
    load: function()
    {
        if (this.rendered)
        {
            Ext.EventManager.addListener(this.dom, 'load', function(e, img) {
                this.loaded = true;
                this.useNaturalSize ? this.setNaturalSize() : this.setSize(this.w, this.h);
            }, this, { single: true });
            this.dom.src = this.src;
        }
    },
    setSrc: function(src)
    {
        this.src = src;
        this.loaded = false;
        this.preLoad();

        return this;
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
    showVerticalScroll: 'auto',
    showHorizontalScroll: 'auto',
    scrollConfigMap: { auto: 'auto', always: 'scroll', never: 'hidden' },
    style: {
        margin: '0px',
        border: '0 none',
        padding: '0px'
    },
    
    constructor: function(config)
    {
        WV.ScrollView.superclass.constructor.call(this, config);

        this.setShowHorizontalScroll(this.showHorizontalScroll);
        this.setShowVerticalScroll(this.showVerticalScroll);
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

    setShowVerticalScroll: function(mode)
    {
        this.showVerticalScroll = mode;
        this.setStyle('overflowY', WV.ScrollView.prototype.scrollConfigMap[this.showVerticalScroll]);
    },

    setShowHorizontalScroll: function(mode)
    {
        this.showHorizontalScroll = mode;
        this.setStyle('overflowX', WV.ScrollView.prototype.scrollConfigMap[this.showHorizontalScroll]);
    }
});

WV.ExtView = WV.extend(WV.View, {
    vtype: 'extview',
    constructor: function(config)
    {
        WV.ExtView.superclass.constructor.call(this, config);

        this.extComponent = Ext.create(config.extConfig);
        return this;
    },
    afterRender: function()
    {
        WV.ExtView.superclass.afterRender.call(this);
        this.extComponent.render(this.dom);
        this.extComponent.el.dom.style.position = 'absolute';
        this.extComponent.el.dom.style.top = '0px';
        this.extComponent.el.dom.style.left = '0px';
        this.extComponent.el.dom.style.height = '100%';
        this.extComponent.el.dom.style.width = '100%';
        this.layoutSubViews();
        return this;
    },
    layoutSubViews: function()
    {
        WV.ExtView.superclass.layoutSubViews.call(this);
        if (this.rendered && this.extComponent.isXType('panel'))
        {
            var fh = this.extComponent.getFrameHeight();
            this.extComponent.body.setHeight(this.h - fh);
            this.extComponent.doLayout();
        }
        return this;
    }
});