
WV.Window = WV.extend(WV.View, {
    vtype: 'window',
    superView: null,
    /**
     * WV.Window encapsulates a Canvas node in the dom. If a Canvas reference is supplied then use
     * it. Otherwise, create a new Canvas node and assume that it should consume the entire window.
     */
    constructor: function(config)
    {
        config = config || {};

        WV.apply(this, config);

        this.id = config.id || WV.id();
        this.subviews = [];
        this.style = {};
        this.drawQueue = [];
        WV.addToCache(this);

        if (typeof this.canvas === 'string')
        {
            this.id = this.canvas;
            this.canvas = document.getElementById(this.id);
            this.w = this.previousW = this.canvas.width;
            this.h = this.previousH = this.canvas.height;
        }
        if (!this.canvas)
        {
            var body = document.body || document.documentElement;

            Ext.select('html').setStyle('overflow', 'hidden');

            this.canvas = document.createElement('canvas');

            this.canvas.id = this.id;
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0px';
            this.canvas.style.left = '0px';

            body.appendChild(this.canvas);

            this.w = this.previousW = this.canvas.width = Ext.lib.Dom.getViewportWidth();
            this.h = this.previousH = this.canvas.height = Ext.lib.Dom.getViewportHeight();

            Ext.EventManager.addListener(window, 'resize', function() {
                this.setSize();
            }, this, { buffer: 1 });
        }

        // TODO: Create a way to set this in wib loading and declaratively
        this.firstResponder = this.initialFirstResponder = this;
        // TODO: This needs to go somehere else
        this.lastViewAdded = this;

        this.eventMonitor = new WV.EventMonitor(this);

        this.context2d = this.canvas.getContext('2d');
    },

    setViewsNeedDisplay: function(view)
    {
        var self = this,
            renderFunc = WV.requestAnimationFrame || setTimeout;

        // Prevent views from being re-added to the queue if they are already in line by using a flag.
        // This will prevent recursive death if a view gets setNeedsDisplay called while drawing
        if (!view || (view._inDrawQueue_)) { return; }

        view._inDrawQueue_ = true;
        this.drawQueue.push(view);

        WV.debug('*****');
        if (!this._displayRef)
        {
            this._displayRef = renderFunc(function() {
                while (self.drawQueue.length)
                {
                    self.drawQueue[0].redrawIfNeeded();
                    delete self.drawQueue[0]._inDrawQueue_;
                    self.drawQueue.shift();
                }
                WV.debug('Finish Drawing Window');

                self._displayRef = null;
            }, 0);
            WV.debug('Start Drawing Window');
        }
    },

    baseDraw: function(rect, ctx)
    {
        if (this.style.color)
        {
            ctx.fillStyle = this.style.color || 'rgba(0,0,0,0)';
            ctx.fillRect(0,0,this.w,this.h);
        }
        else
        {
            ctx.clearRect(0,0,this.w,this.h);
        }
    },

    setSize: function()
    {
      var w = Ext.lib.Dom.getViewportWidth(),
          h = Ext.lib.Dom.getViewportHeight();

      this.previousH = this.h;
      this.previousW = this.w;
      this.canvas.width = this.w = w;
      this.canvas.height = this.h = h;

      this.inLayout = true;
      this.layoutSubviews();
      this.inLayout = false;
      this.redrawIfNeeded();
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