if (Ext.isIE)
{
    (function() {

        var proto = WV.View.prototype,
            origBuildStyle = proto.buildStyle,
            deg2Rad = Math.PI * 2 / 360;

        WV.View.override({
            buildIEFilter: function()
            {
                var buf = [],
                    st = this.style,
                    op = parseInt((st.opacity || 1) * 100),
                    t = st.transform,
                    shad = st.boxShadow;

                if (t)
                {
                    var template = 'progid:DXImageTransform.Microsoft.Matrix(M11={0}, M12={1}, M21={2}, M22={3}, sizingMethod=\'auto expand\') ';

                    // Set a and b to identity, c is a temp 
                     var a11 = 1, a12 = 0, a21 = 0, a22 = 1,
                         b11 = 1, b12 = 0, b21 = 0, b22 = 1,
                         c11, c12, c21, c22;

                    // Rotate
                    if (t.rotate)
                    {
                        var radians = parseInt(t.rotate) * deg2Rad,
                            cosTheta = Math.cos(radians),
                            sinTheta = Math.sin(radians);

                        a11 = cosTheta, a12 = -sinTheta,
                        a21 = sinTheta, a22 = cosTheta;
                    }

                    // Scale
                    b12 = 0,
                    b21 = 0,
                    b11 = parseFloat(t.scaleX) || 1,
                    b22 = parseFloat(t.scaleY) || 1;

                    c11 = (a11 * b11) + (a12 * b21);
                    c12 = (a11 * b12) + (a12 * b22);
                    c21 = (a21 * b11) + (a22 * b21);
                    c22 = (a21 * b12) + (a22 * b22);

                    // Skew
                    b12 = Math.tan((parseInt(t.skewX) || 0) * deg2Rad),
                    b21 = Math.tan((parseInt(t.skewY) || 0) * deg2Rad),
                    b11 = 1,
                    b22 = 1;

                    t.m11 = (c11 * b11) + (c12 * b21);
                    t.m12 = (c11 * b12) + (c12 * b22);
                    t.m21 = (c21 * b11) + (c22 * b21);
                    t.m22 = (c21 * b12) + (c22 * b22);

                    // Translate
                    t.m13 = parseInt(t.translateX) || 0;
                    t.m23 = parseInt(t.translateY) || 0;

                    buf[buf.length] = String.format(template, t.m11.toFixed(6),
                                                    t.m12.toFixed(6),
                                                    t.m21.toFixed(6),
                                                    t.m22.toFixed(6));
                }
                if (st.boxShadow)
                {
                    buf[buf.length] = String.format('progid:DXImageTransform.Microsoft.DropShadow(OffX={0}, OffY={1}, Color={2}, Positive=true) ',
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
                    buf[buf.length] = String.format('progid:DXImageTransform.Microsoft.Alpha(opacity={0}) ', Math.min(100, op));
                }

                return buf.length > 0 ? buf.join(' ') : '';
            },

            // Compensate for IE boundingBox origin shift, transformOrigin change and for explicit translation by using margin
            adjustForTransform: function()
            {
                var st = this.style,
                    t = st.transform,
                    org = st.transformOrigin || '50% 50%',
                    ieXAdj = 0, ieYAdj = 0, orgXAdj = 0, orgYAdj= 0,
                    dx = 0, dy = 0,
                    org_xy = [];

                if (t)
                {
                    org = org.replace(/center/g, '50%').
                              replace(/left/g, '0%').
                              replace(/top/g, '0%').
                              replace(/right/g, '100%').
                              replace(/bottom/g, '100%');

                    org_xy = org.split(' ');
                    if (org_xy.length)
                    {
                        org_xy[1] = org_xy[1] || '50%';
                        // The array elements now represent the origin point
                        org_xy[0] = (parseInt(org_xy[0]) / 100) * this.w;
                        org_xy[1] = (parseInt(org_xy[1]) / 100) * this.h;
                    }
                    else
                    {
                        throw new Error('Invalid transformOrigin: ' + org);
                    }

                    // Offset adjustment for IE bounding box origin shift from rotation
                    ieXAdj = ((Math.abs(t.m11) * this.w) + (Math.abs(t.m12) * this.h)) / 2;
                    ieYAdj = ((Math.abs(t.m21) * this.w) + (Math.abs(t.m22) * this.h)) / 2;

                    // Offset adjustment for explicit origin shift
                    dx = (this.w / 2) - org_xy[0],
                    dy = (this.h / 2) - org_xy[1];

                    orgXAdj = (dx * t.m11) + (dy * t.m12) + org_xy[0];
                    orgYAdj = (dx * t.m21) + (dy * t.m22) + org_xy[1];

                    this.setMarginLeft(orgXAdj - ieXAdj + t.m13);
                    this.setMarginTop(orgYAdj - ieYAdj + t.m23);
                }
                return this;
            },
            applyFilters: function(includeSubViews)
            {
                this.style.filter = this.buildIEFilter();
                this.adjustForTransform();
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
                return this.style.filter;
            },
            setBoxShadow: function(spec)
            {
                this.style.boxShadow = spec;
                if (this.rendered) { this.applyFilters(); }
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
                if (this.rendered) { this.applyFilters(applySubs); }
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
                if (this.rendered) { this.applyFilters(applySubs); }
                return this;
            },
            setTransform: function(val)
            {
                if (!(val instanceof WV.style.Transform2D))
                {
                    throw new Error('IE requires transforms to be specified with a WV.style.Transform2D object');
                }

                this.style.transform = val;
                if (this.rendered) { this.applyFilters(); }
                return this;
            },
            buildStyle: function()
            {
                // Save this because we need to remove it before calling buildStyle
                var op = this.style.opacity,
                    styleString;

                // This will populate this.style.filter so it will show up on the resulting string
                this.applyFilters();
                delete this.style.opacity;
                styleString = origBuildStyle.call(this),
                this.style.opacity = op;

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