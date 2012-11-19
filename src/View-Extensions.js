

WV.Link = WV.extend(WV.Label, {
    vtype: 'link',
    newWindow: false,
    preventNavigation: false,
    constructor: function(config)
    {
        WV.Link.superclass.constructor.call(this, config);

        this.target = this.newWindow ? '_blank' : (config.target || '');
        return this;
    },
    click: function(e)
    {
        if (this.preventNavigation)
        {
            e.cancel();
        }
        WV.Link.superclass.click.call(this, e);
    }
});
