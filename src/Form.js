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
    h: 25,
    w: 96,
	cls: 'wv-button',
    tag: 'div',
    text: 'Button',
    type: 'button',
	style: {
        borderBottomColor: '#E7E7E7',
		borderLeftColor: '#C8C8C8',
		borderRadius: '2px',
		borderRightColor: '#E7E7E7',
		borderStyle: 'solid',				
        borderTopColor: '#C8C8C8',
		borderWidth: '1px',
		cursor: 'default'
	},
	constructor: function(config)
    {
        WV.Button.superclass.constructor.call(this, config);

		// Border
		this.addSubView({
            x: 1,
            y: 1,
            h: this.h - 2,
            w: this.w - 2,
            autoResizeMask: WV.RESIZE_WIDTH_FLEX,
			cls: 'wv-button-border',
            tag: 'div',
			style: {
		        borderBottomColor: '#7E7E7E',
				borderLeftColor: '#939393',
				borderRadius: '2px',
				borderRightColor: '#939393',
				borderStyle: 'solid',				
		        borderTopColor: '#ABABAB',
				borderWidth: '1px'
			}			
        });

		// Inner Border
		this.addSubView({
            x: 2,
            y: 2,
            h: this.h - 4,
            w: this.w - 4,
            autoResizeMask: WV.RESIZE_WIDTH_FLEX,
			cls: 'wv-button-border-inner',
            tag: 'input',
            type: this.type,
            domTpl: { type: '{type}', name: '{name}', value: '{text}' },
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

		// Label
		new WV.Label({
            superView: this,
            autoResizeMask: WV.RESIZE_NONE,
			x: 3,
			y: 3,
			h: this.h - 6,
			w: this.w - 6,
			text: this.text,
			style: {
				fontFamily: 'Verdana',
				fontSize: '11px',
				fontWeight: 'normal',
				lineHeight: ( this.h - 6 ) + 'px',
			    textAlign: 'center',
			}
        });
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

        // TODO: tabIndex
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

WV.Label = WV.extend(WV.View, {
    h: 18,
    w: 38,
	cls: 'wv-label',
    tag: 'div',
    text: 'Label',
    domTpl: { html: '{text}', type: '{type}', name: '{name}' },
	style: {
        color: '#000',
        fontFamily: 'Verdana',
		fontSize: '11px',
		fontWeight: 'normal'
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
		
		// Label
		new WV.Label({
            superView: this,
            autoResizeMask: WV.RESIZE_NONE,
            x: 18,
            y: -1,
            w: 100,
            text: this.text
        });
    }
});

WV.RadioButton = WV.extend(WV.View, {
    h: 14,
    w: 14,
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
		
		if ( this.checked ) {
			this.style.backgroundPosition = '0 -14px';
		}
		
		// Label
		new WV.Label({
            superView: this,
            autoResizeMask: WV.RESIZE_NONE,
            x: 18,
            y: 0,
            w: 100,
            text: this.text
        });
    }
});
