WV.StyleMap = WV.extend(Object, {

    defaults: undefined,
    states: undefined,
    constructor: function(config)
    {
        config = config || {};

        WV.apply(this, config);

        var i, l, s, propName, prop;

        for (propName in this)
        {
            prop = this[propName];
            if ('defaults,overrides,states'.indexOf(propName) < 0 &&
                typeof prop === 'object' &&
                !(prop instanceof WV.StyleMap))
            {
                this[propName] = new WV.StyleMap(this[propName]);
            }
        }

        this.states = this.states || [];
        
        for (i = 0, s = this.states, l = s.length; i < l; i++)
        {
            if (!s[i].name || !s[i].name.length)
            {
                throw new Error('Name not found for style state at index: ', i);
            }
            // Create a reference to the style state in the array by its name
            s[s[i].name] = s[i];
        }

        this.overrideStyles(this.overrides);
    },

    computeStyleForStates: function(states)
    {
        // TODO: Cache results and return those instead
        if (Ext.isArray(states)) // Array of strings passed
        {
            states = states.join(',');
        }
        else if (arguments.length > 1) // Muliple Strings passed
        {
            states = Ext.toArray(arguments).join(',');
        }

        // Starting with the defaults, apply each styles for each state found in the new state string
        var i, l, st = this.states,
        computedStyle = WV.apply({}, this.defaults);

        // Go through every state defined (a bit wasteful :/ ) in declared order to preserve precendence
        // and apply the style over the existing computed style
        for (i = 0, l = st.length; i < l; i++)
        {
            if (states.indexOf(st[i].name) >= 0)
            {
                WV.apply(computedStyle, st[i].styles);
            }
        }
        return computedStyle;
    },

    overrideStyles: function(overrides)
    {
        var i, l,
            paths, fullPath, pathUp,
            styleUp, style;

        for (fullPath in overrides)
        {
            paths = fullPath.split('.');
            style = this;
            
            // Turn the path into a reference
            for (i = 0, l = paths.length; i < l; i++)
            {
                styleUp = style;
                pathUp = paths[i];
                style = style[paths[i]];
                if (style && style.styles)
                {
                    styleUp = style;
                    pathUp = 'styles';
                    if (paths[i+1])
                    {
                        styleUp = style.styles;
                        pathUp = paths[i+1];
                        i++;
                    }
                }
            }
            styleUp[pathUp] = overrides[fullPath];
        }
        return this;
    }
});