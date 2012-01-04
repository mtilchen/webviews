
WV.Responder = {
    nextResponder: null,
    isFirstResponder: false,
    canBecomeFirstResponder: function()
    {
        return false;
    },
    canResignFirstResponder: function()
    {
        return true;
    },
    becomeFirstResponder: function()
    {
        if (this.isFirstResponder === true) { return true; }

        else if (this.canBecomeFirstResponder() === true)
        {
            if (this.window && this.window.firstResponder)
            {
                if (this.window.firstResponder.resignFirstResponder() === true)
                {
                    this.window.firstResponder = this;
                    this.isFirstResponder = true;
                    return true;
                }
                else
                {
                    return false;
                }
            }
            else if (this.window)
            {
                this.window.firstResponder = this;
                this.isFirstResponder = true;
                return true;
            }
        }
        return false;
    },
    resignFirstResponder: function()
    {
        if (this.canResignFirstResponder() === true)
        {
            if (this.window && (this === this.window.firstResponder))
            {
                this.window.firstResponder = undefined;
            }
            this.isFirstResponder = false;
            return true;
        }
        else
        {
            return false;
        }
    },
    noResponderFor: function(eName, e, misc)
    {
        // Play sound for keyDown?
        if (WV.debugMode && false)
        {
            if (eName.indexOf('key') === 0)
            {
                WV.log('Key: ', e.character);
            }
            else if (eName.indexOf('touch') === 0)
            {
                WV.log(eName, ':\t', misc, '\t', e);
            }
            else
            {
                var p = e.target.convertPointFromView(e.windowPoint);
                WV.log('(', eName, ') ', this.id, ' (', e.windowPoint.x, ', ', e.windowPoint.y, ') ', e.target.id, ' (', p.x, ', ', p.y, ')');
                if (e.clickCount)
                    WV.log('Clicks: ', e.clickCount);
                if (e.leftButton)
                    WV.log('Left Button');
                if (e.rightButton)
                {
                    WV.log('Right Button');
                    e.cancel();
                }
            }
        }
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
    click: function(e)
    {
        this.nextResponder ? this.nextResponder.click(e) : this.noResponderFor('click', e);
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
    },
    touchesBegan: function(touches, e)
    {
      this.nextResponder ? this.nextResponder.touchesBegan(touches, e) : this.noResponderFor('touchesBegan', e, touches);
    },
    touchesMoved: function(touches, e)
    {
      this.nextResponder ? this.nextResponder.touchesMoved(touches, e) : this.noResponderFor('touchesMoved', e, touches);
    },
    touchesEnded: function(touches, e)
    {
      this.nextResponder ? this.nextResponder.touchesEnded(touches, e) : this.noResponderFor('touchesEnded', e, touches);
    },
    touchesCancelled: function(touches, e)
    {
      this.nextResponder ? this.nextResponder.touchesCancelled(touches, e) : this.noResponderFor('touchesCancelled', e, touches);
    }
};