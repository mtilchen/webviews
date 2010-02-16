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