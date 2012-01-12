
(function() {

    var pointerOffset = Ext.isMac ? 1 : 0,
        mouseDownOwners = {},
        mouseOverOwners = {},
        downX = 0,
        downY = 0,
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
                    downX = be.clientX;
                    downY = be.clientY;
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
                        createMouseEvent();
                        if (prevOver && !mouseOverOwners[touchId].isDescendantOf(prevOver))
                        {
                            prevOver.mouseExited(sharedMouseEvent);
                        }

                        if (prevOver && !prevOver.isDescendantOf(mouseOverOwners[touchId]))
                        {
                            mouseOverOwners[touchId].mouseEntered(sharedMouseEvent);
                        }
                    }

                    if (mouseDownOwners[touchId] /*=== targetV */)
                    {
                        // 'draggable' here refers to drag and drop functionality
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
                    if (ev.xy[0] < 0 || ev.xy[1] < 0 ||
                        ev.xy[0] >= Ext.lib.Dom.getViewportWidth() || ev.xy[1] >= Ext.lib.Dom.getViewportHeight())
                    {
                        mouseDownOwners[touchId] = null;
                        wasDragged = false;

                        if (mouseOverOwners[touchId])
                        {
                            createMouseEvent();
                            mouseOverOwners[touchId].mouseExited(sharedMouseEvent);
                            mouseOverOwners[touchId] = null;
                        }
                    }
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
                    if (be.wheelDelta)
                    {
                        wheelDelta = be.wheelDelta / -120;
                    }
                    else if (be.detail)
                    {
                        wheelDelta = be.detail;
                    }
                },
                after: function()
                {
                    wheelDelta = 0;
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
                        var domTarget = be.target;

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
                    if (ev.getCharCode() === 9 && ev.ctrlKey && ev.altKey)
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
        if (be.preventDefault)
        {
            be.preventDefault();
        }
        if (be.stopPropagation)
        {
            be.stopPropagation();
        }
        else
        {
            be.returnValue = false;
        }

        wasCancelled = true;
    }


    function createMouseEvent()
    {
        var sme = sharedMouseEvent;

//        sme.x = x < 0 ? 0 : Math.min(x, target.w);
//        sme.y = y < 0 ? 0 : Math.min(y, target.h);
//        sme.windowPoint =  { x: be.clientX,   y: be.clientY };
        sme.displayPoint = { x: be.screenX,   y: be.screenY };
        sme.windowPoint = { x: be.canvasX, y: be.canvasY }; // Our WV.Window, not the browser window
        sme.timestamp = be.timeStamp;
        sme.target = targetV;
        sme.touchId = touchId;
        sme.targetElement = be.target;
        sme.mouseDownOwner = mouseDownOwners[touchId];
        sme.clickCount = be.type === 'click' ? be.detail : clickCount;
        sme.leftButton = clickCount > 0 && (ev.button === 0);
        sme.middleButton = clickCount > 0 && (ev.button === 1);
        sme.rightButton = clickCount > 0 && (ev.button === 2);

        if (wasDragged === true)
        {
            sme.deltaX = be.clientX - downX;
            sme.deltaY = be.clientY - downY;
        }
        else
        {
            delete sme.deltaX;
            delete sme.deltaY;
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
        var ske = sharedKeyEvent;

        ske.keyCode = ev.getKey();
        ske.charCode = ev.getCharCode();
        ske.shiftKey = ev.shiftKey;
        ske.altKey = ev.altKey;
        ske.ctrlKey = be.ctrlKey;
        if (Ext.isMac)
        {
            ske.commandKey = be.metaKey;
        }
        else
        {
            ske.metaKey = be.metaKey;
        }
        ske.target = targetV;
        ske.targetElement = be.target;

        ske.character = ske.shiftKey ? String.fromCharCode(ske.charCode)
                                     : String.fromCharCode(ske.charCode).toLowerCase();
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
              this.monitorEvent('mouseWheel');
            }
            this.monitorEvent('click');
            this.monitorEvent('contextMenu');
            this.monitorEvent('dragStart');
            this.monitorEvent('drag');
            this.monitorEvent('dragEnd');
            this.monitorEvent('keyDown');
            this.monitorEvent('keyUp');
        },
        monitorEvent: function(name, preserveCase)
        {
            var win = this.window, // Our WV.Window
                registerName = preserveCase ? name : name.toLocaleLowerCase(),  // Listen for events using this name/type
                ename = name.replace('MSPointer', 'mouse');  // ename represents the name of the function we will invoke on firstResponder

            Ext.EventManager.addListener(Ext.getBody().dom, registerName, function(e) {

                // Set these four shared objects before processing the event
                ev = e;
                be = e.browserEvent;
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
                            be.canvasX = rect.left + be[posPropX] - canvasRect.left;
                            be.canvasY = rect.top + be[posPropY] - canvasRect.top;
                        }
                        // Not one of our text overlays so do not set targetV, event ignored
                    }
                    else
                    {
                       // No adjustment needed, the target is our canvas
                       be.canvasX = be[posPropX];
                       be.canvasY = be[posPropY];
                    }

                    targetV = win.hitTest({ x: be.canvasX - pointerOffset,
                                            y: be.canvasY - 2 * pointerOffset });
                }

                if (targetV)
                {
                    touchId = be.pointerId || 1;

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
                            targetV[ename](sharedMouseEvent);

                            // Prevent our handler from being called twice in MSPointer environments
                            if (be.preventMouseEvent)
                            {
                              be.preventMouseEvent();
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
            });
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