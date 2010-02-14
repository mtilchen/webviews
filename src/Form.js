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
    domTpl: { type: '{type}', name: '{name}', value: '{text}' },
    getForm: function()
    {
        if (this.rendered)
        {
            return WV.get(this.dom.form.id);
        }
        return undefined;
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
    border: {
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
            borderRadius: '0',
            borderRightColor: '#5C5C5C',
            borderTopColor: '#515151'
        },
        hover: {},
        focus: {
            borderRadius: '0'
        }
	},
    button: {
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
            borderRadius: '0',
            borderRightColor: 'transparent',
            borderTopColor: '#777'
        },
        hover: {},
        focus: {
            borderRadius: '0'
        }
	},
    label: {
        defaults: {
            fontFamily: 'Verdana',
            fontSize: '11px',
            fontWeight: 'normal',
            lineHeight: '19px',
            textAlign: 'center'
        },
        normal: {},
        active: {
            marginLeft: '1px',
            marginTop: '1px'
        },
        hover: {},
        focus: {}
	}
};

WV.Button = WV.extend(WV.View, {
    vtype: 'button',
    h: 25,
    w: 96,
	cls: 'wv-button',
    tag: 'div',
    text: '',
    canBecomeFirstResponder: true,
    clipSubViews: true, 
	style: WV.style.Button.base.normal,
    border: {
        x: 1,
        y: 1,
        h: 'h - 2',
        w: 'w - 2',
        autoResizeMask: WV.RESIZE_WIDTH_FLEX,
        cls: 'wv-button-border',
        tag: 'div',
        style: WV.style.Button.border.normal
    },
    button: {
        vtype: 'input',
        x: 2,
        y: 2,
        h: 'h - 4',
        w: 'w - 4',
        autoResizeMask: WV.RESIZE_WIDTH_FLEX,
        cls: 'wv-button-button',
        type: 'button',
        style: WV.style.Button.button.normal
    },
    label: {
        vtype: 'label',
        autoResizeMask: WV.RESIZE_NONE,
        cls: 'wv-button-label',
        draggable: false,
        x: 3,
        y: 3,
        h: 'h - 6',
        w: 'w - 6',
        style: WV.style.Button.label.normal
    },
	constructor: function(config)
    {
        // Copy the defaults into the styles once
        if (!WV.Button.prototype._initStyles)
        {
            for (var s in WV.style.Button)
            {
                WV.apply(WV.style.Button[s].normal, WV.style.Button[s].defaults);
                WV.apply(WV.style.Button[s].active, WV.style.Button[s].defaults);
                WV.applyIf(WV.style.Button[s].hover, WV.style.Button[s].defaults);
                WV.applyIf(WV.style.Button[s].focus, WV.style.Button[s].defaults);
            }

            WV.Button.prototype._initStyles = true;
        }

        WV.Button.superclass.constructor.call(this, config);

        // Do not overwrite the text property of the label in the prototype
        if (this.label === WV.Button.prototype.label)
        {
            this.label = WV.clone(this.label, { text: this.text });
        }
        else
        {
            this.label.text = this.text;
        }

        this.addSubView(this.border);
        this.addSubView(this.button);
        this.addSubView(this.label);
    },

    mouseDown: function(e)
    {
        this.setStyle(WV.style.Button.base.active);
        this.subViews[0].setStyle(WV.style.Button.border.active);
        this.subViews[1].setStyle(WV.style.Button.button.active);
        this.subViews[2].setStyle(WV.style.Button.label.active);

        this.becomeFirstResponder();
        this.canResignFirstResponder = false;

        return WV.Button.superclass.mouseDown.call(this, e);
    },
    mouseUp: function(e)
    {
        this.hasMouseDown = false;

        this.setStyle(WV.style.Button.base.normal);
        this.subViews[0].setStyle(WV.style.Button.border.normal);
        this.subViews[1].setStyle(WV.style.Button.button.normal);
        this.subViews[2].setStyle(WV.style.Button.label.normal);

        if (this.isFirstResponder)
        {
            this.addStyle(WV.style.Button.base.focus);
            this.subViews[0].addStyle(WV.style.Button.border.focus);
            this.subViews[1].addStyle(WV.style.Button.button.focus);
            this.subViews[2].addStyle(WV.style.Button.label.focus);
        }

        this.canResignFirstResponder = true;

        if (e.target.isDescendantOf(this))
        {
            WV.log('Action trigger: ', this.id);
        }
        
        return WV.Button.superclass.mouseUp.call(this, e);
    },

    mouseExited: function(e)
    {
        this.setStyle(WV.style.Button.base.normal);
        this.subViews[0].setStyle(WV.style.Button.border.normal);
        this.subViews[1].setStyle(WV.style.Button.button.normal);
        this.subViews[2].setStyle(WV.style.Button.label.normal);

        if (this.isFirstResponder)
        {
            this.addStyle(WV.style.Button.base.focus);
            this.subViews[0].addStyle(WV.style.Button.border.focus);
            this.subViews[1].addStyle(WV.style.Button.button.focus);
            this.subViews[2].addStyle(WV.style.Button.label.focus);
        }
        
        this.canResignFirstResponder = true;

        return WV.Button.superclass.mouseExited.call(this, e);
    },

    mouseEntered: function(e)
    {
        if (this.hasMouseDown)
        {
            this.setStyle(WV.style.Button.base.active);
            this.subViews[0].setStyle(WV.style.Button.border.active);
            this.subViews[1].setStyle(WV.style.Button.button.active);
            this.subViews[2].setStyle(WV.style.Button.label.active);
            if (this.isFirstResponder)
            {
                this.addStyle(WV.style.Button.base.focus);
                this.subViews[0].addStyle(WV.style.Button.border.focus);
                this.subViews[1].addStyle(WV.style.Button.button.focus);
                this.subViews[2].addStyle(WV.style.Button.label.focus);
            }
        }

        this.canResignFirstResponder = true;

        return WV.Button.superclass.mouseEntered.call(this, e);
    },

    mouseDragged: function(e)
    {
        this.hasMouseDown = true;

        return WV.Button.superclass.mouseDragged.call(this, e);
    },

    becomeFirstResponder: function()
    {
        var result = WV.Button.superclass.becomeFirstResponder.call(this);
        if (result === true)
        {
            this.addStyle(WV.style.Button.base.focus);
            this.subViews[0].addStyle(WV.style.Button.border.focus);
            this.subViews[1].addStyle(WV.style.Button.button.focus);
            this.subViews[2].addStyle(WV.style.Button.label.focus);
        }

        return result;
    },

    resignFirstResponder: function()
    {
        var result = WV.Button.superclass.resignFirstResponder.call(this);
        if (result === true)
        {
            this.setStyle(WV.style.Button.base.normal);
            this.subViews[0].setStyle(WV.style.Button.border.normal);
            this.subViews[1].setStyle(WV.style.Button.button.normal);
            this.subViews[2].setStyle(WV.style.Button.label.normal);
        }

        return result;
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
    componentTpl: { html: '{text}' },
    afterRender: function()
    {
        WV.TextArea.superclass.afterRender.call(this);

        // TODO: Set the form reference of the dom element to the containing form

        return this;
    }
}); 

WV.CheckBox = WV.extend(WV.View, {
    h: 12,
    w: 12,
	cls: 'wv-checkbox',
    tag: 'div',
	text: 'Check',
	style: {
        borderBottomColor: '#7E7E7E',
		borderLeftColor: '#939393',
		borderRadius: '2px',
		borderRightColor: '#939393',
		borderStyle: 'solid',				
        borderTopColor: '#ABABAB',
		borderWidth: '1px'
	},
	constructor: function(config)
    {
        WV.CheckBox.superclass.constructor.call(this, config);

		// Border
		this.addSubView({
            x: 1,
            y: 1,
            h: this.h - 2,
            w: this.w - 2,
            autoResizeMask: WV.RESIZE_WIDTH_FLEX,
			cls: 'wv-checkbox-border',
            tag: 'div',
			style: {
				backgroundColor: '#F9F9F9',
		        borderBottomColor: '#D1D1D1',
				borderLeftColor: '#EDEDED',
				borderRadius: '2px',
				borderRightColor: '#EDEDED',
				borderStyle: 'solid',				
		        borderTopColor: '#FAFAFA',
				borderWidth: '1px'								
			}			
        });

		// Checkmark
		this.addSubView({
			x: 3,
			y: -3,
			h: this.h,
			w: this.w,
			cls: 'bd-checkbox-check',
			tag: 'img',
			src: 'resources/images/form/checkmark.png',
			domTpl: { src: '{src}' }
		});
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
