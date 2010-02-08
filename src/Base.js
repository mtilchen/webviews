
Ext.USE_NATIVE_JSON = true;

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

        get: function(id)
        {
            return cache[id];
        },

        destroy: function(view)
        {
            view.dom = undefined;
            Ext.removeNode(view.dom);
            view.destroyed = true;
            delete cache[view.id];
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

        mixin: function(targetClass, mixin)
        {
            Ext.apply(targetClass.prototype, mixin);
            return targetClass;
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

            delete overrides.vtype;

            newCls = Ext.extend(baseCls, overrides);
            if (vtype) { WV.registerVType(vtype, newCls); }

            return newCls;
        },

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

        WV.PageView = new WV.View({
            superView: null,
            dom: document.body,
            clipSubViews: true,
            deferSubViewRender: true,
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
            }
        });

        Ext.EventManager.addListener(window, 'resize', function() {

            WV.PageView.setSize(
                    Ext.lib.Dom.getViewportWidth(),
                    Ext.lib.Dom.getViewportHeight());
        }, WV.PageView, { buffer: 10 });

        WV.EventMonitor.monitorEvent('mouseDown');
        WV.EventMonitor.monitorEvent('mouseUp');
        WV.EventMonitor.monitorEvent('mouseMove');
//        WV.EventMonitor.monitorEvent('mouseOver');
        WV.EventMonitor.monitorEvent('mouseOut');
        WV.EventMonitor.monitorEvent('mouseWheel');
        WV.EventMonitor.monitorEvent('contextMenu');
        WV.EventMonitor.monitorEvent('dragStart');
        WV.EventMonitor.monitorEvent('drag');
        WV.EventMonitor.monitorEvent('dragEnd');

        for (var i = 0, l = initializers.length; i < l; i++)
        {
            initializers[i].call(WV.PageView);
        }

        var start = new Date(),
                        end;

        WV.PageView.render();
        WV.PageView.deferSubViewRender = false;

        end = new Date();
        WV.log('Render time: ', end.getTime() - start.getTime(), 'ms');
    });

    return pub;

})();