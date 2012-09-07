WV.ScrollView = WV.extend(WV.View, {
    vtype: 'scrollview',
    showsVerticalIndicator: true,
    showsHorizontalIndicator: true,
    dragScrolling: false,
    clipToBounds: true,
    subviews: [{
      vtag: 'content',
      style: {
        color: 'transparent'
      },
      autoResizeMask: WV.RESIZE_NONE
    },{
        vtag: 'vHoverInd',
        x: 'w - this.w - 2',
        y: 2,
        w: 8,
        h: 'h - 4',
        style: {
          color: 'rgba(0,0,0,0.15)',
          cornerRadius: 4,
          borderColor: 'rgba(0,0,0,0.25)',
          borderWidth: 1,
          opacity: 0
        },
        autoResizeMask: WV.RESIZE_LEFT_FLEX | WV.RESIZE_HEIGHT_FLEX
    },{
      vtag: 'vInd',
      x: 'w - this.w - 2',
      y: 2,
      w: 8,
      h: 'h / 2',
      style: {
        color: 'rgba(0,0,0,0.5)',
        cornerRadius: 4
      },
      autoResizeMask: WV.RESIZE_LEFT_FLEX
    },{
        vtag: 'hHoverInd',
        x: 2,
        y: 'h - this.h - 2',
        w: 'w - 4',
        h: 8,
        style: {
          color: 'rgba(0,0,0,0.15)',
          cornerRadius: 4,
          borderColor: 'rgba(0,0,0,0.25)',
          borderWidth: 1,
          opacity: 0
        },
        autoResizeMask: WV.RESIZE_TOP_FLEX | WV.RESIZE_WIDTH_FLEX
    },{
      vtag: 'hInd',
      x: 2,
      y: 'h - this.h - 2',
      w: 'w / 2',
      h: 8,
      style: {
        color: 'rgba(0,0,0,0.5)',
        cornerRadius: 4
      },
      autoResizeMask: WV.RESIZE_TOP_FLEX
    }],

    constructor: function(config)
    {
      config = config || {};

      // Abstract the "content view" from configuration
      var subviews = config.subviews;

      delete config.subviews;
      WV.ScrollView.superclass.constructor.call(this, config);

      this._initialized = true;
      this.contentSize = this.contentSize || { w: '100%', h: '100%' };
      this.setContentSize(this.contentSize);
      delete this.contentSize;

      // Add the configured subviews to the content view
      if (subviews)
      {
        if (Array.isArray(subviews))
        {
          subviews.forEach(function(sub) {
            this.addSubview(sub);
          }, this);
        }
        else
        {
          this.addSubview(subviews);
        }
      }
      return this;
    },

    setShowsVerticalIndicator: function(show)
    {
      this.showsVerticalIndicator = !!show;
      return this.updateIndicators();
    },

    setShowsHorizontalIndicator: function(show)
    {
      this.showsHorizontalIndicator = !!show;
      return this.updateIndicators();
    },

    setContentSize: function(/* { w: val, h: val} or w, h */)
    {
      var content = this.subviews.content;

      if (typeof arguments[0] === 'object')
      {
        this.contentWidth = arguments[0].w;
        this.contentHeight = arguments[0].h;
      }
      else
      {
        this.contentWidth = arguments[0];
        this.contentHeight = arguments[1];
      }

      if (content)
      {
        content.setSize(this.contentWidth, this.contentHeight);
      }
      this.updateIndicators();
    },
    updateIndicators: function()
    {
      var ratioW = this.w / this.contentWidth,
          ratioH = this.h / this.contentHeight,
          hShowing = ratioW < 1 && this.showsHorizontalIndicator,
          vShowing = ratioH < 1 && this.showsVerticalIndicator,
          maxWidth =  vShowing ? this.w - 12 : this.w - 4,
          maxHeight = hShowing ? this.h - 12 : this.h - 4;

      if (!hShowing)
      {
        this.subviews.hInd.setHidden(true);
        this.subviews.hHoverInd.setHidden(true);
      }
      else
      {
        this.subviews.hInd.setHidden(false);
        this.subviews.hHoverInd.setHidden(false);
        this.subviews.hHoverInd.setWidth(maxWidth);
        this.subviews.hInd.setWidth(Math.max(50, ratioW * maxWidth));
        this.subviews.hInd.setX((this.subviews.content.x / (this.w - this.contentWidth)) * (maxWidth - this.subviews.hInd.w) + 2);
      }
      if (!vShowing)
      {
        this.subviews.vInd.setHidden(true);
        this.subviews.vHoverInd.setHidden(true);
      }
      else
      {
        this.subviews.vInd.setHidden(false);
        this.subviews.vHoverInd.setHidden(false);
        this.subviews.vHoverInd.setHeight(maxHeight);
        this.subviews.vInd.setHeight(Math.max(50, ratioH  * maxHeight));
        this.subviews.vInd.setY((this.subviews.content.y / (this.h - this.contentHeight)) * (maxHeight - this.subviews.vInd.h) + 2);
      }
      return this;
    },
    insertSubview: function(view, idx)
    {
      // Overridden to add subviews to the content view
      if (this._initialized)
      {
        return this.subviews.content.insertSubview(view, idx);
      }
      else
      {
        WV.ScrollView.superclass.insertSubview.call(this, view, idx);
      }
    },
    setFrame: function(frame)
    {
      var content = this.subviews.content,
          xAdj = 0, yAdj = 0,
          needsUpdate = ((typeof frame.h === 'number') && (frame.h !== this.h)) || ((typeof frame.w === 'number') && (frame.w !== this.w));

      WV.ScrollView.superclass.setFrame.call(this, frame);

      if (needsUpdate)
      {
        if (this.w >= (content.w + content.x))
        {
          xAdj = Math.min(this.w - content.w, 0);
        }
        if (this.h >= (content.h + content.y))
        {
          yAdj = Math.min(this.h - content.h, 0);
        }
        if (xAdj || yAdj)
        {
          content.setOrigin(xAdj || content.x , yAdj || content.y);
        }
        this.updateIndicators();
      }

      return this;
    },
    layoutSubviews: function()
    {
      WV.ScrollView.superclass.layoutSubviews.call(this);
      return this.updateIndicators();
    },
    fadeHoverInd: function(ind)
    {
      ind.removeAllAnimations();
      ind.addAnimation({
        path: 'style.opacity',
        from: ind.style.opacity,
        to: 0,
        duration: 0.2
      });
    },
    mouseEntered: function(e)
    {
      var ind;

      if (e.target === this.subviews.hHoverInd || e.target === this.subviews.hInd)
      {
        ind = this.subviews.hHoverInd;
      }
      else if (e.target === this.subviews.vHoverInd || e.target === this.subviews.vInd)
      {
        ind = this.subviews.vHoverInd;
      }

      if (ind)
      {
        ind.removeAllAnimations();
        ind.addAnimation({
          path: 'style.opacity',
          from: ind.style.opacity,
          to: 1,
          duration: 0.2
        });
      }

      WV.ScrollView.superclass.mouseEntered.call(this, e);
    },
    mouseExited: function(e)
    {
      var ind;

      if (e.target === this.subviews.hHoverInd || ((e.target === this.subviews.hInd) && !WV.isPointInRect(e.windowPoint, this.subviews.hHoverInd.convertRectToView())))
      {
        ind = this.subviews.hHoverInd;
      }
      else if (e.target === this.subviews.vHoverInd || ((e.target === this.subviews.vInd) && !WV.isPointInRect(e.windowPoint, this.subviews.vHoverInd.convertRectToView())))
      {
        ind = this.subviews.vHoverInd;
      }

      if (ind && !this._previousX && !this._previousY)
      {
        this.fadeHoverInd(ind);
      }
      WV.ScrollView.superclass.mouseExited.call(this, e);
    },
    mouseWheel: function(e)
    {
      this.scroll(e.wheelDeltaX, e.wheelDeltaY);

//      WV.ScrollView.superclass.mouseWheel.call(this, e);
    },
    mouseDragged: function(e)
    {
      var dX, dY,
          hIndScroll = this._draggingHInd || e.target === this.subviews.hInd,
          vIndScroll = this._draggingVInd || e.target === this.subviews.vInd;

      if (this.dragScrolling || hIndScroll || vIndScroll)
      {
        this._previousX = this._previousX === undefined ? e.windowPoint.x - e.deltaX : this._previousX;
        this._previousY = this._previousY === undefined ? e.windowPoint.y - e.deltaY : this._previousY;

        if (this.dragScrolling && !(hIndScroll || vIndScroll)) {
          this.scroll(e.windowPoint.x - this._previousX,
                      e.windowPoint.y - this._previousY);
        }
        else if (hIndScroll) {
          dX = ((this._previousX - e.windowPoint.x) / this.w) * this.contentWidth;
          this.scroll(dX, 0);

        }
        else if (vIndScroll) {
          dY = ((this._previousY - e.windowPoint.y) / this.h) * this.contentHeight;
          this.scroll(0, dY);
        }
        this._previousX = e.windowPoint.x;
        this._previousY = e.windowPoint.y;
      }

      if (!this.dragScrolling && !(hIndScroll || vIndScroll)) {
        WV.ScrollView.superclass.mouseDragged.call(this, e);
      }
    },
    mouseDown: function(e)
    {
      var point, dX, dY;

      if (this.dragScrolling)
      {
        this._startTimestamp = WV.now();
        this._startX = e.windowPoint.x;
        this._startY = e.windowPoint.y;
      }

      if (e.target === this.subviews.hInd)
      {
        this._draggingHInd = true;
      }
      else if (e.target === this.subviews.vInd)
      {
        this._draggingVInd = true;
      }

      else if (e.target === this.subviews.hHoverInd)
      {
        this._draggingHInd = true;
        point = this.subviews.hHoverInd.convertPointFromView(e.windowPoint);
        dX = (((this.subviews.hInd.x + this.subviews.hInd.w / 2) - point.x) /
                                       this.subviews.hHoverInd.w) * this.contentHeight;
        this.scroll(dX, 0);
      }

      else if (e.target === this.subviews.vHoverInd)
      {
        this._draggingVInd = true;
        point = this.subviews.vHoverInd.convertPointFromView(e.windowPoint);
        dY = (((this.subviews.vInd.y + this.subviews.vInd.h / 2) - point.y) /
                                       this.subviews.vHoverInd.h) * this.contentHeight;
        this.scroll(0, dY);
      }

      WV.ScrollView.superclass.mouseDown.call(this, e);
    },
    mouseUp: function(e)
    {
      var downOwner  = e.mouseDownOwner,
          doInertia = this.dragScrolling && downOwner &&
                      downOwner.vtag !== 'vInd' && downOwner.vtag !== 'hInd';

      delete this._previousX;
      delete this._previousY;
      delete this._draggingHInd;
      delete this._draggingVInd;

      if (doInertia)
      {
        this.inertiaScroll(e.windowPoint.x, e.windowPoint.y);
      }
      else
      {
        if (!WV.isPointInRect(e.windowPoint, this.subviews.hHoverInd.convertRectToView())) {
          this.fadeHoverInd(this.subviews.hHoverInd);
        }
        if (!WV.isPointInRect(e.windowPoint, this.subviews.vHoverInd.convertRectToView())) {
          this.fadeHoverInd(this.subviews.vHoverInd);
        }
        WV.ScrollView.superclass.mouseUp.call(this, e);
      }
    },
    touchesBegan: function(touches, e) {
      this._startX = this._startX || touches[0].windowX;
      this._startY = this._startY || touches[0].windowY;
      this._startTimestamp = this._startTimestamp || WV.now();
    },
    touchesEnded:function (touches, e) {
      this.inertiaScroll(touches[0].windowX, touches[0].windowY);
    },
    touchesMoved:function (touches, e) {
      this.scroll(touches[0].windowX - touches[0].previousWindowX,
                  touches[0].windowY - touches[0].previousWindowY);
    },
    scroll: function(dX, dY)
    {
      var content = this.subviews.content,
          newX = content.x + (dX || 0),
          newY = content.y + (dY || 0);

      return this.setContentOrigin(newX, newY);
    },
    setContentOrigin: function(x, y)
    {
      var content = this.subviews.content;

      if (x > 0 || (content.w < this.w))
      {
        x = 0;
      }
      else if ((x + content.w) < this.w)
      {
        x = this.w - content.w;
      }
      if (y > 0 || (content.h < this.h))
      {
        y = 0;
      }
      else if ((y + content.h) < this.h)
      {
        y = this.h - content.h;
      }

      content.setOrigin(x, y);
      return this.updateIndicators();
    },
    inertiaScroll: function(finalX, finalY) {

      var dt = (WV.now() - this._startTimestamp),
          initialX = (finalX - this._startX) / dt,
          initialY = (finalY - this._startY) / dt,
          scaleFactor = 400,
          timeConstant = 10,
          stepX = 0, stepY = 0,
          deltaX, deltaY,
          amplitudeX = initialX * scaleFactor,
          amplitudeY = initialY * scaleFactor,
          me = this;

      delete this._startX;
      delete this._startY;
      delete this._startTimestamp;

//      requestAnimationFrame(function intertiaLoop() {
//            var elapsed = WV.now() - timestamp,
//                newX = finalX - amplitude * Math.exp(-elapsed / 325);
//
//                me.setContentOrigin(newX, content.y);
//
//              if ((elapsed < 6 * 325) && !me._startX) {
//                requestAnimationFrame(intertiaLoop);
//              }
//          });

      requestAnimationFrame(function intertiaLoop() {
        deltaX = amplitudeX / timeConstant;
        deltaY = amplitudeY / timeConstant;

        me.scroll(deltaX, deltaY);
        amplitudeX -= deltaX;
        amplitudeY -= deltaY;
        stepX += 1;
        stepY += 1;

        if (((stepX < 6 * 10) || (stepY < 6 * 10)) && !me._startTimestamp) {
          requestAnimationFrame(intertiaLoop);
        }
      });
    }

});