
WV.style = {};

WV.style.Stylable = {
    // name can be an object and value === true specifies that the "set" is additive, it will not remove styles not present in the new style object
    // Otherwise, name and value act as one would expect
    setStyle: function(name, value)
    {
        if (typeof name === 'object')
        {
            // Remove styles not present in the new object unless we are told to be additive (value param === true)
            if (value !== true)
            {
                for (var x in this.style)
                {
                    // Never remove some important styles
                    // TODO Turn this into a Regex test
                    if (!name.hasOwnProperty(x) && x !== 'position' && x !== 'boxSizing'
                                                && x.indexOf('margin') !== 0 && x !== 'filter'
                                                && x.indexOf('overflow') !== 0 && x !== 'display')
                    {
                        this.setStyle(x, '');
                        delete this.style[x];
                    }
                }
            }
            for (var s in name)
            {
                this.setStyle(s, name[s]);
            }
            return this;
        }

        var setFn = this['set' + name.replace(/([a-z])/, name.charAt(0).toUpperCase())],
            transP;

        // Convert config literals into objects
        if (value.hasOwnProperty('vtype'))
        {
            value = WV.create(value.vtype, value);
        }

        if (setFn)
        {
            setFn.call(this, value);
        }
        else
        {
            transP = WV.styleLib[name] || name;
            this.style[name] = value;
            // Just in case display is set without calling setVisible
            if (name === 'display')
            {
                this.hidden = (value === 'none');
            }
            if (this.rendered)
            {
                 this.dom.style[transP] = (value || '').toString();  // May need to check for value === 0 
            }
        }
        return this;
    },

    addStyle: function(style)
    {
        return this.setStyle(style, true);
    },

    buildStyle: function()
    {
        var prop, trans, val, buf = [],
            bw = this.superView ? parseInt(this.superView.style.borderWidth, 10) || 0 : 0;

        buf[buf.length] = 'width: ' + this.w + 'px';
        buf[buf.length] = 'height: ' + this.h + 'px';
        buf[buf.length] = 'left: ' + this.x + 'px';
        buf[buf.length] = 'top: ' + this.y + 'px';
        buf[buf.length] = 'margin-left: ' + (parseInt(this.style.marginLeft) || 0 - bw) + 'px';
        buf[buf.length] = 'margin-top: ' + (parseInt(this.style.marginTop) || 0 - bw) + 'px';
        buf[buf.length] = 'z-index: ' + this.z;

        for (prop in this.style)
        {
           if (prop.indexOf('margin') < 0)
            {
                trans = WV.styleLib[prop] || prop;
                trans = WV.deCamel(trans);
                val = (this.style[prop] === 0) ? 0 : (this.style[prop] || '');
                buf[buf.length] = trans + ': ' + val.toString();
            }
        }

        buf[buf.length - 1] += ';';

        return buf.join('; ');
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

    setBorderWidth: function(newVal)
    {
        var i = 0,
            l = this.subViews.length,
            bw = (Math.max(0, parseInt(newVal, 10)) || 0) + 'px'; // No negative border widths

        if (bw !== (this.style.borderWidth || '0px'))
        {
            this.style.borderWidth = bw;

            if (this.rendered)
            {
                this.dom.style.borderWidth = bw;
            }

            // Adjust the subviews for the new borderWidth
            for (i = 0, l = this.subViews.length; i < l; i++)
            {
                this.subViews[i].setMarginLeft(this.style.marginLeft);
                this.subViews[i].setMarginTop(this.style.marginTop);
            }
        }
        return this;
    },

    setOpacity: function(op)
    {
        if (!(typeof op === 'number') || op === NaN)
        {
            return this;
        }

        if (this.enabled)
        {
            this.style.opacity = op;
            if (this.rendered)
            {
                this.dom.style.opacity = op;
            }
        }
        else { this._prevOpacity = op; } // See View.setEnabled

        return this;
    },

    setMarginLeft: function(m)
    {
        m = parseFloat(m, 10) || 0;
        var bw = this.superView ? parseInt(this.superView.style.borderWidth, 10) || 0 : 0;

        this.style.marginLeft = m ? m + 'px' : '';

        if (this.rendered)
        {
            this.dom.style.marginLeft = (m - bw) + 'px';
        }
        return this;
    },

    setMarginTop: function(m)
    {
        m = parseFloat(m, 10) || 0;
        var bw = this.superView ? parseInt(this.superView.style.borderWidth, 10) || 0 : 0;

        this.style.marginTop = m ? m + 'px' : '';

        if (this.rendered)
        {
            this.dom.style.marginTop = (m - bw) + 'px';
        }
        return this;
    }
};

WV.style.Color = WV.extend(Object, {
    vtype: 'color',
    r: 0,
    g: 0,
    b: 0,
    a: 1,
    colorName: null,
    constructor: function(config)
    {
        var rgb = ['r', 'g', 'b'];

        if (typeof config === 'string')
        {
            var vals,
                self = this,
                rgbRegEx = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/,
                rgbaRegEx = /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|1\.0|0?\.[0-9]{1,2})\s*\)/;

            // Look for an #RGB or #RRGGBB style
            if (config.indexOf('#') === 0)
            {
                if (config.length === 4)
                {
                    var ch;

                    Ext.each(rgb, function(color, idx) {
                        ch = config.charAt(idx + 1);
                        self[color] = parseInt(ch + ch, 16);
                    });
                }
                else if (config.length === 7)
                {
                    Ext.each(rgb, function(color, idx) {
                        self[color] = parseInt(config.substr((idx * 2) + 1, 2), 16);
                    });
                }
                else { throw new Error('Invalid Color: ' + config); }
            }
            // Look for rgb(0,0,0) or rgba(0,0,0,0) style
            else if (vals = config.match(rgbaRegEx))
            {
                this.r = parseInt(vals[1]);
                this.g = parseInt(vals[2]);
                this.b = parseInt(vals[3]);
                this.a = parseFloat(vals[4]);
            }
            else if (vals = config.match(rgbRegEx))
            {
                Ext.each(rgb, function(color, idx) {
                    self[color] = parseInt(vals[idx + 1]);
                });
            }
            else // Must be 'white', 'blue' etc...
            {
                this.colorName = config;
            }
        }
        else
        {
            WV.apply(this, config);
        }
    },
    toString: function()
    {
        return this.colorName || String.format('rgba({0},{1},{2},{3})',
                                                      this.r, this.g,
                                                      this.b, this.a);
    }
});

WV.style.BoxShadow = WV.extend(Object, {
    vtype: 'boxshadow',
    xOffset: '0px',
    yOffset: '0px',
    blurRadius: '0px',
    spreadRadius: '0px',
    inset: false,
    color: new WV.style.Color('rgba(0,0,0,0.5'),
    constructor: function(config)
    {
        WV.apply(this, config);
        if (typeof this.color === 'string' || this.color.hasOwnProperty('vtype'))
        {
            this.color = new WV.style.Color(this.color);
        }
    },
    toString: function()
    {
        var str = this.inset ? 'inset ' : '';
        str += String.format('{0} {1} {2} {3} {4}',
                              this.color.toString(), this.xOffset,
                              this.yOffset, this.blurRadius,
                              this.spreadRadius);
        return str;
    }

});

WV.style.LinearGradient = WV.extend(Object, {
    vtype: 'lineargradient',
    startFrom: 'top',
    angle: '',
    stops: [],
    constructor: function(config)
    {
        WV.apply(this, config);
        var stops = this.stops;
        if (Ext.isArray(stops))
        {
            var stop, i, l;

            // Normalize stops into: { color: WV.style.Color, length: 0.50 }
            for (i = 0, l = stops.length; i < l; i++)
            {
                stop = typeof stops[i] === 'string' ? new WV.style.Color(stops[i])
                                                    : stops[i];

                if (stop instanceof WV.style.Color)
                {
                    stop = {
                        color: stop,
                        length: (i/(stops.length-1)).toFixed(2)
                    }
                }
                if (stop.color.hasOwnProperty('vtype'))
                {
                    stop.color = new WV.style.Color(stop.color);
                }
                stops[i] = stop;
            }
        }
        else { throw new Error('Invalid stops config: ' + this.stops);}
    },
    // Default to Mozilla syntax (no angle yet as others do not support it.
    toString: function()
    {
        var i, l,
            stops = this.stops,
            str = String.format('-moz-linear-gradient({0}', this.startFrom);
        for (i = 0, l = stops.length; i < l; i++)
        {
            str += String.format(', {0} {1}%', stops[i].color.toString(),
                                               stops[i].length * 100);
        }
        str += ')';
        return str;
    }
});

WV.style.Transform2D = WV.extend(Object, {
    vtype: 'transform2d',
    translateX: '0px',
    translateY: '0px',
    rotate: '0deg',
    scaleX: 1.0,
    scaleY: 1.0,
    skewX: '0deg',
    skewY: '0deg',
    // m11,m12,m21,m22
    constructor: function(config)
    {
        WV.apply(this, config);
    },
    toString: function()
    {
        var str = '';
        // Order is translate, rotate, skew, scale as this is the order of the
        // IE Matrix filter override. Ability to specfy the order might be nice.
        if (this.hasOwnProperty('translateX') || this.hasOwnProperty('translateY'))
        {
            str += String.format('translate({0}, {1})', this.translateX, this.translateY);
        }
        if (this.hasOwnProperty('rotate'))
        {
            str += String.format('rotate({0})', this.rotate);
        }
        Ext.each(['skew', 'scale'], function(t) {
            if (this.hasOwnProperty(t + 'X') || this.hasOwnProperty(t + 'Y'))
            {
                str += String.format(' {0}({1}, {2})', t, this[t + 'X'], this[t + 'Y']);
            }
        }, this);
        return str;
    }
});