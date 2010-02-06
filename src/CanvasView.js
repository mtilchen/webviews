
WV.CanvasView = WV.extend(WV.View, {
    vtype: 'canvasview',
    tag: 'canvas',
    domTpl: { width: '{w}', height: '{h}' },

    drawRect: function(rect)
    {
        return this;
    },

    afterRender: function()
    {
        WV.CanvasView.superclass.afterRender.call(this);

        // Pass the entire area of the View until intelligent decisions about drawing sub areas can be made.
        var rect = this.getSize();
        rect.x = 0;
        rect.y = 0;

        this.drawRect(rect);
        return this;
    },

    getContext: function()
    {
        return this.dom.getContext('2d');
    },

    setFrame: function(frame)
    {
        this.previousW = this.w;
        this.previousH = this.h;

        this.x = (typeof frame.x === 'number') ? frame.x : this.x;
        this.y = (typeof frame.y === 'number') ? frame.y : this.y;
        this.w = (typeof frame.w === 'number') ? frame.w : this.w;
        this.h = (typeof frame.h === 'number') ? frame.h : this.h;

        if (Ext.isWebKit && this.superView)
        {
            if ((this.x + this.w) == this.superView.w)
            {
                this.w = Math.ceil(this.w);
            }
            if ((this.y + this.h) == this.superView.h)
            {
                this.h = Math.ceil(this.h);
            }
        }

        if (this.rendered)
        {
            var bw = this.superView ? parseInt(this.superView.style.borderWidth, 10) || 0 : 0;
            this.dom.style.left = (this.x - bw) + 'px';
            this.dom.style.top = (this.y - bw) + 'px';
            this.dom.style.width = this.w + 'px';
            this.dom.style.height = this.h + 'px';
            this.dom.width = this.w;
            this.dom.height = this.h;
        }

        if (this.previousH !== this.h || this.previousW !== this.w)
        {
            this.layoutSubViews();
        }

        return this;
    },

    setSize: function(w, h)
    {
        this.previousW = this.w;
        this.previousH = this.h;
        this.h = (typeof h === 'number') ? h : this.h;
        this.w = (typeof w === 'number') ? w : this.w;

        if (this.rendered)
        {
            this.dom.style.width = this.w + 'px';
            this.dom.style.height = this.h + 'px';
            this.dom.width = this.w;
            this.dom.height = this.h;
        }

        if (this.previousH !== this.h || this.previousW !== this.w)
        {
            this.layoutSubViews();
        }

        return this;
    }
});