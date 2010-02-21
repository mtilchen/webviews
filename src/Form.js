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

// TODO: tabIndex

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
    canBecomeFirstResponder: true,
    state: 'normal',
    name: '',
    value: '',
    valuePropName: 'value',
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
                readOnly: this.readOnly,
                inputType: this.inputType
            });
        }
        this.setState(this.state);
        this.setValue(this[this.valuePropName]);
        return this;
    },
    setState: function(newState)
    {
        var end, start = new Date();
        if (typeof newState === 'string')
        {
            var i, s, l, newStyle, hits,
                styleObj = this.styleObject,
                styles = newState.split(/\s*,\s*/);

            this.state = newState;

            // Starting with the defaults, apply each style found in the new state string, overriding at each step
            newStyle = WV.apply({}, styleObj['base'].defaults);

            // Do this view first using 'base'
            for (s = 0, l = styles.length; s < l; s++)
            {
                WV.apply(newStyle, styleObj['base'][styles[s]]);
            }

            this.setStyle(newStyle);

            for (var vtag in styleObj)
            {
                if (vtag !== 'base')
                {
                    hits = this.find(vtag);

                    if (hits.length > 0)
                    {
                        newStyle = WV.apply({}, styleObj[vtag].defaults);

                        for (s = 0, l = styles.length; s < l; s++)
                        {
                            WV.apply(newStyle, styleObj[vtag][styles[s]]);
                        }
                        for (i = 0, l = hits.length; i < l; i++)
                        {
                            hits[i].setStyle(newStyle);
                        }
                    }
                }
            }
        }

        end = new Date();
//        WV.log('setState(): ', this.id, ' ', end.getTime() - start.getTime(), 'ms');
        return this;
    },
    addState: function(state)
    {
        if (typeof state === 'string' && this.state && this.state.indexOf(state) < 0)
        {
            if (this.state.length > 0)
            {
                this.setState(this.state + ',' + state);
            }
            else
            {
                this.setState(state);
            }
        }

        return this;
    },
    removeState: function(state)
    {
        if (typeof state === 'string' && this.state)
        {
            var re = new RegExp(String.format('^{0},|{0},|,{0}|{0}$', state), 'g'),
                newState = this.state.replace(re, '');

            if (this.state !== newState)
            {
                this.setState(newState);
            }
        }
        return this;
    },
    doAction: function()
    {
        WV.log('Action: ', this.id, '(name/value): ', this.name, ':', this.getValue());
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
            // This will get picked up by the template during rendering
            this.subViews.input.value = this[this.valuePropName];
        }
        return this;
    },
    setReadOnly: function(val)
    {
        this.readOnly = val === true;
        if (this.rendered)
        {
            this.subViews.input.dom.readOnly = this.readOnly;
        }
        return this;
    },
    becomeFirstResponder: function()
    {
        var result = WV.Control.superclass.becomeFirstResponder.call(this);
        if (result === true)
        {
            this.addState('focus');
        }
        return result;
    },

    resignFirstResponder: function()
    {
        var result = WV.Control.superclass.resignFirstResponder.call(this);
        if (result === true && this.rendered)
        {
            this.removeState('focus');
        }

        return result;
    },
    mouseDown: function(e)
    {
        this.becomeFirstResponder();
        return WV.Control.superclass.mouseDown.call(this, e);
    }
});

WV.style.Button = {
    base: {
        defaults: {
            borderBottomColor: '#E7E7E7',
            borderLeftColor: '#C8C8C8',
            borderRadius: '2px',
            borderRightColor: '#E7E7E7',
            borderStyle: 'solid',
            borderTopColor: '#C8C8C8',
            borderWidth: '1px',
            cursor: 'default'
        },
        normal: {},
        active: {},
        hover: {},
        focus: {
            borderBottomColor: '#4D78A4',
            borderLeftColor: '#4D78A4',
            borderRightColor: '#4D78A4',
            borderTopColor: '#4D78A4',
            borderWidth: '2px'
        }
	},
    outerborder: {
        defaults: {
            borderRadius: '2px',
            borderStyle: 'solid',
            borderWidth: '1px'
        },
        normal: {
            borderBottomColor: '#7E7E7E',
            borderLeftColor: '#939393',
            borderRightColor: '#939393',
            borderTopColor: '#ABABAB'
        },
        active: {
            backgroundColor: '#D2D4D7',
            backgroundImage: 'url(resources/images/form/shadow-x.png)',
            backgroundRepeat: 'repeat-x',
            borderBottomColor: '#4D4D4D',
            borderLeftColor: '#3D3D3D',            
            borderRadius: '0px',
            borderRightColor: '#5C5C5C',
            borderTopColor: '#515151'
        },
        focus: {
            borderRadius: '0px'
        }
	},
    innerborder: {
        defaults: {
            borderRadius: '2px',
            borderStyle: 'solid',
            borderWidth: '1px'
        },
        normal: {
            backgroundColor: '#F9F9F9',
            borderBottomColor: '#D1D1D1',
            borderLeftColor: '#EDEDED',
            borderRightColor: '#EDEDED',
            borderTopColor: '#FAFAFA'
        },
        active: {
            backgroundColor: 'transparent',
            backgroundImage: 'url(resources/images/form/shadow-y.png)',
            backgroundRepeat: 'repeat-y',
            borderBottomColor: '#A7A9AB',
            borderLeftColor: '#666',
            borderRadius: '0px',
            borderRightColor: 'transparent',
            borderTopColor: '#777'
        },
        focus: {
            borderRadius: '0px'
        }
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
        normal: {},
        active: {
            marginLeft: '1px',
            marginTop: '1px'
        }
	}
};

WV.Button = WV.extend(WV.Control, {
    vtype: 'button',
    h: 25,
    w: 96,
    text: '',
    clipSubViews: true,
    styleObject: WV.style.Button,
    subViews: [{
        vtag: 'outerborder',
        x: 1,
        y: 1,
        h: 'h - 2',
        w: 'w - 2',
        autoResizeMask: WV.RESIZE_WIDTH_FLEX
    },{
        vtag: 'innerborder',
        x: 2,
        y: 2,
        h: 'h - 4',
        w: 'w - 4',
        autoResizeMask: WV.RESIZE_WIDTH_FLEX
    },{
        vtag: 'label',
        vtype: 'label',
        draggable: false,
        x: 3,
        y: 3,
        h: 'h - 6',
        w: 'w - 6',
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
        this.addState('active');
        this.removeState('normal');
        WV.Button.superclass.mouseDown.call(this, e);
    },
    mouseUp: function(e)
    {
        this.addState('normal');
        this.removeState('active');

        if (e.target.isDescendantOf(this))
        {
            this.doAction();
        }
        WV.Button.superclass.mouseUp.call(this, e);
    },

    mouseExited: function(e)
    {
        this.addState('normal');
        this.removeState('active');
        WV.Button.superclass.mouseExited.call(this, e);
    },

    mouseEntered: function(e)
    {
        if (e.mouseDownOwner && e.mouseDownOwner.isDescendantOf(this))
        {
            this.addState('active');
            this.removeState('normal');
        }
        WV.Button.superclass.mouseEntered.call(this, e);
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
    mouseUp: function(e)
    {
        if (e.target.isDescendantOf(this))
        {
            this.setSelected(!this.selected);
        }
        WV.Button.superclass.mouseUp.call(this, e);
    }
});

WV.style.CheckBox = {
    base: {
        defaults: {
            borderBottomColor: '#7E7E7E',
            borderLeftColor: '#939393',
            borderRadius: '2px',
            borderRightColor: '#939393',
            borderStyle: 'solid',
            borderTopColor: '#ABABAB',
            borderWidth: '1px'
        },
        normal: {},
        active: {},
        hover: {},
        focus: {
            borderRadius: '0px'
        }
	},
    outerborder: {
        defaults: {
            borderRadius: '2px'
        },
        focus: {
            borderColor: '#4D78A4',
            borderWidth: '1px',
            borderStyle: 'solid'
        }
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
        normal: {
            marginLeft: '0px',
            marginTop: '0px'
        },
        active: {
            marginLeft: '1px',
            marginTop: '1px'
        },
        focus: {
            borderRadius: '0px'
        }
	},
    checkImage: {
        defaults: {
            display: 'none'
        },
        selected: {
            display: 'block'
        }
    }
};

WV.CheckBox = WV.extend(WV.ToggleButton, {
    vtype: 'checkbox',
    h: 12,
    w: 12,
    clipSubViews: false,
	text: 'Check',
    styleObject: WV.style.CheckBox,
    subViews: [{
        vtag: 'outerborder',
        x: -1,
        y: -1,
        h: 'h + 2',
        w: 'w + 2',
        autoResizeMask: WV.RESIZE_NONE
    },{
        vtag: 'innerborder',
        x: 1,
        y: 1,
        h: 'h - 2',
        w: 'w - 2',
        autoResizeMask: WV.RESIZE_NONE
    },{
        vtag: 'checkImage',
        vtype: 'image',
        x: 2,
        y: -5,
        w: 'w + 3',
        src: 'resources/images/form/checkmark.png',
        autoResizeMask: WV.RESIZE_NONE
    },{
        vtag: 'label',
        vtype: 'label',
        draggable: false,
        x: 16,
        y: -1,
        h: 'h',
        w: 'w + 15',
        autoResizeMask: WV.RESIZE_WIDTH_FLEX
    }]
});

WV.style.RadioButton = {
    base: {
        defaults: {
            backgroundImage: 'url(resources/images/form/radio.png)',
		    backgroundPosition: '0px 0px',
		    backgroundRepeat: 'no-repeat'
        },
        selected: {
            backgroundPosition: '0px -13px'
        },
        focus: {
            borderRadius: '0px'
        }
	}
};

WV.RadioButton = WV.extend(WV.ToggleButton, {
    vtype: 'radio',
    h: 13,
    w: 13,
	autoResizeMask: WV.RESIZE_NONE,
	cls: 'wv-radio-button',
	text: 'Radio',
	styleObject: WV.style.RadioButton,
    subViews: [{
        vtag: 'label',
        vtype: 'label',
        draggable: false,
        x: 16,
        y: -2,
        h: 'h',
        w: 'w + 15',
        autoResizeMask: WV.RESIZE_WIDTH_FLEX
    }]
});

WV.style.TextComponent = {
    base: {
        defaults: {
            background: 'url(resources/images/form/inset.png)',
            borderRadius: '2px'
        }
//        focus: {
//            borderStyle: 'solid',
//            borderColor: '#4D78A4',
//            borderWidth: '2px',
//            borderRadius: '0px'
//        }
    },
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
};

WV.TextField = WV.extend(WV.Control, {
    vtype: 'textfield',
    h: 22,
    w: 150,
	cls: 'wv-text-field',
    inputType: 'text',
    valuePropName: 'text',
    styleObject: WV.style.TextComponent,
    constructor: function(config)
    {
        WV.TextField.superclass.constructor.call(this, config);
        this.subViews.input.setFrame({ x: 2, y: 2, w: this.w, h: this.h});
        this.subViews.input.autoResizeMask = WV.RESIZE_WIDTH_FLEX | WV.RESIZE_HEIGHT_FLEX;
        return this;
    },
    afterRender: function()
    {
        // Putting the readOnly attribute in the template during rendering always causes it to be true.
        WV.TextField.superclass.afterRender.call(this);
        this.setReadOnly(this.readOnly);
        return this;
    }
});

WV.PasswordField = WV.extend(WV.TextField, {
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
