
WV.Responder = {
    nextResponder: null,
    isFirstResponder: false,
    canBecomeFirstResponder: false,
    canResignFirstResponder: true,
    becomeFirstResponder: function()
    {
        if (this.isFirstResponder === true) { return true; }

        else if (this.canBecomeFirstResponder === true)
        {
            if (WV.Window.firstResponder)
            {
                if (WV.Window.firstResponder.resignFirstResponder() === true)
                {
                    WV.Window.firstResponder = this;
                    this.isFirstResponder = true;
                    return true;
                }
                else
                {
                    return false;
                }
            }
            else
            {
                WV.Window.firstResponder = this;
                this.isFirstResponder = true;
                return true;
            }
        }
        return false;
    },
    resignFirstResponder: function()
    {
        if (this.canResignFirstResponder === true)
        {
            if (this === WV.Window.firstResponder)
            {
                WV.Window.firstResponder = undefined;
            }
            this.isFirstResponder = false;
            return true;
        }
        else
        {
            return false;
        }
    },
    noResponderFor: function(eName, e)
    {
        // Play sound for keyDown?
//        var conv = e.targetView.convertPointFromView(e.windowPoint);
//        console.log(this.id, ' (', eName, ') (', e.windowPoint.x, ', ', e.windowPoint.y, ')', e.targetView.id, ' ', '(', conv.x, ', ', conv.y, ') ', e.targetElement.id, ' (', e.elementPoint.x, ', ', e.elementPoint.y, ')');
//        if (e.clickCount)
//            console.log('Clicks: ', e.clickCount);
//        if (e.leftButton)
//            console.log('Left Button');
//        if (e.rightButton)
//        {
//            console.log('Right Button');
//            e.cancel();
//        }
//        if (eName.indexOf('key') === 0)
//        {
//            WV.log('Key: ', e.character);
//        }
    },
    mouseDown: function(e)
    {
        this.nextResponder ? this.nextResponder.mouseDown(e) : this.noResponderFor('mouseDown', e);
    },
    mouseMove: function(e)
    {
        this.nextResponder ? this.nextResponder.mouseMove(e) : this.noResponderFor('mouseMove', e);
    },
    mouseUp: function(e)
    {
        this.nextResponder ? this.nextResponder.mouseUp(e) : this.noResponderFor('mouseUp', e);
    },
    mouseDragged: function(e)
    {
        this.nextResponder ? this.nextResponder.mouseDragged(e) : this.noResponderFor('mouseDragged', e);
    },
    mouseEntered: function(e)
    {
        this.nextResponder ? this.nextResponder.mouseEntered(e) : this.noResponderFor('mouseEntered', e);
    },
    mouseExited: function(e)
    {
        this.nextResponder ? this.nextResponder.mouseExited(e) : this.noResponderFor('mouseExited', e);
    },
    mouseWheel: function(e)
    {
        this.nextResponder ? this.nextResponder.mouseWheel(e) : this.noResponderFor('mouseWheel', e);
    },
    contextMenu: function(e)
    {
        this.nextResponder ? this.nextResponder.contextMenu(e) : this.noResponderFor('contextMenu', e);
    },
    dragStart: function(e)
    {
//        e.dataTransfer.setData('text/plain', 'This text may be dragged');
    },
    drag: function(e)
    {
    },
    dragEnd: function(e)
    {
    },
    keyDown: function(e)
    {
        this.nextResponder ? this.nextResponder.keyDown(e) : this.noResponderFor('keyDown', e);
    },
    keyUp: function(e)
    {
        this.nextResponder ? this.nextResponder.keyUp(e) : this.noResponderFor('keyUp', e);
    }
};