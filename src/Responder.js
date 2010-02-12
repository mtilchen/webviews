
WV.Responder = {
    nextResponder: null,
    acceptsFirstResponder: function()
    {
        return false;
    },
    becomeFirstResponder: function()
    {
        return true;
    },
    resignFirstResponder: function()
    {
        return true;
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
    }
};