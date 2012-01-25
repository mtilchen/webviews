
(function() {

    var pointerOffset = Ext.isMac ? 1 : 0,
        mouseDownOwners = {},
        mouseOverOwners = {},
        downX = 0,
        downY = 0,
        wheelDeltaX = 0,
        wheelDeltaY = 0,
        wheelDelta = 0,
        clickCount = 0,
        wasDragged,
        wasCancelled = false,
        ignoreEvents = false,
        ev, // Current Ext event
        be, // Current browserEvent
        targetV, // Current target View
        sharedMouseEvent = { cancel: cancel },
        sharedKeyEvent = { cancel: cancel },
        posProp = Ext.isGecko ? 'layer' : 'offset',
        posPropX = posProp + 'X',
        posPropY = posProp + 'Y',
        touchId,
        monitors = {
            mouseDown: {
                before: function()
                {
                    clickCount++;
                    clickReset.delay(500);
                    downX = ev.clientX;
                    downY = ev.clientY;
                    mouseDownOwners[touchId] = targetV;
                }
            },
            mouseMove: {
                before: function(win)
                {
                    var prevOver = mouseOverOwners[touchId];
                    mouseOverOwners[touchId] = targetV;

                    // Respect the cursor style of the view we are over
                    win.canvas.style.cursor = targetV.style.cursor || 'auto';

                    // Mouse entered/exited
                    if (prevOver !== mouseOverOwners[touchId])
                    {
                        if (prevOver && !WV.rectContainsRect(prevOver.convertRectToView(), targetV.convertRectToView()))
                        {
                            targetV = prevOver;
                            createMouseEvent();
                            prevOver.mouseExited(sharedMouseEvent);
                            targetV = mouseOverOwners[touchId];
                        }

                        if (prevOver && !WV.rectContainsRect(targetV.convertRectToView(), prevOver.convertRectToView()))
                        {
                            createMouseEvent();
                            mouseOverOwners[touchId].mouseEntered(sharedMouseEvent);
                        }
                    }

                    if (mouseDownOwners[touchId] /*=== targetV */)
                    {
                        // 'draggable' here refers to native drag and drop functionality
                        if (targetV.draggable === false)
                        {
                            wasDragged = true;
                            createMouseEvent();
                            mouseDownOwners[touchId].mouseDragged(sharedMouseEvent);
                        }
                        //return false;
                    }
                }
            },

            mouseUp: {
                before: function()
                {
                    // Always call mouseUp on the mouseDownOwner after a drag
                    if (wasDragged && mouseDownOwners[touchId])
                    {
                        createMouseEvent();
                        mouseDownOwners[touchId].mouseUp(sharedMouseEvent);
                        return false;
                    }
                },
                after: function()
                {
                    mouseDownOwners[touchId] = null;
                    wasDragged = false;
                    downX = 0; downY = 0;
                }
            },
            mouseOut: {
                before: function()
                {
                    // Make sure we do not get stuck in a drag if the mouse leaves the page while down
//                    if (ev.xy[0] < 0 || ev.xy[1] < 0 ||
//                        ev.xy[0] >= Ext.lib.Dom.getViewportWidth() || ev.xy[1] >= Ext.lib.Dom.getViewportHeight())
//                    {
//                        //mouseDownOwners[touchId] = null;
////                        wasDragged = false;
//
//                        if (mouseOverOwners[touchId])
//                        {
//                            createMouseEvent();
//                            mouseOverOwners[touchId].mouseExited(sharedMouseEvent);
//                            mouseOverOwners[touchId] = null;
//                        }
//                    }
                    return false;
                }
            },
            mouseOver: {
                before: function()
                {

                }
            },
            mouseWheel: {
                before: function()
                {
                    ev.preventDefault();
                    if (ev.wheelDeltaY)
                    {
                        wheelDeltaY = ev.wheelDeltaY / 4;
                    }
                    if (ev.wheelDelta)
                    {
                        wheelDelta = ev.wheelDelta / 4;
                    }
                    if (ev.wheelDeltaX)
                    {
                      wheelDeltaX = ev.wheelDeltaX / 4;
                    }
                    if (ev.detail)
                    {
                      //TODO: Buffer these so that we can send X/Y deltas together instead of one at a time in alternation (smoother drawing)
                      if (ev.axis === ev.HORIZONTAL_AXIS)
                      {
                        wheelDeltaX = -ev.detail;
                      }
                      else
                      {
                        wheelDeltaY = -ev.detail;
                      }
                    }
                },
                after: function()
                {
                    wheelDeltaY = 0;
                    wheelDeltaX = 0;
                }
            },
            click: {
                before: WV.emptyFn,
                after: WV.emptyFn
            },
            contextMenu: {
                before: function()
                {

                }
            },
            dragStart: {
                before: function()
                {
                    if (targetV.draggable === false)
                    {
                        var domTarget = ev.target;

                        if (domTarget && domTarget.nodeType === 1)
                        {
                            if (domTarget.tagName.toLowerCase !== 'img' &&
                                domTarget.tagName.toLowerCase !== 'a')
                            {
                                cancel();
                            }
                        }
                        else
                        {
                            cancel();
                        }

                        return false;
                    }
                }
            },
            drag: {
                before: function()
                {
                    if (targetV.draggable === false)
                    {
                        return false;
                    }
                }
            },
            dragEnd: {
                before: function()
                {
                    mouseDownOwners[touchId] = null;
                    if (targetV.draggable === false)
                    {
                        return false;
                    }
                }
            },
            keyDown: {
                before: function()
                {
                    // If the ctrl AND alt keys are down and this is a Tab or Tab-shift then change the key view.
                    // This will allow tabbing out of views that would otherwise consume the Tab key (TextArea)
                    if (ev.keyCode === 9 && ev.ctrlKey && ev.altKey)
                    {
                        cancel();
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

    clickReset = new Ext.util.DelayedTask(function() {
        clickCount = 0;
    });

    function cancel()
    {
        if (ev.preventDefault)
        {
            ev.preventDefault();
        }
        if (ev.stopPropagation)
        {
            ev.stopPropagation();
        }
        else
        {
            ev.returnValue = false;
        }

        wasCancelled = true;
    }


    function createMouseEvent()
    {
        var sme = sharedMouseEvent;

//        sme.x = x < 0 ? 0 : Math.min(x, target.w);
//        sme.y = y < 0 ? 0 : Math.min(y, target.h);
//        sme.windowPoint =  { x: ev.clientX,   y: ev.clientY };
        sme.displayPoint = { x: ev.screenX - pointerOffset,   y: ev.screenY - 2 * pointerOffset};
        sme.windowPoint = { x: ev.canvasX - pointerOffset, y: ev.canvasY - 2 * pointerOffset }; // Our WV.Window, not the browser window
        sme.timestamp = ev.timeStamp;
        sme.target = targetV;
        sme.touchId = touchId;
        sme.targetElement = ev.target;
        sme.mouseDownOwner = mouseDownOwners[touchId];
        sme.clickCount = ev.type === 'click' ? ev.detail : clickCount;
        sme.leftButton = clickCount > 0 && (ev.button === 0);
        sme.middleButton = clickCount > 0 && (ev.button === 1);
        sme.rightButton = clickCount > 0 && (ev.button === 2);

        if (wasDragged === true)
        {
            sme.deltaX = ev.clientX - downX;
            sme.deltaY = ev.clientY - downY;
        }
        else
        {
            delete sme.deltaX;
            delete sme.deltaY;
        }

        if (wheelDeltaX)
        {
            sme.wheelDeltaX = wheelDeltaX;
        }
        else
        {
            delete sme.wheelDeltaX;
        }

        if (wheelDeltaY)
        {
          sme.wheelDeltaY = wheelDeltaY;
        }
        else
        {
          delete sme.wheelDeltaY;
        }

        if (wheelDelta)
        {
          sme.wheelDelta = wheelDelta;
        }
        else
        {
          delete sme.wheelDelta;
        }
    }

    function createKeyEvent()
    {
//        sharedKeyEvent = Object.create(ev);
        sharedKeyEvent = ev;

        if (Ext.isMac)
        {
            sharedKeyEvent.commandKey = ev.metaKey;
        }

        sharedKeyEvent.targetElement = ev.target;
        sharedKeyEvent.target = targetV;

        sharedKeyEvent.character = ev.shiftKey ? String.fromCharCode(ev.charCode)
                                               : String.fromCharCode(ev.charCode).toLowerCase();
    }

    WV.EventMonitor = WV.extend(Object, {
        constructor: function(ownerWindow)
        {
            this.window = ownerWindow;

            if (window.navigator.msPointerEnabled)
            {
              this.monitorEvent('MSPointerDown', true);
              this.monitorEvent('MSPointerUp', true);
              this.monitorEvent('MSPointerMove', true);
              this.monitorEvent('MSPointerOut', true);
            }
            else
            {
              this.monitorEvent('mouseDown');
              this.monitorEvent('mouseUp');
              this.monitorEvent('mouseMove');
              this.monitorEvent('mouseOut');
            }
            this.monitorEvent('mouseWheel');
            this.monitorEvent('click');
            this.monitorEvent('contextMenu');
//            this.monitorEvent('dragStart');
//            this.monitorEvent('drag');
//            this.monitorEvent('dragEnd');
            this.monitorEvent('keyDown');
            this.monitorEvent('keyUp');
        },
        monitorEvent: function(name, preserveCase)
        {
            var win = this.window, // Our WV.Window
                registerName = preserveCase ? name : name.toLocaleLowerCase(),  // Listen for events using this name/type
                ename = name.replace('MSPointer', 'mouse');  // ename represents the name of the function we will invoke on firstResponder

            if (Ext.isGecko && registerName === 'mousewheel')
            {
              registerName = 'MozMousePixelScroll';
            }

            document.documentElement.addEventListener(registerName, function(e) {

                // Set these shared objects before processing the event
                ev = e;
                wasCancelled = false;
                targetV = null;

                // Stop everything if we are ignoring events
                if (ignoreEvents)
                {
                    cancel();
                    return wasCancelled;
                }

                var el = ev.target,
                        proceed,
                        rect, canvasRect,
                        isKeyEvent = ename.indexOf('key') === 0;

                if (!el) { return wasCancelled; }

                if (isKeyEvent)
                {
                    targetV = win.firstResponder;
                }
                else // Mouse event
                {
                    /*
                     * Target is an element outside a non-full screen app or an absolutely positioned
                     * within our canvas' rect. In the Translate the point to our canvas' coordinates
                     */
                    if (el !== win.canvas)
                    {
                        if (el.getAttribute('_textOverlay'))
                        {
                            rect = el.getBoundingClientRect();
                            canvasRect = win.canvas.getBoundingClientRect();
                            ev.canvasX = rect.left + ev[posPropX] - canvasRect.left;
                            ev.canvasY = rect.top + ev[posPropY] - canvasRect.top;
                        }
                        // Not one of our text overlays so do not set targetV, event ignored
                    }
                    else
                    {
                       // No adjustment needed, the target is our canvas
                       ev.canvasX = ev[posPropX];
                       ev.canvasY = ev[posPropY];
                    }

                    targetV = win.hitTest({ x: ev.canvasX - pointerOffset,
                                            y: ev.canvasY - 2 * pointerOffset });
                }

                if (targetV)
                {
                    touchId = ev.pointerId || 1;

                    proceed = monitors[ename].before ? monitors[ename].before(win) : true;

                    if (proceed !== false && targetV[ename])
                    {
                        if (isKeyEvent)
                        {
                            createKeyEvent();
                            targetV[ename](sharedKeyEvent);
                        }
                        else
                        {
                            createMouseEvent();

                           //console.log(sharedMouseEvent.wheelDeltaX + ', ' + sharedMouseEvent.wheelDeltaY);
                            targetV[ename](sharedMouseEvent);

                            // Prevent our handler from being called twice in MSPointer environments
                            if (ev.preventMouseEvent)
                            {
                              ev.preventMouseEvent();
                            }
                        }
                    }

                    if (monitors[ename].after)
                    {
                        monitors[ename].after();
                    }
                }
                else
                {
                    cancel();
                }

                return wasCancelled;
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