
(function() {

    WV.Touch = WV.extend(Object, {
      /**
       * id: touch id,
       * view: associated view resolved by hit-test,
       * window: window from which the touch originated
       * windowX,
       * windowY,
       * previousWindowX,
       * previousWindowY,
       * timestamp
       *
       */
      constructor: function(config)
      {
        WV.apply(this, config);
      },
      locationInView: function(view)
      {
        if (view.window === this.window)
        {
          if (!view)
          {
            return { x: this.windowX, y: this.windowY };
          }
          else
          {
            var windowOrigin = view.convertPointToView(view.getOrigin(), null);
            return { x: this.windowX - windowOrigin.x, y: this.windowY - windowOrigin.y };
          }
        }
      },
      previousLocationInView: function(view)
      {
        if (view.window === this.window)
        {
          if (!view)
          {
            return { x: this.previousWindowX, y: this.previousWindowY };
          }
          else
          {
            var windowOrigin = view.convertPointToView(view.getOrigin(), null);
            return { x: this.previousWindowX - windowOrigin.x, y: this.previousWindowY - windowOrigin.y };
          }
        }
      },
      toString: function() {
        return ['windowX: ', this.windowX, ' windowY: ', this.windowY, ' (',  this.view ? this.view.id : 'null', ')'].join('');
      }
    });

    var ignoreEvents,
        monitors = {
            touchesBegan: {
                before: function(ev)
                {
                  return true;
                }
            },
            touchesMoved: {
                before: function(ev)
                {
                    ev.preventDefault();

                  return true;
                }
            },

            touchesEnded: {
                before: function(ev)
                {
                  return true;
                },
                after: function(ev)
                {
                  removeTouches(ev.changedTouches);
                }
            },
            touchesCancelled: {
                before: function(ev)
                {
                  return true;
                },
                after: function(ev)
                {
                  removeTouches(ev.changedTouches);
                }
            },
//            gestureBegan: {
//                before: function(ev)
//                {
//
//                }
//            },
//            gestureChanged: {
//                before: function(ev)
//                {
//                },
//                after: function(ev)
//                {
//                }
//            },
//            gestureEnded: {
//                before: WV.emptyFn,
//                after: WV.emptyFn
//            },
            keyDown: {
              before: function(ev)
              {
                // If the ctrl AND alt keys are down and this is a Tab or Tab-shift then change the key view.
                // This will allow tabbing out of views that would otherwise consume the Tab key (TextArea)
                if (ev.charCode === 9 && ev.ctrlKey && ev.altKey)
                {
                  if (ev.shiftKey)
                  {
                    WV.log('previous');
                  }
                  else
                  {
                    WV.log('next');
                  }
                  return false;
                }
                return true;
              },
              after: WV.emptyFn
            },
            keyUp: {
              before: WV.emptyFn,
              after: WV.emptyFn
            }
        },

        mapping = {
          'touchstart':    'touchesBegan',
          'touchmove':     'touchesMoved',
          'touchend':      'touchesEnded',
          'touchcancel':   'touchesCancelled',
//          'gesturestart':  'gestureBegan',
//          'gesturechange': 'gestureChanged',
//          'gestureend':    'gestureEnded',
          'keydown':       'keyDown',
          'keyup':         'keyUp'
        },
        touchMap = {};

    var sharedTouchEvent = {
      allTouches: [],
      timestamp: null,
      scale: null,
      rotation: null,
      touchesForView: function(view)
      {
        var touches = [];
        if (view)
        {
          this.allTouches.forEach(function(t) {
            if (t.view === view)
            {
              touches[touches.length] = t;
            }
          });
        }
        return touches;
      },
      touchesForWindow: function(win)
      {
        return this.allTouches;
      }
    };


    function removeTouches(touchList)
    {
      var i, l;

      for (i = 0, l = touchList.length; i < l; i ++)
      {
        delete touchMap[touchList.item(i).identifier];
      }
    }
    // Returns a map of target view id's -> array of changed touches
    function processTouchEvent(ev, win)
    {
      var domEl, i, l,
          rect, canvasRect,
          point = {},
          touchIsNew,
          touch, nativeTouch,
          targetTouchesMap = {};

      sharedTouchEvent.allTouches = [];

      for (i = 0, l = ev.touches.length; i < l; i++)
      {
        touchIsNew = false;
        nativeTouch = ev.touches.item(i);
        domEl = nativeTouch.target; // the dom target for this touch event

        if (!touchMap[nativeTouch.identifier])
        {
          touchMap[nativeTouch.identifier] = new WV.Touch({
                                                            id: nativeTouch.identifier,
                                                            window: win });
          touchIsNew = true;
        }

        touch = touchMap[nativeTouch.identifier];

        sharedTouchEvent.allTouches[sharedTouchEvent.allTouches.length] = touch;

        if (!touchIsNew)
        {
          touch.previousWindowX = touch.windowX;
          touch.previousWindowY = touch.windowY;
        }

        if (domEl !== win.canvas) // Check to see if the native target element is one of our text overlays
        {
          if (domEl.getAttribute('_textOverlay'))
          {
            rect = domEl.getBoundingClientRect();
            canvasRect = win.canvas.getBoundingClientRect();
            touch.windowX = rect.left + nativeTouch.pageX - canvasRect.left;
            touch.windowY = rect.top + nativeTouch.pageY - canvasRect.top;
          }
          else {
            // Ignore this event, it is not targeted to a piece of dom we "own"
            sharedTouchEvent.allTouches.pop();
            delete touchMap[nativeTouch.identifier];
            break;
          }
        }
        else
        {
          // No adjustment needed, the target is our canvas
          if (window.WebKitPoint)
          {
            var p = window.webkitConvertPointFromPageToNode(win.canvas, new window.WebKitPoint(nativeTouch.pageX, nativeTouch.pageY));

            touch.windowX = p.x;
            touch.windowY = p.y;
          }
          else
          {
            //  TODO: Handle non-webkit browsers
          }
        }

        // We need to scale the point if the canvas is scaled for proper hit testing
        if (!win.isFullScreen) {
          scaleTouchCoordinates(touch, win);
        }

        if (touchIsNew)
        {
          touch.previousWindowX = touch.windowX;
          touch.previousWindowY = touch.windowY;
        }

        if (!touch.view) {
          point.x = touch.windowX;
          point.y =  touch.windowY;

          touch.view = win.hitTest(point);
        }
      }

      sharedTouchEvent.rotation = ev.rotation;
      sharedTouchEvent.scale = ev.scale;
      sharedTouchEvent.timestamp = Date.now();

      // Build the target -> touches map containing the changed touches for each target
      for (i = 0, l = ev.changedTouches.length; i < l; i++)
      {
        touch = touchMap[ev.changedTouches.item(i).identifier];

        // This may be a touch we decided to ignore in the loop above
        if (touch) {
          touch.timestamp = sharedTouchEvent.timestamp;

          if (!targetTouchesMap[touch.view.id])
          {
            targetTouchesMap[touch.view.id] = [];
          }
          targetTouchesMap[touch.view.id].push(touch);
        }
      }

      return targetTouchesMap;
    }

    function processKeyEvent(ev)
    {

    }

    function scaleTouchCoordinates(touch, win) {
          var canvas = win.canvas,
              st = getComputedStyle(canvas),
              scaledW = parseFloat(st.width),
              scaledH = parseFloat(st.height);

      touch.windowX = Math.round(touch.windowX / (scaledW / canvas.width));
      touch.windowY = Math.round(touch.windowY / (scaledH / canvas.height));
    }

    WV.TouchEventMonitor = WV.extend(Object, {
        constructor: function(ownerWindow)
        {
            this.window = ownerWindow;

            this.monitorEvent('touchstart');
            this.monitorEvent('touchmove');
            this.monitorEvent('touchend');
            this.monitorEvent('touchcancel');
//            this.monitorEvent('keyup');
//            this.monitorEvent('keydown');
//            this.monitorEvent('gesturestart');
//            this.monitorEvent('gesturechange');
//            this.monitorEvent('gestureend');
        },

        monitorEvent: function(name, preserveCase)
        {
            var win = this.window, // Our WV.Window
                ename = mapping[name];  // ename represents the name of the function we will invoke on firstResponder

            document.body.addEventListener(name, function(e) {

              var targets,  proceed,
                  isKeyEvent = ename.indexOf('key') === 0;

              proceed = monitors[ename].before ? monitors[ename].before(e) : true;

              if (!ignoreEvents && proceed)
              {
                if (isKeyEvent)
                {
                  if (win.firstResponder && win.firstResponder[ename])
                  {
                    win.firstResponder[ename](e);
                  }
                }
                else // touch event
                {
                  // Contains a map of view ids to changed touches
                  targets = processTouchEvent(e, win);

                  Object.keys(targets).forEach(function(viewId) {
                    var t = WV.get(viewId);
                    if (t[ename])
                    {
                      t[ename](targets[viewId], sharedTouchEvent);
                    }
                  });
                }
              }

              if (monitors[ename].after)
              {
                monitors[ename].after(e);
              }

            }, false);
        },
        startIgnoringEvents: function()
        {
            ignoreEvents = true;
        },
        stopIgnoringEvents: function()
        {
            ignoreEvents = false;
        }
    });

})();