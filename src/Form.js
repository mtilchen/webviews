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

WV.Input = WV.extend(WV.View, {
    vtype: 'input',
    tag: 'input',
    name: null,
    value: null,
    inputType: 'hidden',
    domTpl: { type: '{inputType}', name: '{name}', value: '{value}' },
    getForm: function()
    {
        if (this.rendered)
        {
            return WV.get(this.dom.form.id);
        }
        return undefined;
    }   
});

WV.Control = WV.extend(WV.View, {
    inputType: 'hidden',
    stateful: true,
    state: 'normal',
    name: '',
    value: '',
    valuePropName: 'value',
    readOnly: false,
    target: null,
    action: null,
    constructor: function(config)
    {
        WV.Control.superclass.constructor.call(this, config);
        if (!this.subViews.input)
        {
            this.addSubView({
                vtype: 'input',
                vtag: 'input',
                name: this.name,
                inputType: this.inputType
            });
        }
        this.setValue(this[this.valuePropName]);
        return this;
    },
    canBecomeFirstResponder: function()
    {
        return this.enabled === true && this.readOnly !== true;
    },
    setReadOnly: function(ro)
    {
        this.readOnly = ro === true;
        return this;
    },
    doAction: function()
    {
        WV.debug('Action: ', this.id, '(name/value): ', this.name, ':', this.getValue());
        if (this.target && typeof this.action === 'string')
        {
            this.target[this.action](this);
            return true;
        }
        return false;
    },
    getValue: function()
    {
        if (this.rendered)
        {
            this[this.valuePropName] = this.subViews.input.dom.value;
        }
        return this[this.valuePropName];
    },
    setValue: function(val)
    {
        if (this.readOnly === true) { return this; }
        
        this[this.valuePropName] = (val !== undefined && val !== null) ? val : '';
        if (this.rendered)
        {
            this.subViews.input.dom.value = this[this.valuePropName];
        }
        else
        {
            this.subViews.input.value = this[this.valuePropName];
        }
        return this;
    },
    becomeFirstResponder: function()
    {
        var result = WV.Control.superclass.becomeFirstResponder.call(this);
        if (result === true)
        {
            this.addState('focus');
            if (this.rendered && !this.subViews.input.isHiddenOrHasHiddenAncestor())
            {
                this.subViews.input.dom.focus();
            }
        }
        return result;
    },
    resignFirstResponder: function()
    {
        var result = WV.Control.superclass.resignFirstResponder.call(this);
        if (result === true)
        {
            this.removeState('focus');
            if (this.rendered && !this.subViews.input.isHiddenOrHasHiddenAncestor())
            {
                this.subViews.input.dom.blur();
            }
        }
        return result;
    }
});

WV.style.Button = WV.extend(WV.StyleMap, {
    defaults: {
        borderBottomColor: '#E7E7E7',
        borderLeftColor: '#C8C8C8',
        borderRadius: '2px',
        borderRightColor: '#E7E7E7',
        borderStyle: 'solid',
        borderTopColor: '#C8C8C8',
        borderWidth: '1px',
        cursor: 'default' },
    states: [{
        name: 'focus',
        styles: {
            borderBottomColor: '#4D78A4',
            borderLeftColor: '#4D78A4',
            borderRightColor: '#4D78A4',
            borderTopColor: '#4D78A4',
            borderWidth: '2px'  }
    }],
    outerborder: {
        defaults: {
            borderRadius: '2px',
            borderStyle: 'solid',
            borderWidth: '1px' },
        states: [{
            name: 'normal',
            styles: {
                borderBottomColor: '#7E7E7E',
                borderLeftColor: '#939393',
                borderRightColor: '#939393',
                borderTopColor: '#ABABAB' }
        },{
            name: 'active',
            styles: {
                backgroundColor: '#D2D4D7',
                backgroundImage: 'url(resources/images/form/shadow-x.png)',
                backgroundRepeat: 'repeat-x',
                borderBottomColor: '#4D4D4D',
                borderLeftColor: '#3D3D3D',
                borderRadius: '0px',
                borderRightColor: '#5C5C5C',
                borderTopColor: '#515151' }
        },{
            name: 'focus',
            styles: {
                borderRadius: '0px' }
	    }]
    },
    innerborder: {
        defaults: {
            borderRadius: '2px',
            borderStyle: 'solid',
            borderWidth: '1px'
        },
        states: [{
            name: 'normal',
            styles: {
                backgroundColor: '#F9F9F9',
                borderBottomColor: '#D1D1D1',
                borderLeftColor: '#EDEDED',
                borderRightColor: '#EDEDED',
                borderTopColor: '#FAFAFA' }
        },{
            name: 'active',
            styles: {
                backgroundColor: 'transparent',
                backgroundImage: 'url(resources/images/form/shadow-y.png)',
                backgroundRepeat: 'repeat-y',
                borderBottomColor: '#A7A9AB',
                borderLeftColor: '#666',
                borderRadius: '0px',
                borderRightColor: 'transparent',
                borderTopColor: '#777' }
        },{
            name: 'focus',
            styles: {
                borderRadius: '0px' }
        }]
	},
    label: {
        defaults: {
            fontFamily: 'Verdana',
            fontSize: '11px',
            fontWeight: 'normal',
            lineHeight: '19px',
            textAlign: 'center',
            marginLeft: '0px',
            marginTop: '0px'
        },
        states: [{
            name: 'normal',
            styles: {}
        },{
            name: 'active',
            styles: {
                marginLeft: '1px',
                marginTop: '1px' }
        }]
	}
});

WV.Button = WV.extend(WV.Control, {
    vtype: 'button',
    h: 25,
    w: 96,
    text: '',
    clipSubViews: true,
    styleMap: new WV.style.Button(),
    subViews: [{
        vtag: 'outerborder',
        x: 1,
        y: 1,
        h: 'h - 2',
        w: 'w - 2',
        stateful: true,
        autoResizeMask: WV.RESIZE_WIDTH_FLEX
    },{
        vtag: 'innerborder',
        x: 2,
        y: 2,
        h: 'h - 4',
        w: 'w - 4',
        stateful: true,
        autoResizeMask: WV.RESIZE_WIDTH_FLEX
    },{
        vtag: 'label',
        vtype: 'label',
        draggable: false,
        x: 3,
        y: 3,
        h: 'h - 6',
        w: 'w - 6',
        stateful: true,
        autoResizeMask: WV.RESIZE_WIDTH_FLEX
    }],
	constructor: function(config)
    {
        WV.Button.superclass.constructor.call(this, config);

        if (this.subViews.label)
        {
            this.subViews.label.text = this.text;
        }
        return this;
    },
    mouseDown: function(e)
    {
        this.changeState({
            add: 'active',
            remove: 'normal'
        });
        WV.Button.superclass.mouseDown.call(this, e);
    },

    mouseUp: function(e)
    {
        this.changeState({
            add: 'normal',
            remove: 'active'
        });

        if (e.target.isDescendantOf(this))
        {
            this.doAction();
        }
        WV.Button.superclass.mouseUp.call(this, e);
    },

    mouseExited: function(e)
    {
        if (e.mouseDownOwner && e.mouseDownOwner.isDescendantOf(this))
        {
            this.changeState({
                add: 'normal',
                remove: 'active'
            });
        }
        WV.Button.superclass.mouseExited.call(this, e);
    },

    mouseEntered: function(e)
    {
        if (e.mouseDownOwner && e.mouseDownOwner.isDescendantOf(this))
        {
            this.changeState({
                add: 'active',
                remove: 'normal'
            });
           }
        WV.Button.superclass.mouseEntered.call(this, e);
    },
    keyDown: function(e)
    {
        if (e.charCode === 32) // Spacebar triggers the action of Buttons
        {
            e.cancel();
            // Add some visual feedback, showing the action was triggered
            this.changeState({
                add: 'active',
                remove: 'normal'
            });
            var me = this;
            setTimeout(function() {
                me.changeState({
                    add: 'normal',
                    remove: 'active'
                });
                me.doAction();
            }, 15);
        }
        else
        {
            WV.Button.superclass.keyDown.call(this, e);
        }
    }
});

WV.ToggleButton = WV.extend(WV.Button, {
    vtype: 'togglebutton',
    h: 12,
    w: 35,
    clipSubViews: false,
    selected: false,
    selectedValue: true,
    unselectedValue: false,
    constructor: function(config)
    {
        // We need to have a value before the superclass constructor runs because it needs it to call setValue()
        this.value = config.selected || this.selected ? this.selectedValue : this.unselectedValue;
        WV.ToggleButton.superclass.constructor.call(this, config);
        return this;
    },
    setValue: function(val)
    {
        return this.readOnly ? this : this.setSelected(val === this.selectedValue);
    },
    setSelected: function(val)
    {
        this.selected = val === true;
        this.selected ? this.addState('selected') : this.removeState('selected');

        return WV.ToggleButton.superclass.setValue.call(this, this.selected ? this.selectedValue
                                                                            : this.unselectedValue);
    },
    doAction: function(e)
    {
        this.setSelected(!this.selected);
        WV.ToggleButton.superclass.doAction.call(this, e);
    }
});

WV.style.CheckBox = WV.extend(WV.StyleMap, {
    focusborder: {
        states: [{
            name: 'focus',
            styles: {
                borderColor: '#4D78A4',
                borderWidth: '2px',
                borderRadius: '2px',
                borderStyle: 'solid' }
        }]
    },
    outerborder: {
        defaults: {
            borderBottomColor: '#7E7E7E',
            borderLeftColor: '#939393',
            borderRadius: '2px',
            borderRightColor: '#939393',
            borderStyle: 'solid',
            borderTopColor: '#ABABAB',
            borderWidth: '1px'
        },
        states: [{
            name: 'normal',
            styles: {
                marginLeft: '0px',
                marginTop: '0px' }
        },{
            name: 'active',
            styles: {
                marginLeft: '1px',
                marginTop: '1px' }
        },{
            name: 'focus',
            styles: {
                borderRadius: '0px' }
        }]
	},
    innerborder: {
        defaults: {
            backgroundColor: '#F9F9F9',
            borderBottomColor: '#D1D1D1',
            borderLeftColor: '#EDEDED',
            borderRadius: '2px',
            borderRightColor: '#EDEDED',
            borderStyle: 'solid',
            borderTopColor: '#FAFAFA',
            borderWidth: '1px'
        },
        states: [{
            name: 'normal',
            styles: {
                marginLeft: '0px',
                marginTop: '0px' }
        },{
            name: 'active',
            styles: {
                marginLeft: '1px',
                marginTop: '1px' }
        },{
            name: 'focus',
            styles: {
                borderRadius: '0px' }
        }]
	},
    checkImage: {
        defaults: {
            display: 'none'
        },
        states: [{
            name: 'selected',
            styles: {
                display: 'block' }
        }]
    }
});

WV.CheckBox = WV.extend(WV.ToggleButton, {
    vtype: 'checkbox',
    h: 14,
    w: 14,
    clipSubViews: false,
	text: 'Check',
    styleMap: new WV.style.CheckBox(),
    subViews: [{
        vtag: 'focusborder',
        h: 14,
        w: 14,
        stateful: true,
        autoResizeMask: WV.RESIZE_NONE
    },{
        vtag: 'outerborder',
        x: 1,
        y: 1,
        h: 12,
        w: 12,
        stateful: true,
        autoResizeMask: WV.RESIZE_NONE
    },{
        vtag: 'innerborder',
        x: 2,
        y: 2,
        h: 10,
        w: 10,
        stateful: true,
        autoResizeMask: WV.RESIZE_NONE
    },{
        vtag: 'label',
        vtype: 'label',
        draggable: false,
        x: 17,
        y: 0,
        h: 'h',
        w: 'w - 12',
        autoResizeMask: WV.RESIZE_WIDTH_FLEX
    },{
        vtag: 'checkImage',
        vtype: 'image',
        x: 3,
        y: -5,
        w: 15,
        stateful: true,
        src: 'resources/images/form/checkmark.png',
        autoResizeMask: WV.RESIZE_NONE
    }]
});

WV.style.RadioButton = WV.extend(WV.StyleMap, {
    defaults: {
        backgroundImage: 'url(resources/images/form/radio.png)',
        backgroundPosition: '0px 0px',
        backgroundRepeat: 'no-repeat'
    },
    states: [{
        name: 'selected',
        styles: {
            backgroundPosition: '0px -13px' }
    },{
        name: 'focus',
        styles: {
            borderRadius: '0px' }
    }]
});

WV.RadioButton = WV.extend(WV.ToggleButton, {
    vtype: 'radio',
    h: 13,
    w: 13,
    clipSubViews: true,
	autoResizeMask: WV.RESIZE_NONE,
	cls: 'wv-radio-button',
	text: 'Radio',
	styleMap: new WV.style.RadioButton(),
    subViews: [{
        vtag: 'label',
        vtype: 'label',
        draggable: false,
        x: 16,
        h: 13,
        w: 'w + 15',
        autoResizeMask: WV.RESIZE_WIDTH_FLEX
    }]
});

WV.style.TextComponent = WV.extend(WV.StyleMap, {
    defaults: {
        background: 'url(resources/images/form/inset.png)',
        borderRadius: '2px'
    },
//        focus: {
//            borderStyle: 'solid',
//            borderColor: '#4D78A4',
//            borderWidth: '2px',
//            borderRadius: '0px'
//        }
    input: {
        defaults: {
            backgroundColor: '#F9F9F9',
            borderColor: '#999',
            borderRadius: '2px',
            borderStyle: 'solid',
            borderWidth: '1px',
            color: '#000',
            fontFamily: 'Verdana',
            fontSize: '11px',
            fontWeight: 'normal',
            paddingBottom: '0px',
            paddingLeft: '3px',
            paddingRight: '3px',
            paddingTop: '2px',
            resize: 'none'
        }
    }
});

WV.TextField = WV.extend(WV.Control, {
    vtype: 'textfield',
    h: 22,
    w: 150,
	cls: 'wv-text-field',
    inputType: 'text',
    valuePropName: 'text',
    styleMap: new WV.style.TextComponent(),
    constructor: function(config)
    {
        WV.TextField.superclass.constructor.call(this, config);
        var input = this.subViews.input;
        input.setFrame({ x: 2, y: 2, w: this.w, h: this.h});
        // Only initialize the state if we have to. It would otherwise already have been done in addSubView
        if (input.stateful === false)
        {
            input.stateful = true;
            input.setState(this.state);
        }
        input.autoResizeMask = WV.RESIZE_WIDTH_FLEX | WV.RESIZE_HEIGHT_FLEX;
        if (this.readOnly)
        {
            input.value = this[this.valuePropName]; // 'text'
        }
        return this;
    },
    afterRender: function()
    {
        // Putting the readOnly attribute in the template during rendering always causes it to be true.
        WV.TextField.superclass.afterRender.call(this);
        this.setReadOnly(this.readOnly);
        return this;
    },
    setReadOnly: function(ro)
    {
        WV.TextField.superclass.setReadOnly.call(this, ro);
        if (this.rendered)
        {
            this.subViews.input.dom.readOnly = this.readOnly;
            this.subViews.input.dom.setAttribute('autocomplete', this.readOnly ? 'off' : null);
        }
        return this;
    },
    select: function()
    {
        this.becomeFirstResponder();
        return this;
    },
    mouseDown: function(e)
    {
        this.becomeFirstResponder(true);
        return WV.TextField.superclass.mouseDown.call(this, e);
    },
    becomeFirstResponder: function(preventSelect)
    {
        // Yes, use the WV.Control superclass as we want to skip the logic in WV.Control
        var result = WV.Control.superclass.becomeFirstResponder.call(this);
        if (result === true)
        {
            this.addState('focus');
            if (this.rendered && !preventSelect && !this.subViews.input.isHiddenOrHasHiddenAncestor())
            {
                this.subViews.input.dom.select();
            }
        }
        return result;
    }
});

WV.PasswordField = WV.extend(WV.TextField, {
    vtype: 'password',
	cls: 'wv-password-field',
    inputType: 'password'
});

WV.TextArea = WV.extend(WV.TextField, {
    vtype: 'textarea',
    h: 100,
	cls: 'wv-textarea',
    subViews: [{
        vtag: 'input',
        tag: 'textarea',
        stateful: true,
        domTpl: { html: '{value}', name: '{name}' }
    }],
    setValue: function(val)
    {
        WV.TextArea.superclass.setValue.call(this, val);
        // Make the innerHTML consistent with the dom value
        if (this.rendered)
        {
            this.subViews.input.dom.innerHTML = this[this.valuePropName];
        }
        return this;
    }
});
