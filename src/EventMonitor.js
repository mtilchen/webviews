
WV.EventMonitor = (function() {

    var mouseDownOwner,
        mouseOverOwner,
        downX = 0,
        downY = 0,
        wheelDelta = 0,
        clickCount = 0,
        wasDragged,
        wasCancelled = false,
        be, // browserEvent
        sharedMouseEvent = { cancel: function() { be.preventDefault(); be.stopPropagation(); be.cancelBubble = true; be.returnValue = false; wasCancelled = true; }},
        sharedKeyEvent = { cancel: function() { be.preventDefault(); be.stopPropagation(); be.cancelBubble = true; be.returnValue = false; wasCancelled = true; }},
        posProp = Ext.isIE ? 'offset' : 'layer',
        posPropX = posProp + 'X',
        posPropY = posProp + 'Y',
        monitors = {
            mouseDown: {
                before: function(target, e)
                {
                    var be = e.browserEvent;
                    clickCount++;
                    clickReset.delay(500);
                    downX = be.clientX, downY = be.clientY;
                    mouseDownOwner = target;
                }
            },
            mouseMove: {
                before: function(target, e)
                {
                    var prevOver = mouseOverOwner;
                    mouseOverOwner = target;

                    // Mouse entered/exited
                    if (prevOver !== mouseOverOwner)
                    {
                        createMouseEvent(target, e);
                        if (prevOver)
                        {
                            prevOver.mouseExited(sharedMouseEvent);
                        }

                        mouseOverOwner.mouseEntered(sharedMouseEvent);
                    }

                    if (mouseDownOwner === target)
                    {
                        // 'draggable' here refers to drag and drop functionality
                        if (target.draggable === false)
                        {
                            wasDragged = true;
                            createMouseEvent(target, e);
                            mouseDownOwner.mouseDragged(sharedMouseEvent);
                        }

                        return false;
                    }
                }
            },

            mouseUp: {
                before: function(target, e)
                {
                },
                after: function(target, e)
                {
                    mouseDownOwner = null;
                    wasDragged = false;
                    downX = 0, downY = 0;
                }
            },
            mouseOut: {
                before: function(target, e)
                {
                    // Make sure we do not get stuck in a drag if the mouse leaves the page while down
                    if (e.xy[0] < 0 || e.xy[1] < 0 ||
                        e.xy[0] >= Ext.lib.Dom.getViewportWidth() || e.xy[1] >= Ext.lib.Dom.getViewportHeight())
                    {
                        mouseDownOwner = null;
                        wasDragged = false;

                        if (mouseOverOwner)
                        {
                            createMouseEvent(target, e);
                            mouseOverOwner.mouseExited(sharedMouseEvent);
                            mouseOverOwner = null;
                        }
                    }

                    return false;
                }
            },
            mouseOver: {
                before: function(target, e)
                {

                }
            },
            mouseWheel: {
                before: function(target, e)
                {
                    var be = e.browserEvent;

                    if (be.wheelDelta)
                    {
                        wheelDelta = be.wheelDelta / -120;
                    }
                    else if (be.detail)
                    {
                        wheelDelta = be.detail;
                    }
                },
                after: function(target, e)
                {
                    wheelDelta = 0;
                }
            },
            contextMenu: {
                before: function(target, e)
                {

                }
            },
            dragStart: {
                before: function(target, e)
                {
                    if (target.draggable === false)
                    {
                        var be = e.browserEvent,
                            domTarget = be.target;

                        if (domTarget.nodeType === 1 && domTarget.tagName.toLowerCase !== 'img' &&
                                                        domTarget.tagName.toLowerCase !== 'a')
                        {
                            be.preventDefault();
                        }
                        return false;
                    }
                }
            },
            drag: {
                before: function(target, e)
                {
                    if (target.draggable === false)
                    {
                        return false;
                    }
                }
            },
            dragEnd: {
                before: function(target, e)
                {
                    mouseDownOwner = null;
                    if (target.draggable === false)
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

    function createMouseEvent(target, e)
    {
        be = e.browserEvent;
        var sme = sharedMouseEvent;
            
//        sme.x = x < 0 ? 0 : Math.min(x, target.w);
//        sme.y = y < 0 ? 0 : Math.min(y, target.h);
        sme.windowPoint =  { x: be.clientX,   y: be.clientY };
        sme.displayPoint = { x: be.screenX,   y: be.screenY };
        sme.elementPoint = { x: be[posPropX], y: be[posPropY] };
        sme.timestamp = be.timeStamp;
        sme.targetView = target;
        sme.targetElement = be.target;
        sme.clickCount = clickCount;
        sme.leftButton = clickCount > 0 && (e.button === 0);
        sme.middleButton = clickCount > 0 && (e.button === 1);
        sme.rightButton = clickCount > 0 && (e.button === 2);

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

    function createKeyEvent(target, e)
    {
        be = e.browserEvent;
        var ske = sharedKeyEvent;

        ske.keyCode = e.getKey();
        ske.charCode = e.getCharCode();
        ske.shiftKey = e.shiftKey;
        ske.altKey = e.altKey;
        ske.ctrlKey = be.ctrlKey;
        ske.metaKey = be.metaKey;
        ske.targetView = target;
        ske.targetElement = be.target;

        ske.character = ske.shiftKey ? String.fromCharCode(ske.charCode)
                                     : String.fromCharCode(ske.charCode).toLowerCase();  
    }

    return {
        monitorEvent: function(name)
        {
            Ext.EventManager.addListener(document, name.toLowerCase(), function(e) {

                var el = e.target,
                        targetV,
                        proceed,
                        isKeyEvent = name.indexOf('key') === 0;

                wasCancelled = false;

                if (!el) { return wasCancelled; }

                if (isKeyEvent)
                {
                    targetV = WV.Window.firstResponder || WV.Window;
                }
                else
                {
                    targetV = WV.Window.hitTest({ x: e.browserEvent.clientX,
                                                y: e.browserEvent.clientY });
                }

                proceed = monitors[name].before ? monitors[name].before(targetV, e) : true;

                if (proceed !== false && targetV && targetV[name])
                {
                    if (isKeyEvent)
                    {
                        createKeyEvent(targetV, e);
                        targetV[name](sharedKeyEvent);
                    }
                    else
                    {
                        createMouseEvent(targetV, e);
                        targetV[name](sharedMouseEvent);    
                    }
                }

                if (monitors[name].after) { monitors[name].after(targetV, e); }

                return wasCancelled;
            });
        }
    }
})();