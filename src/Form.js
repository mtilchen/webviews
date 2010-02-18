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
    name: undefined,
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
    name: undefined,
    inputType: 'hidden',
    canBecomeFirstResponder: true,
    state: 'normal',
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
        return this;
    },
    setState: function(newState)
    {
        var end, start = new Date();
        if (typeof newState === 'string')
        {
            var i, s, newStyle, hits,
                styleObj = this.styleObject,
                styles = newState.split(/\s*,\s*/);

            this.state = newState;

            // Starting with the defaults, apply each style found in the new state string, overriding at each step
            newStyle = WV.apply({}, styleObj['base'].defaults);

            // Do this view first using 'base'
            for (s = 0; s < styles.length; s++)
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

                        for (s = 0; s < styles.length; s++)
                        {
                            WV.apply(newStyle, styleObj[vtag][styles[s]]);
                        }
                        for (i = 0; i < hits.length; i++)
                        {
                            hits[i].setStyle(newStyle);
                        }
                    }
                }
            }
        }

        end = new Date();
        WV.log('setState(): ', end.getTime() - start.getTime(), 'ms');
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
            // TODO: Override this in TextArea
            return this.subViews.input.dom.value;
        }
        else { return this.value; }
    },

    setValue: function(val)
    {
        this.value = val;
        if (this.rendered)
        {
            this.subViews.input.dom.value = this.value;
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
    input: {
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
        vtype: 'input',
        inputType: 'button',
        vtag: 'input',
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

        this.setState(this.state);
        
        return this;
    },
    mouseDown: function(e)
    {
        this.addState('active');
        this.removeState('normal');
        this.becomeFirstResponder();
        this.canResignFirstResponder = false;

        return WV.Button.superclass.mouseDown.call(this, e);
    },
    mouseUp: function(e)
    {
        this.hasMouseDown = false;

        this.addState('normal');
        this.removeState('active');

        this.canResignFirstResponder = true;

        if (e.target.isDescendantOf(this))
        {
            this.doAction();
        }

        return WV.Button.superclass.mouseUp.call(this, e);
    },

    mouseExited: function(e)
    {
        this.addState('normal');
        this.removeState('active');

        this.canResignFirstResponder = true;

        return WV.Button.superclass.mouseExited.call(this, e);
    },

    mouseEntered: function(e)
    {
        if (this.hasMouseDown)
        {
            this.addState('active');
            this.removeState('normal');
        }

        this.canResignFirstResponder = true;

        return WV.Button.superclass.mouseEntered.call(this, e);
    },

    mouseDragged: function(e)
    {
        this.hasMouseDown = true;

        return WV.Button.superclass.mouseDragged.call(this, e);
    }
});

WV.RadioButton = WV.extend(WV.View, {
    h: 13,
    w: 13,
	autoResizeMask: WV.RESIZE_NONE,
	cls: 'wv-radio-button',
    tag: 'div',
	text: 'Radio',
	checked: '',
	style: {
        backgroundImage: 'url(resources/images/form/radio.png)',
		backgroundPosition: '0 0',
		backgroundRepeat: 'no-repeat'
	},
	constructor: function(config)
    {
        WV.RadioButton.superclass.constructor.call(this, config);
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
        checked: {
            display: 'block'
        }
    }
};

WV.CheckBox = WV.extend(WV.Button, {
    vtype: 'checkbox',
    h: 12,
    w: 12,
    clipSubViews: false,
	text: 'Check',
    checked: true,
    checkedValue: true,
    uncheckedValue: false,
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
    }],
    constructor: function(config)
    {
        WV.CheckBox.superclass.constructor.call(this, config);

        this.setChecked(this.checked);
    },
    setChecked: function(val)
    {
        this.checked = val === true;
        this.checked ? this.addState('checked') : this.removeState('checked');
        if (this.rendered)
        {
            this.subViews.input.dom.value = this.checked ? this.checkedValue : this.uncheckedValue;
        }
    },
    doAction: function()
    {
        // Set the value before the action fires in the superclass
        this.setChecked(!this.checked);
        WV.CheckBox.superclass.doAction.call(this);
    }
});

WV.TextComponentStyle = {
    field: {
		backgroundColor: '#F9F9F9',
		borderBottomColor: '#999',
		borderLeftColor: '#999',
		borderRadius: '2px',
		borderRightColor: '#999',
		borderStyle: 'solid',
        borderTopColor: '#999',
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

        this.field = new WV.View({
            x: 2,
            y: 2,
            h: this.h,
            w: this.w,
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
    h: 22,
	cls: 'wv-text-field',
    componentTag: 'input',
    componentTpl: { type: '{type}', name: '{name}', value: '{text}' }
});

WV.PasswordField = WV.extend(WV.TextField, {
	cls: 'wv-password-field',
    type: 'password'
});

WV.TextArea = WV.extend(WV.TextComponent, {
    h: 100,
	cls: 'wv-textarea',
    componentTag: 'textarea',
    componentTpl: { html: '{text}' }
});
