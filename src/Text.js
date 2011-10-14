
WV.Text = WV.extend(WV.View, {
    vtype: 'text',
    tpl: WV.createTemplate('<div id="{id}" style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px; opacity: 0.0; overflow: visible; font: {_font}">{text}</div>'),

    wrap: false,
    align: 'left',

    constructor: function(config)
    {
        config = config || {};

        WV.Text.superclass.constructor.call(this, config);

        this.setText(this.text || '');
        this.text = this.lines.join('<br/>');
        this.initDom();
        delete this.text; // Must use getText()
        this.setAlign(this.align);
        this.selection = {
            start: 0,
            end: 0
        };

        return this;
    },
    initDom: function()
    {
        //TODO: Re-enable transparent text overlay for supporting selection
//        if (!this.dom && document)
//        {
//            this._font = this.style.font || '';
//            this.dom = this.tpl.append(Ext.getBody(), this, true).dom;
//            this.dom.setAttribute('_textOverlay', 'true'); // Let others know what we are doing with this
//            delete this._font;
//        }
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
        text = text || '';
        this.lines = text.split('\n');

        if (this.dom)
        {
            this.dom.innerText = text;
        }
        this.setNeedsDisplay();
    },
    getText: function()
    {
        return this.lines.join('\n');
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
    draw: function(ctx, rect)
    {
        var font = this.style.font,
            height = WV.Text.measure(font, this.lines[0]).h,
            startX;

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
                startX = (rect.w / 2);
                break;
            case 'right':
                ctx.textAlign = 'end';
                startX = rect.w;
                break;
            default:
                ctx.textAlign = 'start';
                startX = 0;
                break;
        }

        //TODO: Support wrapping
        // If we have selected regions then we need to paint them separately
        this.lines.forEach(function(line, i) {
            ctx.fillText(line.trim() || '', startX, i * height);
        });
    },

    selectedText: function()
    {
        return this.text.substring(this.selection.start, this.selection.end);
    },

    mouseDown: function(e)
    {
        WV.log('**** Mouse Down ****');
        // Clear selection
        this.beginSelection(this.convertPointFromView(e.windowPoint));
        return WV.Text.superclass.mouseDown.call(this, e);
    },
    mouseDragged: function(e)
    {
        WV.log('Selection: ' + window.getSelection().toString());
        // Clear selection in all other Text instances
        // Calculate selected characters starting from original insertion point
        // Redraw
        return WV.Text.superclass.mouseDragged.call(this, e);
    },

    beginSelection: function(p /* Point in view coordinates */)
    {
        var line = Math.floor(p.y / WV.Text.measure(this.style.font, this.lines[0]).h),
            i, l,
            offset = this.lines[line].length;

        for (i = 0, l = this.lines[line].length; i < l; i++)
        {
            //TODO: Support center and right align
            if (p.x < WV.Text.measure(this.style.font, this.lines[line].substring(0, i)).w)
            {
                offset = i;
                break;
            }
        }

        WV.log('Selection start line: ' + line);
        WV.log('Selection start offset: ' + offset);
    }
});

WV.Text.measure = function(font, text)
{
    var el = WV.Text._sharedEl || (WV.Text._sharedEl = Ext.DomHelper.append(Ext.getBody(), { id: 'shared-metrics', style: 'position: absolute; top: -1000px; left: -1000px;'}, true).dom);

    el.style.font = font;
    el.innerHTML = text.replace(/\n/g, '');

    return { w: el.clientWidth, h: el.clientHeight };
}
