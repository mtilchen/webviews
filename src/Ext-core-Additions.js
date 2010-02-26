/**
 * Additions to classes in the Ext Core library
 */

Ext.util.Observable.prototype.enableBubble = function(events)
{
    var i, l, event, eventName;

    for (i = 0, l = arguments.length; i < l; i++)
    {
        eventName = arguments[i].toLowerCase();
        event = this.events[eventName] || true;
        if (typeof event === 'boolean')
        {
            this.events[eventName] = event = new Ext.util.Event(this, eventName);
        }
        event.bubble = true;
    }
};
