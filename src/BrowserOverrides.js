if (Ext.isIE)
{
    (function() {

        var origBuildStyle = WV.View.prototype.buildStyle;

        WV.View.override({
            buildIEFilter: function()
            {
                var buf = [],
                    st = this.style,
                    op = parseInt((st.opacity || 1) * 100),
                    shad = st.boxShadow;

                if (st.boxShadow)
                {
                    buf[buf.length] = String.format('progid:DXImageTransform.Microsoft.DropShadow(OffX={0}, OffY={1}, Color={2}, Positive=true)',
                                                     parseInt(shad.xOffset) || 0,
                                                     parseInt(shad.yOffset) || 0,
                                                     shad.color.toIEString(true, st.opacity));
                }
                if (st.backgroundImage instanceof WV.style.LinearGradient)
                {
                    buf[buf.length] = st.backgroundImage.toString();
                }
                // What's worse, doing this check or including Alpha(opacity=100) for every view by default?
                // See note in setOpacity and setBoxShadow
                if (op < 100 || this.isDescendantOf(function(sv) { return sv.style.opacity < 1 || !!sv.style.boxShadow; }))
                {
                    buf[buf.length] = String.format('Alpha(opacity={0})', Math.min(100, op));
                }

                return buf.length > 0 ? buf.join(' ') : '';
            },
            applyFilters: function(includeSubViews)
            {
                this.style.filter = this.buildIEFilter();

                if (this.rendered)
                {
                    this.dom.style.filter = this.style.filter;
                    if (includeSubViews === true)
                    {
                        for (var i = 0, l = this.subViews.length; i < l; i++)
                        {
                            this.subViews[i].applyFilters();
                        }
                    }
                }
            },
            setBoxShadow: function(spec)
            {
                this.style.boxShadow = spec;
                this.applyFilters();

                return this;
            },
            setOpacity: function(val)
            {
                if (!(typeof val === 'number') || val === NaN)
                {
                    return this;
                }

                this.style.opacity = val;

                // opacity < 1 will cause artifacts in direct overlapping subviews
                // if one subview also has opacity while another does not
                var applySubs = (val < 1);
                this.applyFilters(applySubs);

                return this;
            },
            setBackgroundImage: function(val)
            {
                var applySubs = false;
                this.style.backgroundImage = val;

                if (typeof val === 'string' && this.rendered)
                {
                    this.dom.style.backgroundImage = val;
                }
                else  // Must be an object ie a Gradient
                {
                    // Gradient filters with a boxShadowed ancestor will
                    // cause artifacts unless the opacity filter is set
                    applySubs = true;
                }
                this.applyFilters(applySubs);
                return this;
            },
            buildStyle: function()
            {
                // Save this because we need to remove it before calling buildStyle
                var op = this.style.opacity,
                    styleString, filterString;

                delete this.style.opacity;
                styleString = origBuildStyle.call(this),
                this.style.opacity = op;
                filterString = this.buildIEFilter();

                if (filterString.length > 0)
                {
                    styleString += '-ms-filter: \'';
                    styleString += filterString;
                    styleString += '\'';
                }

                return styleString;
            }
        });

        WV.style.Color.override({
            toIEString: function(includeAlpha, alphaAdj)
            {
                if (this.stringValue.indexOf('rgb') === 0)
                {
                    var str = '#';
                    if (includeAlpha)
                    {
                        str += WV.decToHexString(this.a * (alphaAdj || 1) * 255);
                    }
                    str += WV.decToHexString(this.r, this.g, this.b);
                    return str;
                }
                else { return this.stringValue; }
            }
        });

        // IE Gradient Filter only supports two colors with either a vertical
        // or horizontal orientation. Use the first and last stops in the
        // array as the start and end colors. Interpret anything but 'top'
        // in startFrom as meaning 'horizontal' from orientation
        WV.style.LinearGradient.override({
            toString: function()
            {
                if (!this.stringValue)
                {
                    this.stringValue = String.format('progid:DXImageTransform.Microsoft.gradient(GradientType={0}, startColorstr={1}, endColorstr={2})',
                                            this.startFrom === 'top' ? 0 : 1,
                                            this.stops[0].color.toIEString(true),
                                            this.stops[this.stops.length - 1].color.toIEString(true));
                }
                return this.stringValue;
            }
        });
        
        WV.VMLView = WV.extend(WV.View, {
            vtype: 'vml',
            tag: 'vml:roundrect',
            arcsize: 0.0,
            stroke: true,
            fill: true,
            domTpl: { fillColor: '{fillcolor}', fill: '{fill}', strokecolor: '{strokecolor}',
                stroke: '{stroke}', strokeweight: '{strokeweight}',
                arcsize: '{arcsize}' },
            autoResizeMask: WV.RESIZE_WIDTH_FLEX | WV.RESIZE_HEIGHT_FLEX
        });
    })();
}

if (Ext.isWebKit)
{
    WV.style.LinearGradient.override({
        toString: function()
        {
            if (!this.stringValue)
            {
                var i, l,
                    stops = this.stops,
                    startAndEndPoints = this.convertStartFrom(),
                    str = String.format('-webkit-gradient(linear, {0}',
                                                  startAndEndPoints);
                for (i = 0, l = stops.length; i < l; i++)
                {
                    str += String.format(', color-stop({0}, {1})',
                                                stops[i].length,
                                                stops[i].color.toString());
                }
                str += ')';
                this.stringValue = str;
            }
            return this.stringValue;
        },
        convertStartFrom: function()
        {
            switch(this.startFrom)
            {
                case 'left':  return ['left top', 'right top']; // Horizonal
                case 'top': return ['left top', 'left bottom']; // Vertical
                case 'left top': return ['left top', 'right bottom']; // Diagonal down
                case 'left bottom': return ['left bottom', 'right top']; // Diagonal up
            }
            throw new Error('Unsupported startFrom position: ' + this.startFrom);
        }
    });
}