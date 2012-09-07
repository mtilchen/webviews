
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
        if (!this.canvas) // Full-screen app
        {
            this.isFullScreen = true;

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

            if (!WV.isiOS)
            {
              Ext.EventManager.addListener(window, 'resize', function() {
                this.setSize();
              }, this, { buffer: 1 });
            }
        }

        // TODO: Create a way to set this in wib loading and declaratively
        this.firstResponder = this.initialFirstResponder = this;
        // TODO: This needs to go somehere else
        this.lastViewAdded = this;

        this.eventMonitor = new WV.EventMonitor(this);

        if (window.TouchEvent)
        {
          this.touchEventMonitor = new WV.TouchEventMonitor(this);
        }

        this.context2d = this.canvas.getContext('2d');

        this.window = this; // For consistency
    },

    setViewsNeedDisplay: function(view)
    {
        var queue = this.drawQueue;

        // Prevent views from being re-added to the queue if they are already in line by using a flag.
        // This will prevent recursive death if a view gets setNeedsDisplay called while drawing
        // Also, if a view is already in the queue and not at the end, move it to the end of the queue.
        if (!view || queue[queue.length] === view) { return; }

        if (view._inDrawQueue_) {
          queue.splice(queue.indexOf(view), 1);
        }

        view._inDrawQueue_ = true;
        queue[queue.length] = view;

        if (queue.length === 1) // We were empty, just added a view
        {
          window.requestAnimationFrame(function() {
            while (queue.length)
            {
              queue[0].redrawIfNeeded();
              delete queue[0]._inDrawQueue_;
              queue.shift();
            }
            //WV.debug('**** Finish Drawing Window ****');
          }, this.canvas);
          //WV.debug('**** Start Drawing Window ****');
        }
    },

    baseDraw: function(rect, ctx)
    {
        if (this.style.color)
        {
            if (!this.isOpaque())
            {
              ctx.clearRect(0, 0, this.w, this.h);
            }
            ctx.fillStyle = this.style.color;
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
        if (e.keyCode === 9) // Tab
        {
            e.preventDefault();  // Prevent browser default tab behavior
            e.shiftKey ? this.selectPreviousKeyView(this) : this.selectNextKeyView(this);
        }
        else
        {
            WV.View.prototype.keyDown.call(this, e);
        }
    }
});