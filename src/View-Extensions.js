WV.Label = WV.extend(WV.View, {
    vtype: 'label',
    h: 18,
    w: 38,
    text: '',
    autoResizeMask: WV.RESIZE_NONE,
    style: {
        color: '#000',
        fontFamily: 'Verdana',
        fontSize: '11px',
        fontWeight: 'normal'
    }
});

WV.Link = WV.extend(WV.Label, {
    vtype: 'link',
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
    autoResizeMask: WV.RESIZE_NONE,
    resizeSubviews: false,
    preserveAspect: 'width',
    loaded: false,
    useNaturalSize: false,
    naturalWidth: 0,
    naturalHeight: 0,

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
            this.img = tmpImg;
            tmpImg = undefined; // Don't leak
            // TODO: Draw ourselves now?
        }, this, { single: true });
        tmpImg.src = this.src;
    },
    // private
    load: function(src)
    {
        this.src = src;
        this.img = undefined;
        this.loaded = false;
        this.preLoad();

        return this;
    }
});

WV.ScrollView = WV.extend(WV.View, {
    vtype: 'scrollview',
    showVerticalScroll: 'auto',
    showHorizontalScroll: 'auto',

    constructor: function(config)
    {
        WV.ScrollView.superclass.constructor.call(this, config);

        this.setShowHorizontalScroll(this.showHorizontalScroll);
        this.setShowVerticalScroll(this.showVerticalScroll);
        return this;
    },

    setClipSubviews: function(clip)
    {
        return this;
    },

    setShowVerticalScroll: function(mode)
    {
        this.showVerticalScroll = mode;
    },

    setShowHorizontalScroll: function(mode)
    {
        this.showHorizontalScroll = mode;
    }
});