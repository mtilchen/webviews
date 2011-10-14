
WV.style = {};

WV.style.Stylable = {

    // TODO: Support paths like: shadow.color
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
        }

        else
        {
            var setFn = this['set' + name.replace(/([a-z])/, name.charAt(0).toUpperCase())];

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
                this.style[name] = value;
            }

            // TODO: Intelligently decide this based on the style that is changing, don't just default to the superview
            (this.superView || this).setNeedsDisplay();
        }

        return this;
    },

    addStyle: function(style)
    {
        return this.setStyle(style, true);
    },

    buildStyle: function()
    {
        return '';
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
        }
        else { this._prevOpacity = op; } // See View.setEnabled

        return this;
    },

  //TODO: Need setImage
  //TODO: Need setRadialGradient
 //TODO: Need setCornerRadius to mark superview as needing display if cornerradius shrinks

    setLinearGradient: function(gradient)
    {
        if (gradient && typeof gradient === 'object')
        {
            if (gradient instanceof WV.style.LinearGradient)
            {
              this.style.linearGradient = gradient;
            }
            else // We got a config object
            {
              this.style.linearGradient = new WV.style.LinearGradient(gradient);
            }
        }

        return this;
    },

    setShadow: function(shadow)
    {
        if (shadow && typeof shadow === 'object')
        {
            if (shadow instanceof WV.style.BoxShadow)
            {
              this.style.shadow = shadow;
            }
            else // We got a config object
            {
              this.style.shadow = new WV.style.BoxShadow(shadow);
            }
        }
        return this;
    }
};


WV.style.BoxShadow = WV.extend(Object, {
    vtype: 'boxshadow',
    offsetX: 5,
    offsetY: 5,
    blurRadius: 0,
    spreadRadius: 0,
    inset: false,
    color: 'rgba(0,0,0,0.5)',
    constructor: function(config)
    {
        WV.apply(this, config);
    },
    apply: function(ctx)
    {
      ctx.shadowOffsetX = this.offsetX;
      ctx.shadowOffsetY = this.offsetY;
      ctx.shadowBlur = this.blurRadius;
      ctx.shadowColor = this.color;
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

            // Normalize stops into: { color: 'css string', length: 0.50 }
            for (i = 0, l = stops.length; i < l; i++)
            {
                stop = typeof stops[i] === 'string' ? { color: stops[i], length: (i/(stops.length-1)).toFixed(2) }
                                                    : stops[i];
                stops[i] = stop;
            }

            this.stops = stops;
        }
        else { throw new Error('Invalid stops config: ' + this.stops); }
    },

    toCanvasGradient: function(ctx, bounds)
    {
        // TODO: Support angle
        var i, l,
            stops = this.stops,
            startX = bounds.w/2,
            startY = 0,
            endX = startX,
            endY = bounds.h,
            gradient;

        switch(this.startFrom)
        {
          case 'top-left':
            startX = 0; startY = 0; endX = bounds.w; endY = bounds.h;
            break;
          case 'left':
            startX = 0; startY = bounds.h/2; endX = bounds.w; endY = startY;
            break;
          case 'bottom-left':
            startX = 0; startY = bounds.h; endX = bounds.w; endY = 0;
            break;
          default:
            startX = bounds.w/2; startY = 0; endX = startX; endY = bounds.h;
        }

        gradient = ctx.createLinearGradient(startX, startY, endX, endY);

        for (i = 0, l = stops.length; i < l; i++)
        {
          gradient.addColorStop(stops[i].length, stops[i].color);
        }

        return gradient;
    }
});