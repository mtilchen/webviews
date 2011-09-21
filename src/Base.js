
Ext.USE_NATIVE_JSON = true;
Ext.enableGarbageCollector = false;

WV = (function() {

    var idCount = 0,
         initializers = [],
         vtypes = {},
         cache = {},
         vtagIndex = {},
         deCamelRe = /([A-Z])/g,
         userAgent = navigator.userAgent.toLowerCase(),
         logAvailable = window.console && window.console.log;

    function deCamel(c) { return '-' + c.toLowerCase(); }

    function addToVtagIndex(view)
    {
        if ((typeof view.vtag === 'string') && view.vtag.length > 0)
        {
            vtagIndex[view.vtag] = vtagIndex[view.vtag] || [];
            view._vtagIdx = vtagIndex[view.vtag].length;
            vtagIndex[view.vtag][view._vtagIdx] = view;
        }
    }

    function removeFromVtagIndex(view)
    {
        if ((typeof view._vtagIdx === 'number') && vtagIndex[view.vtag])
        {
            for (var i = view._vtagIdx + 1, l = vtagIndex[view.vtag].length; i < l; i++)
            {
                vtagIndex[view.vtag][i]._vtagIdx -= 1;
            }
            vtagIndex[view.vtag].splice(view._vtagIdx, 1);
        }
    }

    // TODO: Move this into BrowserOverride
    function initIE()
    {
        var doc = document,
            ss;

        // Hide the vertical scrollbar in IE
        Ext.select('html').setStyle('overflow', 'hidden');
    }

    var pub = {

        version: '@VERSION@',

        debugMode: false,

        style: {}, // Namespace for styles

        isIPhone: /iphone/.test(userAgent),

        id: function()
        {
            return 'view-' + idCount++;
        },

        init: function(/* [appConfig,] initFunction */)
        {
            if (typeof arguments[0] === 'function')
            {
                initializers.push({
                    initFunction: arguments[0]
                });
            }
            else
            {
                initializers.push({
                    appConfig: arguments[0],
                    initFunction: arguments[1]
                });
            }
        },

        addToCache: function(view)
        {
            cache[view.id] = view;
            addToVtagIndex(view);
        },

        removeFromCache: function(view)
        {
            removeFromVtagIndex(view);
            delete cache[view.id];
        },

        get: function(id)
        {
            return cache[id];
        },

        findByVtag: function(vtag)
        {
            return vtagIndex[vtag];
        },

        accumulate: function(cls, prop)
        {
            var o = {};

            if (cls.superclass)
            {
                o = WV.accumulate(cls.superclass.constructor, prop);
            }

            Ext.apply(o, cls.prototype[prop]);

            return o;
        },

        createTemplate : function(spec)
        {
            var s = Ext.DomHelper.createHtml(spec);
            return new Ext.Template(s, { compiled: true });
        },

//        mixin: function(targetClass, mixin)
//        {
//            // Mixins can either be classes (constructor function) or objects
//            typeof mixin === 'function' ? Ext.apply(targetClass.prototype, mixin.prototype)
//                                        : Ext.apply(targetClass.prototype, mixin);
//            return targetClass;
//        },

        classForVType: function(vtype)
        {
            return vtypes[vtype];
        },

        create: function(vtype, config)
        {
            return new vtypes[vtype](config);
        },

        registerVType: function(vtype, cls)
        {
            vtypes[vtype] = cls;
            cls.vtype = vtype;
        },

        extend: function(baseCls, overrides)
        {
            var vtype = overrides.vtype,
                newCls;

            // Add the mixins for the new class if defined
            if (overrides.mixins)
            {
                for (var i = 0, l = overrides.mixins.length; i < l; i++)
                {
                    // Mixins can either be classes (constructor function) or objects
                    typeof overrides.mixins[i] === 'function' ? Ext.apply(overrides, overrides.mixins[i].prototype)
                                                              : Ext.apply(overrides, overrides.mixins[i]);
                }
            }

            // Set up the vtype for the class if provided
            newCls = Ext.extend(baseCls, overrides);
            if (vtype) { WV.registerVType(vtype, newCls); }

            return newCls;
        },

        deCamel: function(str)
        {
            return str.replace(deCamelRe, deCamel);
        },

        decToHexString: function()
        {
            var i, l, tmp, hex = '';
            for (i = 0, l = arguments.length; i < l; i++)
            {
                tmp = parseInt(arguments[i], 10).toString(16);
                if (tmp.length === 1) { tmp = '0' + tmp; }
                hex += tmp;
            }
            return hex;
        },

        rectStandardize: function(r)
        {
            var r1 = { w: Math.abs(r.w), h: Math.abs(r.h) };

            r1.x = r.w < 0 ? r.w + r.x : r.x;
            r1.y = r.h < 0 ? r.h + r.y : r.y;

            return r1;
        },

        rectUnion: function(/* variable list of rects */)
        {
            var minX = Number.POSITIVE_INFINITY, minY = Number.POSITIVE_INFINITY,
                maxX = Number.NEGATIVE_INFINITY, maxY = Number.NEGATIVE_INFINITY,
                r, i, l = arguments.length;

            for(i = 0; i < l; i++)
            {
                r = WV.rectStandardize(arguments[i]);

                minX = Math.min(minX, r.x);
                minY = Math.min(minY, r.y);
                maxX = Math.max(maxX, r.x + r.w);
                maxY = Math.max(maxY, r.y + r.h);
            }

            return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
        },

        rectContainsRect: function(outer, inner)
        {
            var r = WV.rectUnion(outer, inner);

            return r.x === outer.x && r.y === outer.y && r.w === outer.w && r.h === outer.h;
        },

        apply: Ext.apply,
        applyIf: Ext.applyIf,
        isArray: Ext.isArray,
        override: Ext.override,

        emptyFn: function() {},

        log: logAvailable ? function() {
                               var time = (new Date()).toLogString(),
                                   logStrings = [],
                                   i, l = arguments.length;
                               for (i = 0; i < l; i++)
                               {
                                   logStrings[logStrings.length] = arguments[i];
                               }

                               console.log(String.format('<{0}> {1}', time, logStrings.join('')));
                          }
                        : function() {},
        // TODO logf
        debug: function()
        {
            if (WV.debugMode === true)
            {
                WV.log.apply(WV, arguments);
            }
        },
        archive: function(root)
        {
            return JSON.stringify(root, replacer);
        }
    };

    Ext.onReady(function() {

        if (Ext.isIE) { initIE(); }

        var start = new Date(),
                        end;

        for (var i = 0, l = initializers.length; i < l; i++)
        {
            var win = new WV.Window(initializers[i].appConfig);

            initializers[i]['initFunction'].call(null, win);
            win.window = win; // This will allow subviews to be drawn
            win.redrawIfNeeded(true, true);
        }

        end = new Date();
        WV.debug('Initialization time: ', end.getTime() - start.getTime(), 'ms');
    });

    return pub;

})();