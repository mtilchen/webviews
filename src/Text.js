
WV.Text = WV.extend(WV.View, {
    vtype: 'text',
    tpl: WV.createTemplate('<div id="{id}" style="position:absolute; left:{x}px; top:{y}px; width:{w}px; height:{h}px; overflow:visible; color:transparent; font:{_font}">{text}</div>'),
    wrap: false,
    align: 'left',
    style: { font: '12pt sans-serif'},

    constructor: function(config)
    {
        config = config || {};

        WV.Text.superclass.constructor.call(this, config);

        this.setText(this.text || '');
        this.initDom();

        this.setAlign(this.align);

        return this;
    },
    initDom: function()
    {
        if (!this.dom && document)
        {
            this._font = this.style.font || '';
            this.dom = this.tpl.append(Ext.getBody(), this, true).dom;
            this.dom.setAttribute('_textOverlay', 'true'); // Let others know what we are doing with this
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
        text = text || '';
        this.lines = text.split('\n');

        if (this.dom)
        {
            this.dom.innerText = text.replace(/ /g, '&nbsp;');
        }
        this.setNeedsDisplay();
    },

    setWrap: function(wrap)
    {
        this.wrap = wrap === true;
        if (this.dom)
        {
            this.dom.style.whiteSpace = this.wrap ? 'pre-wrap' : 'pre';
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
        this.lines.forEach(function(line, i) {
            ctx.fillText(line.replace(/&nbsp;/g, ' ') || '', startX, i * height);
        });
    },

    selectedText: function()
    {
      var selection = window.getSelection();

      if (selection.anchorNode && (selection.anchorNode.compareDocumentPosition(this.dom) & 8)) // Does our dom element contains the anchorNode?
      {
        return selection.toString();
      }
      else
      {
        return '';
      }
    }
});

WV.Text.measure = function(font, text)
{
    var el = WV.Text._sharedEl || (WV.Text._sharedEl = Ext.DomHelper.append(Ext.getBody(), { id: 'shared-metrics', style: 'position: absolute; top: -1000px; left: -1000px;'}, true).dom);

    el.style.font = font;
    el.innerHTML = text.replace(/\n/g, '');

    return { w: el.clientWidth, h: el.clientHeight };
}

