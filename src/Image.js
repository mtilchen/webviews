
WV.Image = WV.extend(Object, {
    vtype: 'image',
    preserveAspect: 'width',
    loaded: false,
    useNaturalSize: false,
    naturalWidth: 0,
    naturalHeight: 0,

    constructor: function(config, ownerView)
    {
        WV.apply(this, config);

        // Assign an owner if one is supplied
        this.ownerView = ownerView || this.ownerView;

        this._image = new Image();

        Ext.EventManager.addListener(this._image, 'load', function(e, img) {
            this.naturalHeight = img.height;
            this.naturalWidth = img.width;
            this.loaded = true;
            if (this.ownerView)
            {
                this.ownerView.imageDidLoad(this);
            }
        }, this, { single: true });
        this._image.src = this.src;
    },

    draw: function(ctx, rect)
    {
        var w = this.useNaturalSize ? this.naturalWidth : this.w || rect.w,
            h = this.useNaturalSize ? this.naturalHeight : this.h || rect.h,
            x = this.x || 0,
            y = this.y || 0;

        if (this.loaded)
        {
            ctx.drawImage(this._image, x, y, w, h);
        }
        else { WV.debug('Image not loaded: ' + this.id); }
    }

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
