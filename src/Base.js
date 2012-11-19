
//TODO: Add a global error handler that will print out error messages to the window in "dev mode"

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

    var pub = {

        version: '@VERSION@',

        debugMode: false,

        style: {}, // Namespace for styles

        isiOS: /iphone|ipad/.test(userAgent),
        isMobile: /iphone|ipad|android|iemobile/.test(userAgent),

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
          var views = vtagIndex[vtag];
          if (views) {
            // If there is only one view with the vtag then return it alone, otherwise return the whole array
            return views.length === 1 ? views[0] : views;
          }
          return null;
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
            vtype = vtype || 'view';
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

        isPointInRect: function(point, rect)
        {
            return point.x >= rect.x && point.x < (rect.x + rect.w) &&
                   point.y >= rect.y && point.y < (rect.y + rect.h);
        },

        rectIntersection: function(r1, r2)
        {
           var intersection = { x: Math.max(r1.x, r2.x), y: Math.max(r1.y, r2.y) };

           intersection.w = Math.min(r1.x + r1.w, r2.x + r2.w) - intersection.x;
           intersection.h = Math.min(r1.y + r1.h, r2.y + r2.h) - intersection.y;

           return intersection;
        },

        rectIntersectsRect: function(r1, r2)
        {
          var intersection = WV.rectIntersection(r1, r2);

          return (intersection.w > 0) && (intersection.h > 0);
        },

        randomInt: function(min, max) {
          return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        apply: Ext.apply,
        applyIf: Ext.applyIf,
        isArray: Ext.isArray,
        override: Ext.override,

        namespace: Ext.namespace,

        emptyFn: function() {},

        now: (window.performance && (window.performance.now || window.performance.webkitNow))
                   ? (function() { return window.performance.now ? window.performance.now() : window.performance.webkitNow(); })
                   : Date.now,

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
            return JSON.stringify(root);
        },

        // Asynchronously load the view and pass it to the controller constructor.
        load: function(controllerCfg, viewURL, cb) {
          if (typeof cb !== 'function') { cb = function(){}; }

          if (typeof controllerCfg === 'string') {
            controllerCfg = { vtype: controllerCfg };
          }
          else {
            controllerCfg = controllerCfg || {};
          }

          Ext.Ajax.request({
            method: 'GET',
            url: viewURL,
            disableCaching: true,
            callback: function(opts, success, response) {
              var controller,
                  controllerCls = vtypes[controllerCfg.vtype || 'controller'];

              if (!success) {
                cb(null, 'View could not be loaded due to Ajax error');
              }
              else {
                try {
                  cb(new controllerCls(controllerCfg, response.responseText));
                }
                catch (e) {
                  cb(null, e);
                }
              }
            }
          });
        }
    };

    Ext.onReady(function() {

        var start = new Date(),
                        end;

        for (var i = 0, l = initializers.length; i < l; i++)
        {
            var win = new WV.Window(initializers[i].appConfig);

            initializers[i]['initFunction'].call(null, win);
        }

        end = new Date();
        WV.debug('Initialization time: ', end.getTime() - start.getTime(), 'ms');
    });

    return pub;

})();