
Ext.USE_NATIVE_JSON = true;
Ext.enableGarbageCollector = false;

WV = (function() {

    var idCount = 0,
         zCount = 0,
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

        // Set up VML support
        if (!doc.namespaces['vml'])
        {
            doc.namespaces.add('vml', 'urn:schemas-microsoft-com:vml',
                               '#default#VML');

        }

        if (document.styleSheets['wv_vml'])
        {
            ss = doc.createStyleSheet();
            ss.owningElement.id = 'wv_vml';
            ss.cssText = 'vml\\:*{behavior:url(#default#VML)}';
            ss.cssText += 'vml\\:roundrect {behavior:url(#default#VML)}';
        }
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
            borderRadius: Ext.isGecko ? 'MozBorderRadius' : Ext.isIE ? 'borderRadius' :'WebkitBorderRadius',
            boxShadow: Ext.isGecko ? 'MozBoxShadow' : 'WebkitBoxShadow',
            boxSizing: Ext.isGecko ? 'MozBoxSizing' : Ext.isIE ? 'boxSizing' :'WebkitBoxSizing',
            transform: Ext.isGecko ? 'MozTransform' : 'WebkitTransform',
            transformOrigin: Ext.isGecko ? 'MozTransformOrigin' : 'WebkitTransformOrigin'
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

        // TODO: Make WV.Window a subclass of WV.View and give each its own EventMonitor
        WV.Window = new WV.View({
            superView: null,
            dom: document.body,
            clipSubViews: true,
            deferSubViewRender: true,
            firstResponder: null,
            initialFirstResponder: null,
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
                WV.debug('Layout time: ', end.getTime() - start.getTime(), 'ms');
            },
            makeFirstResponder: function(newResponder)
            {
                if (this.firstResponder === newResponder) { return true; }

                return newResponder ? newResponder.becomeFirstResponder() : false;
            },
            selectKeyViewFollowingView: function(view)
            {
                var v = view.getNextValidKeyView();
                this.makeFirstResponder(v || this.initialFirstResponder);
            },
            selectKeyViewPrecedingView: function(view)
            {
                var v = view.getPreviousValidKeyView();
                this.makeFirstResponder(v || this.initialFirstResponder);
            },
            selectPreviousKeyView: function(sender)
            {
                var v = this.firstResponder.getPreviousValidKeyView();
                this.makeFirstResponder(v || this.initialFirstResponder);
            },
            selectNextKeyView: function(sender)
            {
                var v = this.firstResponder.getNextValidKeyView();
                this.makeFirstResponder(v || this.initialFirstResponder);
            },
            keyDown: function(e)
            {
                if (e.charCode === 9) // Tab
                {
                    e.cancel();  // Prevent browser default tab behavior
                    e.shiftKey ? this.selectPreviousKeyView(this) : this.selectNextKeyView(this);
                }
                else
                {
                    WV.View.prototype.keyDown.call(this, e);
                }
            }
        });

        // TODO: Create a way to set this in wib loading and declaratively
        WV.Window.initialFirstResponder = WV.Window;
        WV.Window.firstResponder = WV.Window.initialFirstResponder;
        // TODO: This needs to go somehere else
        WV.Window.lastViewAdded = WV.Window;

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
        WV.EventMonitor.monitorEvent('click');
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
        WV.debug('Render time: ', end.getTime() - start.getTime(), 'ms');
    });

    return pub;

})();