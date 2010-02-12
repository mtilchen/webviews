WV.FormView = WV.extend(WV.View, {
    vtype: 'form',
    tag: 'form',
    method: 'POST',
    action: null,
    accept: null,
    acceptCharset: null,
    contentType: 'application/x-www-form-urlencoded',
    domTpl: { method: '{method}', action: '{action}', enctype: '{contentType}', 'accept-charset': '{acceptCharset}' }
});

WV.Button = WV.extend(WV.View, {
    vtype: 'button',
    h: 21,
    w: 300,
    tag: 'input',
    text: 'Button',
    type: 'button',
    domTpl: { type: '{type}', name: '{name}', value: '{text}' }
});

WV.TextComponentStyle = {
    field: {
        border: '1px solid #BBBAB6',
        borderRadius: '2px',
        color: '#333',
        fontFamily: 'Swiss721, Verdana, Helvetica, Arial, sans-serif',
        fontSize: '18px',
        fontWeight: 'normal',
        letterSpacing: '0.06em',
        padding: '3px',
        resize: 'none'
    },
    container: {
        background: 'url(resources/images/form/inset.png)',
        borderRadius: '2px'
    }
};

WV.TextComponent = WV.extend(WV.View, {
    cls: 'text-view',
    w: 150,
    style: WV.TextComponentStyle.container,
    constructor: function(config)
    {
        WV.TextComponent.superclass.constructor.call(this, config);

        // TODO: tabIndex
        this.field = new WV.View({
            x: 2,
            y: 2,
            h: this.h - 4,
            w: this.w - 4,
            autoResizeMask: WV.RESIZE_WIDTH_FLEX | WV.RESIZE_HEIGHT_FLEX,
            tag: this.componentTag,
            text: this.text,
            type: this.type,
            name: this.name,
            domTpl: this.componentTpl,
            style: WV.TextComponentStyle.field
        });
        this.addSubView(this.field);
    },
    setText: function(t)
    {
        this.text = t;
        if (this.rendered)
        {
            this.field.dom.tagName.toLowerCase() === 'input' ? this.field.dom.value = t
                                                             : this.field.dom.innerHTML = t;
        }
        return this;
    }
});

WV.TextField = WV.extend(WV.TextComponent, {
    h: 35,
    componentTag: 'input',
    componentTpl: { type: '{type}', name: '{name}', value: '{text}' }
});

WV.PasswordField = WV.extend(WV.TextField, {
    type: 'password'
});

WV.TextArea = WV.extend(WV.TextComponent, {
    h: 105,
    componentTag: 'textarea',
    componentTpl: { html: '{text}' },
    afterRender: function()
    {
        WV.TextArea.superclass.afterRender.call(this);

        // TODO: Set the form reference of the dom element to the containing form

        return this;
    }
});