
Ext.USE_NATIVE_JSON = true;
Ext.enableGarbageCollector = false;

WV = (function() {

    var idCount = 0,
         zCount = 0,
         initializers = [],
         vtypes = {},
         cache = {},
         logEnabled = window.console !== undefined &&
                      typeof window.console.log === 'function';

    var pub = {

        version: '0.0.1',

        style: {},
        
        id: function()
        {
            return 'view-' + idCount++;
        },

        z: function()
        {
            return zCount++;
        },

        init: function(i)
        {
            if (typeof i === 'function')
            {
                initializers.push(i);
            }
        },

        styleLib: {
            backgroundSize: Ext.isGecko ? 'MozBackgroundSize' : 'WebkitBackgroundSize',
            borderRadius: Ext.isGecko ? 'MozBorderRadius' : 'WebkitBorderRadius',
            boxShadow: Ext.isGecko ? 'MozBoxShadow' : 'WebkitBoxShadow',
            boxSizing: Ext.isGecko ? 'MozBoxSizing' : Ext.isIE8 ? 'boxSizing' :'WebkitBoxSizing',
            transform: Ext.isGecko ? 'MozTransform' : 'WebkitTransform',
            transformOrigin: Ext.isGecko ? 'MozTransformOrigin' : 'WebkitTransformOrigin'
        },

        addToCache: function(view)
        {
            cache[view.id] = view;
        },

        removeFromCache: function(view)
        {
            delete cache[view.id];
        },

        get: function(id)
        {
            return cache[id];
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

        create: function(vtype, config)
        {
            return new vtypes[vtype](config);
        },

        registerVType: function(vtype, cls)
        {
            vtypes[vtype] = cls;
            cls.vtype = vtype;
        },

        // Shallow copy only
        clone: function(obj, overrides)
        {
            return Ext.apply({}, overrides, obj);    
        },

        extend: function(baseCls, overrides)
        {
            var vtype = overrides.vtype,
                newCls;

            // Add the mixins for the new class if defined
            if (overrides.mixins)
            {
                for (var i = 0; i < overrides.mixins.length; i++)
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

        apply: Ext.apply,
        applyIf: Ext.applyIf,

        emptyFn: function() {},

        log: logEnabled ? function() {
                               var newArgs = ['<',(new Date()).toLogString(), '> '],
                                   i, l = arguments.length;
                               for (i = 0; i < l; i++)
                               {
                                   newArgs[newArgs.length] = arguments[i];
                               }

                               console.log.apply(console, newArgs);
                          }
                        : function() {}
    };

    Ext.onReady(function() {

        // Hide the vertical scrollbar in IE
        if (Ext.isIE) { Ext.select('html').setStyle('overflow', 'hidden'); }

        WV.Window = new WV.View({
            superView: null,
            dom: document.body,
            clipSubViews: true,
            deferSubViewRender: true,
            firstResponder: undefined,
            x: 0,
            y: 0,
            w: Ext.lib.Dom.getViewportWidth(),
            h: Ext.lib.Dom.getViewportHeight(),
            style: {
                margin: '0px',
                border: '0 none'
            },
            layoutSubViews: function()
            {
                var start = new Date(),
                        end;

                this.constructor.prototype.layoutSubViews.call(this);
                end = new Date();
                WV.log('Layout time: ', end.getTime() - start.getTime(), 'ms');
            },
            makeFirstResponder: function(newResponder)
            {
                return newResponder ? newResponder.becomeFirstResponder() : false;
            }
        });

        Ext.EventManager.addListener(window, 'resize', function() {

            WV.Window.setSize(
                    Ext.lib.Dom.getViewportWidth(),
                    Ext.lib.Dom.getViewportHeight());
        }, WV.Window, { buffer: 10 });

        WV.EventMonitor.monitorEvent('mouseDown');
        WV.EventMonitor.monitorEvent('mouseUp');
        WV.EventMonitor.monitorEvent('mouseMove');
        WV.EventMonitor.monitorEvent('mouseOut');
        WV.EventMonitor.monitorEvent('mouseWheel');
        WV.EventMonitor.monitorEvent('contextMenu');
        WV.EventMonitor.monitorEvent('dragStart');
        WV.EventMonitor.monitorEvent('drag');
        WV.EventMonitor.monitorEvent('dragEnd');
        WV.EventMonitor.monitorEvent('keyDown');
        WV.EventMonitor.monitorEvent('keyUp');

        for (var i = 0, l = initializers.length; i < l; i++)
        {
            initializers[i].call(WV.Window);
        }

        var start = new Date(),
                        end;

        WV.Window.render();
        WV.Window.deferSubViewRender = false;

        end = new Date();
        WV.log('Render time: ', end.getTime() - start.getTime(), 'ms');
    });

    return pub;

})();