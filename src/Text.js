
WV.Text = WV.extend(WV.View, {
    vtype: 'text',
    tpl: WV.createTemplate('<div id="{id}" style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px; opacity: 0.5; overflow: visible; font: {_font}">{text}</div>'),

    text: '',
    wrap: false,
    align: 'left',

    constructor: function(config)
    {
        config = config || {};

        WV.Text.superclass.constructor.call(this, config);

        this.initDom();

        this.setText(this.text);
        this.setAlign(this.align);

        return this;
    },
    initDom: function()
    {
        if (!this.dom && document)
        {
            this._font = this.style.font || '';
            this.dom = this.tpl.append(Ext.getBody(), this, true).dom;
            delete this._font;
        }
        return this.setWrap(this.wrap);
    },
    setFrame: function(frame)
    {
        WV.Text.superclass.setFrame.call(this, frame);
        if (this.dom)
        {
            this.dom.style.left = this.x + 'px';
            this.dom.style.top = this.y + 'px';
            this.dom.style.width = this.w + 'px';
            this.dom.style.height = this.h + 'px';
        }
        return this;
    },
    setStyle: function(name, value)
    {
        WV.Text.superclass.setStyle.call(this, name, value);
        if (this.dom)
        {
            if (name === 'font')
            {
                this.dom.style.font = value;
            }
        }
        return this;
    },
    setText: function(text)
    {
        this.text = text || '';
        if (this.dom)
        {
            this.dom.innerHTML = text.replace(/\n/g, '<br/>');
        }
        this.setNeedsDisplay();
    },
    setWrap: function(wrap)
    {
        this.wrap = wrap === true;
        if (this.dom)
        {
            this.dom.style.whiteSpace = this.wrap ? 'normal' : 'nowrap';
        }
        this.setNeedsDisplay();
        return this;
    },
    setAlign: function(align)
    {
        this.align = align;
        if (this.dom)
        {
            this.dom.style.textAlign = align;
        }
        this.setNeedsDisplay();
    },
    baseDraw: function(rect, ctx)
    {
        var lines = this.text.split('\n'),
            font = this.style.font,
            height = WV.Text.measure(font, this.text).h,
            startX,
            self = this;


        WV.Text.superclass.baseDraw.call(this, rect, ctx);
        ctx.font = font;
        ctx.fillStyle = this.style.textColor || 'black';
        ctx.textBaseline = 'top';

        switch (this.align)
        {
            case 'left':
                ctx.textAlign = 'start';
                startX = 0;
                break;
            case 'center':
                ctx.textAlign = 'center';
                startX = (this.w / 2);
                break;
            case 'right':
                ctx.textAlign = 'end';
                startX = this.w;
                break;
            default:
                ctx.textAlign = 'start';
                startX = 0;
                break;
        }

        lines.forEach(function(line, i) {
            ctx.fillText(line.trim() || '', startX, i * height);
        });
    }
});

WV.Text.measure = function(font, text)
{
    var el = WV.Text._sharedEl || (WV.Text._sharedEl = Ext.DomHelper.append(Ext.getBody(), { id: 'shared-metrics', style: 'position: absolute; top: -1000px; left: -1000px;'}, true).dom);

    el.style.font = font;
    el.innerHTML = text;

    return { w: el.clientWidth, h: el.clientHeight };
}
