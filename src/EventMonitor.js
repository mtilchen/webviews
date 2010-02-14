
WV.EventMonitor = (function() {

    var mouseDownOwner,
        mouseOverOwner,
        downX = 0,
        downY = 0,
        wheelDelta = 0,
        clickCount = 0,
        wasDragged,
        wasCancelled = false,
        ev, // Current Ext event
        be, // Current browserEvent
        targetV, // Current target View
        sharedMouseEvent = { cancel: cancel },
        sharedKeyEvent = { cancel: cancel },
        posProp = Ext.isIE ? 'offset' : 'layer',
        posPropX = posProp + 'X',
        posPropY = posProp + 'Y',
        monitors = {
            mouseDown: {
                before: function()
                {
                    clickCount++;
                    clickReset.delay(500);
                    downX = be.clientX, downY = be.clientY;
                    mouseDownOwner = targetV;
                }
            },
            mouseMove: {
                before: function()
                {
                    var prevOver = mouseOverOwner;
                    mouseOverOwner = targetV;

                    // Mouse entered/exited
                    if (prevOver !== mouseOverOwner)
                    {
                        createMouseEvent();
                        if (prevOver)
                        {
                            prevOver.mouseExited(sharedMouseEvent);
                        }

                        mouseOverOwner.mouseEntered(sharedMouseEvent);
                    }

                    if (mouseDownOwner === targetV)
                    {
                        // 'draggable' here refers to drag and drop functionality
                        if (targetV.draggable === false)
                        {
                            wasDragged = true;
                            createMouseEvent();
                            mouseDownOwner.mouseDragged(sharedMouseEvent);
                        }

                        return false;
                    }
                }
            },

            mouseUp: {
                before: function()
                {
                    // Always call mouseUp on the mouseDownOwner after a drag
                    if (wasDragged && mouseDownOwner)
                    {
                        createMouseEvent();
                        mouseDownOwner.mouseUp(sharedMouseEvent);
                        return false;
                    }
                },
                after: function()
                {
                    mouseDownOwner = null;
                    wasDragged = false;
                    downX = 0, downY = 0;
                }
            },
            mouseOut: {
                before: function()
                {
                    // Make sure we do not get stuck in a drag if the mouse leaves the page while down
                    if (ev.xy[0] < 0 || ev.xy[1] < 0 ||
                        ev.xy[0] >= Ext.lib.Dom.getViewportWidth() || ev.xy[1] >= Ext.lib.Dom.getViewportHeight())
                    {
                        mouseDownOwner = null;
                        wasDragged = false;

                        if (mouseOverOwner)
                        {
                            createMouseEvent();
                            mouseOverOwner.mouseExited(sharedMouseEvent);
                            mouseOverOwner = null;
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

                        if (domTarget.nodeType === 1)
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
                    mouseDownOwner = null;
                    if (targetV.draggable === false)
                    {
                        return false;
                    }
                }
            },
            keyDown: {
                before: WV.emptyFn,
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

    // Returns true if the view is a descendant of a disabled view
    function checkDisabled(view)
    {
        while (view)
        {
            if (view.disabled === true)
            {
                return true;
            }
            view = view.superView;
        }
        return false;
    }

    function cancel()
    {
        if (be.preventDefault)
        {
            be.preventDefault();
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
        sme.windowPoint =  { x: be.clientX,   y: be.clientY };
        sme.displayPoint = { x: be.screenX,   y: be.screenY };
        sme.elementPoint = { x: be[posPropX], y: be[posPropY] };
        sme.timestamp = be.timeStamp;
        sme.target = targetV;
        sme.targetElement = be.target;
        sme.clickCount = clickCount;
        sme.leftButton = clickCount > 0 && (ev.button === 0);
        sme.middleButton = clickCount > 0 && (ev.button === 1);
        sme.rightButton = clickCount > 0 && (ev.button === 2);

        if (wasDragged === true)
        {
            sme.deltaX = be.clientX - downX;
            sme.deltaY = be.clientY - downY;
            sme.downTarget = mouseDownOwner;
        }
        else
        {
            delete sme.deltaX;
            delete sme.deltaY;
            delete sme.downTarget;
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
        ske.metaKey = be.metaKey;
        ske.target = targetV;
        ske.targetElement = be.target;

        ske.character = ske.shiftKey ? String.fromCharCode(ske.charCode)
                                     : String.fromCharCode(ske.charCode).toLowerCase();  
    }

    return {
        monitorEvent: function(name)
        {
            Ext.EventManager.addListener(document, name.toLowerCase(), function(e) {

                // Set these four shared objects before processing the event
                ev = e;
                be = e.browserEvent;
                wasCancelled = false;
                targetV = undefined;

                var el = ev.target,
                        proceed,
                        isKeyEvent = name.indexOf('key') === 0;

                if (!el) { return wasCancelled; }

                if (isKeyEvent)
                {
                    targetV = WV.Window.firstResponder || WV.Window;
                }
                else
                {
                    targetV = WV.Window.hitTest({ x: be.clientX,
                                                  y: be.clientY });
                }

                if (targetV && (checkDisabled(targetV) !== true))
                {
                    proceed = monitors[name].before ? monitors[name].before() : true;

                    if (proceed !== false && targetV[name])
                    {
                        if (isKeyEvent)
                        {
                            createKeyEvent();
                            targetV[name](sharedKeyEvent);
                        }
                        else
                        {
                            createMouseEvent();
                            targetV[name](sharedMouseEvent);
                        }
                    }

                    if (monitors[name].after)
                    {
                        monitors[name].after();
                    }
                }
                else
                {
                    cancel();
                }

                return wasCancelled;
            });
        }
    }
})();