
WV.Control = WV.extend(WV.View, {
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
        if (!this.subviews.input)
        {
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

        if (this.readOnly) { this.resignFirstResponder(); }

        return this;
    },
    setEnabled: function(enabled)
    {
        WV.Control.superclass.setEnabled.call(this, enabled);

        this.enabled ? this.setReadOnly(this.hasOwnProperty('readOnly') ? this.readOnly : false) :
                       this.setReadOnly(true);
        return this;
    },
    doAction: function()
    {
        WV.debug('Action: ', this.id, '(name/value): ', this.name, ':', this.getValue());
        this.target = this.target || this;
        if (typeof this.action === 'function')
        {
            this.action.call(this.target, this);
            return true;
        }
        if (typeof this.action === 'string')
        {
            this.target[this.action](this);
            return true;
        }
        return false;
    },
    getValue: function()
    {
        return this[this.valuePropName];
    },
    setValue: function(val)
    {
        if (this.readOnly === true) { return this; }

        this[this.valuePropName] = (val !== undefined && val !== null) ? val : '';

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

        if (result === true)
        {
            this.removeState('focus');
        }
        return result;
    }
});

WV.style.Button = WV.extend(WV.StyleMap, {
  defaults: {
    font: '11px verdana',
    cornerRadius: 2,
    color: '#D8D8D8',
    borderColor: '#C8C8C8',
    borderWidth: 1 },
  states: [{
    name: 'normal',
    styles: {
      borderColor: '#939393' }
  },{
    name: 'active',
    styles: {
      color: '#D2D4D7',
      image: {
        src: 'resources/images/form/shadow-x.png',
        useNaturalHeight: true
      },
      cornerRadius: 0,
      borderColor: '#5C5C5C' }
  },{
    name: 'focus',
    styles: {
      cornerRadius: 5 }
  }]
});

WV.Button = WV.extend(WV.Control, {
    vtype: 'button',
    h: 25,
    w: 96,
    text: '',
    clipToBounds: true,
    styleMap: new WV.style.Button(),
    constructor: function(config)
    {
      WV.Button.superclass.constructor.call(this, config);

      this.setText(this.text || '');

      return this;
    },
    draw: function(ctx, rect)
    {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = this.style.font;
      ctx.fillStyle = this.style.textColor || 'black';

      ctx.fillText(this.text, this.w/2, this.h/2);
    },
    setText: function(text)
    {
      text = text || '';
      this.text = text.replace(/\n|\t/g, '');
      this._textMetrics = WV.Text.measure(this.style.font, this.text);

      this.setNeedsDisplay();
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
    clipToBounds: false,
    selected: false,
    selectedValue: true,
    unselectedValue: false,
    constructor: function(config)
    {
        // We need to have a value before the superclass constructor runs because it needs it to call setValue()
        this.value = (config.selected || this.selected) ? (config.selectedValue || this.selectedValue)
                                                        : (config.unselectedValue || this.unselectedValue);
        WV.ToggleButton.superclass.constructor.call(this, config);
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
    defaults: {
        cursor: 'default'
    },
    focusborder: {
        states: [{
            name: 'focus',
            styles: {
                borderColor: '#4D78A4',
                borderWidth: '2px',
                cornerRadius: '2px',
                borderStyle: 'solid' }
        }]
    },
    outerborder: {
        defaults: {
            borderBottomColor: '#7E7E7E',
            borderLeftColor: '#939393',
            cornerRadius: '2px',
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
                cornerRadius: '0px' }
        }]
    },
    innerborder: {
        defaults: {
            backgroundColor: '#F9F9F9',
            borderBottomColor: '#D1D1D1',
            borderLeftColor: '#EDEDED',
            cornerRadius: '2px',
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
                cornerRadius: '0px' }
        }]
    },
    checkImage: {
        defaults: {
            display: 'block',
            visibility: 'hidden'
        },
        states: [{
            name: 'normal',
            styles: {
                marginLeft: '0px',
                marginTop: '0px'
            }
        }, {
            name: 'active',
            styles: {
                marginLeft: '1px',
                marginTop: '1px'
            }
        }, {
            name: 'selected',
            styles: {
                visibility: 'visible'
            }
        }]
    }
});

WV.CheckBox = WV.extend(WV.ToggleButton, {
    vtype: 'checkbox',
    h: 14,
    w: 14,
    clipToBounds: false,
    text: 'Check',
    styleMap: new WV.style.CheckBox(),
    subviews: [{
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
        x: 4,
        y: -1,
        w: 11,
        h: 7,
        stateful: true,
        src: 'resources/images/form/checkmark.png',
        autoResizeMask: WV.RESIZE_NONE
    }]
});

WV.style.RadioButton = WV.extend(WV.StyleMap, {
    defaults: {
        cursor: 'default'
    },
    focusborder: {
        states: [{
            name: 'focus',
            styles: {
                borderColor: '#4D78A4',
                cornerRadius: '10px',
                borderStyle: 'solid',
                borderWidth: '2px'
            }
        },{
            name: 'selected',
            styles: {
                marginTop: '1px'
            }
        }]
    },
    button: {
        defaults: {
            backgroundImage: 'url(resources/images/form/radio.png)',
            backgroundPosition: '0px 0px',
            backgroundRepeat: 'no-repeat'
        },
        states: [{
            name: 'normal',
            styles: {
                marginTop: '0px'
            }
        },{
            name: 'selected',
            styles: {
                backgroundPosition: '0px -13px',
                marginTop: '1px'
            }
        },{
            name: 'active',
            styles: {
                backgroundPosition: '0px -13px',
                marginTop: '1px'
            }
        }]
    }
});

WV.RadioButton = WV.extend(WV.ToggleButton, {
    vtype: 'radiobutton',
    h: 14,
    w: 13,
    cls: 'wv-radiobutton',
    text: 'Radio',
    unselectedValue: null,
    styleMap: new WV.style.RadioButton(),
    subviews: [{
        vtag: 'button',
        x: 0,
        y: 'center',
        h: 13,
        w: 13,
        stateful: true,
        autoResizeMask: WV.RESIZE_RIGHT_FLEX
    },{
        vtag: 'focusborder',
        h: 13,
        w: 13,
        y: 'center',
        stateful: true,
        autoResizeMask: WV.RESIZE_RIGHT_FLEX
    },{
        vtag: 'label',
        vtype: 'label',
        x: 16,
        y: 'center',
        h: 13,
        w: this.w,
        autoResizeMask: WV.RESIZE_RIGHT_FLEX
    }],
    setSelected: function(val)
    {
        var sv = this.superView;

        if (sv instanceof WV.RadioGroup)
        {
            if (val === true)
            {
                var prevSelection = sv.selection;
                sv.selection = this;

                if (!this.selected && prevSelection && prevSelection !== this)
                {
                    prevSelection.setSelected(false);
                }
                WV.RadioButton.superclass.setSelected.call(this, val);
            }
            else if (sv.selection !== this)
            {
                 WV.RadioButton.superclass.setSelected.call(this, val);
            }
        }
        else { WV.RadioButton.superclass.setSelected.call(this, val); }
    }
});

WV.Matrix = WV.extend(WV.View, {
    vtype: 'matrix',
    cls: 'wv-matrix',
    clipToBounds: true,
    cellData: null,
    cellVType: 'view',
    constructor: function(config)
    {
        WV.Matrix.superclass.constructor.call(this, config);

        // If we have cellData then ignore row and column configs
        if (this.cellData)
        {
            this.rows = this.cellData.length;
            this.columns = 0;
        }
        if (!this.rows)
        {
            throw new Error('Invalid config, need rows and columns or cellData');
        }
        this.cells = new Array(this.rows);

        // Find the row with the most columns if necessary and then init all the arrays.
        // We need the largest column size to compute cellWidth
        for (var r = 0; r < this.rows; r++)
        {
            this.cells[r] = new Array((this.cellData && this.cellData[r]) ? this.cellData[r].length : this.columns);
            this.columns = Math.max(this.columns, this.cells[r].length);
        }

        // Allow the user to specify cell height and width. Adjust the Matrix size to fit.
        // This will make it easy to use in a ScrollView, which is a common use case.
        if (this.cellWidth)
        {
            this.setWidth(this.columns * this.cellWidth);
        }
        else
        {
            this.cellWidth = this.w / this.columns;
        }
        if (this.cellHeight)
        {
            this.setHeight(this.rows * this.cellHeight);
        }
        else
        {
            this.cellHeight = this.h / this.rows;
        }

        for (r = 0; r < this.rows; r++)
        {
            for (var c = 0, l = this.cells[r].length; c < l; c++)
            {
                this.cells[r][c] = this.createCellForPosition(r,c);
                this.initCell(this.cells[r][c], r, c);
                this.addSubview(this.cells[r][c]);
            }
        }
    },
    createCellForPosition: function(row, column)
    {
        var cell = this.cellData &&
                   typeof this.cellData[row][column] === 'object' ? WV.apply({}, this.cellData[row][column]) : {};

        WV.apply(cell, {
            autoResizeMask: WV.RESIZE_ALL,
            x: this.cellWidth * column,
            y: this.cellHeight * row,
            h: this.cellHeight,
            w: this.cellWidth
        });

        return WV.create(this.cellVType || 'view', cell);
    },
    initCell: function(cell, row, column) {}
});

WV.RadioGroup = WV.extend(WV.Matrix, {
    vtype: 'radiogroup',
    cls: 'wv-radiogroup',
    name: null,
    selection: null,
    cellVType: 'radiobutton',
    initCell: function(cell, row, column)
    {
        var data = this.cellData ? this.cellData[row][column] : '';

        cell.subviews.input.name = cell.name || this.name;

        if (typeof data === 'string')
        {
            cell.subviews.label.text = data;
        }

        // Ensure that the first 'selected' item encountered is the only selected item
        if (cell.selected)
        {
            if (!this.selection)
            {
                this.selection = cell;
            }
            else
            {
                cell.setSelected(false);
            }
        }
    }
});

WV.style.ListViewItem = WV.extend(WV.StyleMap, {
    defaults: {
        borderBottomColor: '#E7E7E7',
        borderLeftColor: '#C8C8C8',
        cornerRadius: '2px',
        borderRightColor: '#E7E7E7',
        borderStyle: 'solid',
        borderTopColor: '#C8C8C8',
        borderWidth: '1px',
        cursor: 'pointer' },
    states: [{
        name: 'focus',
        styles: {
            borderBottomColor: '#4D78A4',
            borderLeftColor: '#4D78A4',
            borderRightColor: '#4D78A4',
            borderTopColor: '#4D78A4',
            borderWidth: '2px'  }
    }],
    innerborder: {
        defaults: {
            cornerRadius: '2px',
            borderStyle: 'solid',
            borderWidth: '1px'
        },
        states: [{
            name: 'normal',
            styles: {
                backgroundColor: '#FFFFFF',
                borderColor: '#D1D1D1' }
        },{
            name: 'selected',
            styles: {
                backgroundColor: 'transparent',
                backgroundImage: 'url(resources/images/form/shadow-y.png)',
                backgroundRepeat: 'repeat-y',
                borderBottomColor: '#A7A9AB',
                borderLeftColor: '#666',
                cornerRadius: '0px',
                borderRightColor: 'transparent',
                borderTopColor: '#777' }
        },{
            name: 'focus',
            styles: {
                cornerRadius: '0px' }
        }]
    },
    label: {
        defaults: {
            fontFamily: 'Verdana',
            fontSize: '11px',
            fontWeight: 'normal',
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

WV.ListViewItem = WV.extend(WV.ToggleButton, {
    vtype: 'listviewitem',
    cls: 'wv-listviewitem',
    unselectedValue: null,
    text: 'Item',
    styleMap: new WV.style.ListViewItem(),
    subviews: [{
        vtag: 'innerborder',
        x: 0,
        y: 0,
        h: 'h',
        w: 'w',
        stateful: true,
        autoResizeMask: WV.RESIZE_WIDTH_FLEX
    },{
        vtag: 'label',
        vtype: 'label',
        draggable: false,
        x: 3,
        y: 'center',
        h: 13,
        w: 'w - 6',
        stateful: true,
        autoResizeMask: WV.RESIZE_WIDTH_FLEX
    }],
    constructor: function(config)
    {
        if (typeof config === 'string')
        {
            config = { text: config }
        }
        else
        {
            config = config || {};
            config.text = config.text || this.text;
        }
        config.selectedValue = config.selectedValue || config.text;

        WV.ListViewItem.superclass.constructor.call(this, config);
    },
    setSelected: function(val)
    {
        var sv = this.superView,
            i, l;

        WV.ListViewItem.superclass.setSelected.call(this, val);

        if (sv instanceof WV.ListView)
        {
            if (val === true)
            {
                if (!sv.multipleSelect)
                {
                    for (i = 0, l = sv.selection.length; i < l; i++)
                    {
                        sv.selection[i].setSelected(false);
                    }
                    sv.selection = [this];
                }
            }
            if (sv.multipleSelect)
            {
                sv.selection = [];
                for (i = 0, l = sv.cells.length; i < l; i++)
                {
                    if (sv.cells[i][0].selected)
                    {
                        sv.selection.push(sv.cells[i][0]);
                    }
                }
            }
        }
    }
});

WV.ListView = WV.extend(WV.Matrix, {
    vtype: 'listview',
    cls: 'wv-listview',
    w: 50,
    cellHeight: 15,
    name: null,
    selection: null,
    cellVType: 'listviewitem',
    multipleSelect:  true,
    itemTextAlign: 'center',
    items: [],
    constructor: function(config)
    {
        var i, l,
           itemClassStyleMap,
           align;

        if (!config || !config.items)
        {
            throw new Error('WV.ListView needs a configured "items" array');
        }
        // Turn the 'items' into the cellData required by WV.Matrix as a convenience
        config.cellData = [];
        for (i = 0, l = config.items.length; i < l; i++ )
        {
            config.cellData[i] = [typeof config.items[i] === 'string' ? { text: config.items[i] } : config.items[i]];
        }

        this.selection = [];

        // Override the WV.StyleMap default label text alignment of this ListView's cell class for further convenience
        itemClassStyleMap = WV.classForVType(this.cellVType).prototype.styleMap;
        align = config.itemTextAlign || this.itemTextAlign;

        if (align !== itemClassStyleMap.label.defaults.textAlign)
        {
            itemClassStyleMap.overrideStyles({ 'label.defaults.textAlign': align });
        }

        WV.ListView.superclass.constructor.call(this, config);
    },
    initCell: function(cell, row, column)
    {
        cell.subviews.input.name = cell.name || this.name;

        // Ensure that the first 'selected' item encountered is the only selected item unless multipleSelect is true
        if (cell.selected)
        {
            if (!this.selection.length || this.multipleSelect)
            {
                this.selection.push(cell);
            }
            else
            {
                cell.setSelected(false);
            }
        }
    },
    setSelected: function(index, selected)
    {
        if (WV.isArray(index))
        {
            for (var i = 0, l = index.length; i < l; i++)
            {
                this.setSelected(index[i], selected);
            }
        }
        else { this.cells[index][0].setSelected(selected); }
    },
    clearSelection: function()
    {
        while (this.selection.length)
        {
            this.selection[0].setSelected(false);
        }
    }
});

WV.style.TextComponent = WV.extend(WV.StyleMap, {
    defaults: {
        backgroundImage: 'url(resources/images/form/inset.png)',
        cornerRadius: '2px'
    },
    border: {
        defaults: {
            backgroundColor: '#F9F9F9',
            borderColor: '#999',
            cornerRadius: '2px',
            borderStyle: 'solid',
            borderWidth: '1px'
        },
        states: [{
            name: 'focus',
            styles: {
                borderColor: '#4D78A4',
                borderWidth: '2px',
                borderStyle: 'solid'
            }
        }]
    },
    input: {
        defaults: {
            backgroundColor: 'transparent',
            border: '1px solid transparent',
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

WV.style.TextField = WV.extend(WV.StyleMap, {
  defaults: {
    color: 'white',
    font: '14px Helvetica',
    cornerRadius: 2,
    cursor: 'text'
  },
  states: [{
    name: 'focus',
    styles: {
      borderColor: '#4D78A4',
      borderWidth: 1 }
  }]
});


WV.TextField = WV.extend(WV.Control, {
  vtype: 'textfield',
  tpl: WV.createTemplate('<textarea id="{id}" rows="1" wrap="off" style="position:absolute; left:{x}px; top:{y}px; width:{w}px; height:{h}px; display:none; overflow-x:{overflowX}; overflow-y:hidden; clip:rect(0px auto {clipHeight}px 0px); white-space:nowrap; background-color:transparent; color:transparent; margin-left:{leftMargin}px; padding-left:{horizontalInsets}px; padding-right:{horizontalInsets}px; border-style:none; resize:none; font:{font}">{text}</textarea>'),
  h: 30,
  w: 100,
  clipToBounds: true,
  styleMap: new WV.style.TextField(),
  horizontalInsets: 5,
  constructor: function(config)
  {
    config = config || {};

    WV.Text.superclass.constructor.call(this, config);

    this.setText(this.text || '');
    this.initDom();

    return this;
  },
  initDom: function()
  {
    if (!this.dom && document)
    {
      var data = Object.create(this),
          dom,
          domFrame = this.computeDomFrame(),
          self = this;

      WV.apply(data, domFrame);
      data.font = this.style.font;
      data.clipHeight = domFrame.h - 20; // Clip out the scrollbar
      data.overflowX = Ext.isGecko ? 'scroll' : 'hidden';
      data.leftMargin = WV.isiOS ? -3 : 0;
      dom = this.dom = this.tpl.append(Ext.getBody(), data, true).dom;
      dom.setAttribute('_textOverlay', 'true'); // Let others know what we are doing with this
      // TODO: Handle paste
      dom.onscroll = function() {
        self.setNeedsDisplay();
      };
      dom.onblur = function() {
        if (self.isFirstResponder)
        {
          setTimeout(function() {
            dom.focus(); // The textarea always needs to have the focus while we are firstResponder
          }, 0);
        }
      };
      dom.onfocus = function() {
        if (self.window.isFullScreen) {
          window.scrollTo(0,0); // Prevent the browser from scrolling the document to the text field
        }
      };
    }
  },
  computeDomFrame: function()
  {
    var domFrame = this.convertRectToView(),
        canvasRect,
        textHeight = this._textMetrics.h;

      canvasRect = this.window ? this.window.canvas.getBoundingClientRect() : { left: 0, top: 0};
      domFrame.y = domFrame.y + domFrame.h / 2 - textHeight/ 2 + canvasRect.top;
      domFrame.h = textHeight + 20; // Add 20px for the scrollbars, which will be clipped out
      domFrame.w = domFrame.w - this.horizontalInsets * 2;

    return domFrame;
  },
  setFrame: function(frame)
  {
    WV.Text.superclass.setFrame.call(this, frame);
    if (this.dom)
    {
      var domFrame = this.computeDomFrame(),
          st = this.dom.style;

      st.left = domFrame.x + 'px';
      st.top = domFrame.y + 'px';
      st.width = domFrame.w + 'px';
      st.height = domFrame.h + 'px';

      // We need to adjust the the clipping region of the textarea overlay to hide the scrollbars. FF forces us to do this
      // because it will not scroll a single-line textarea with overflow:hidden like the other browsers do.
      this.dom.style.clip = 'rect(0px auto ' + (domFrame.h - 20)  + 'px 0px)';
    }
    return this;
  },
  draw: function(ctx, rect)
  {
    var font = this.style.font,
        height = this._textMetrics.h,
        startX = this.horizontalInsets;

    ctx.font = font;
    ctx.fillStyle = this.style.textColor || 'black';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'start';

    if (this.dom)
    {
      // Compensate for any horizontal scrolling that may be present in the overlay
      startX -= this.dom.scrollLeft;
    }

    // Clip to the horizontal insets
    ctx.beginPath();
    ctx.rect(this.horizontalInsets, 0, this.w - this.horizontalInsets * 2, this.h);
    ctx.clip();

    ctx.fillText(this.text || '', startX, (this.h / 2) - (height / 2)); // Draw the text vertically centered in the view
  },
  setStyle: function(name, value)
  {
    WV.Text.superclass.setStyle.call(this, name, value);
    if (this.dom)
    {
      if (name === 'font')
      {
        this.dom.style.font = value;
        this._textMetrics = WV.Text.measure(value, this.text);
        // TODO: Need to reposition overlay due to potential change in text size
      }
    }
    return this;
  },
  setText: function(text)
  {
    text = text || '';
    this.text = text.replace(/\n|\t/g, '');
    this._textMetrics = WV.Text.measure(this.style.font, this.text);

    if (this.dom && (this.dom.value !== text))
    {
      this.dom.value = this.text;
    }
    this.setNeedsDisplay();
  },
  selectedText: function()
  {
    if (this.dom)
    {
      return this.dom.value.substring(this.dom.selectionStart, this.dom.selectionEnd);
    }
    else
    {
      return '';
    }
  },
  updateInsertion: function(show)
  {
    if (WV.isMobile) { return; } // Mobile browsers add their own cursors

    if (!this._insertion)
    {
      this._insertion = new WV.View({
          w: 1,
          h: this._textMetrics.h * 1.15,
          style: { color: Ext.isIE ? 'transparent' : this.style.textColor || 'black' } // Cursor always shows on IE so use it and make ours transparent
      });
      this.addSubview(this._insertion);
    }
    if (this.dom)
    {
      if (!show || this.selectedText().length)
      {
        clearTimeout(this._blinkRef); // Cancel blinking
        this._insertion.setHidden(true);
      }
      else
      {
        var self = this;
        // Do this on the next pass through the event loop so that the selectionStart is correct
        window.requestAnimationFrame(function() {
          var textToMeasure = self.text.substring(0, self.dom.selectionStart).replace(/ /g, '&nbsp;'), // We need to measure leading and trailing whitespace
              textWidth = WV.Text.measure(self.style.font, textToMeasure).w;

          self._insertion.setOrigin(textWidth + self.horizontalInsets -self.dom.scrollLeft,
                                    self.h / 2 - self._insertion.h / 2);
          self._insertion.setHidden(false);
          self._insertion.setNeedsDisplay();
          self.blinkInsertion(false, 100);
        }, this.window.canvas);
      }
    }
  },
  blinkInsertion: function(on, wait)
  {
    var self = this;

    clearTimeout(this._blinkRef);
    this._blinkRef = setTimeout(function() {
      self._insertion.setHidden(on);
      self.blinkInsertion(!on);
    }, wait || 500);
  },
  setReadOnly: function(ro)
  {
    WV.TextField.superclass.setReadOnly.call(this, ro);

    if (this.dom && this.enabled)
    {
      this.dom.setStyle('cursor', this.readOnly ? 'default' : 'text');
      this.dom.setAttribute('autocomplete', this.readOnly ? 'off' : null);
    }
    return this;
  },
  select: function()
  {
    this.becomeFirstResponder();
    return this;
  },
  touchesBegan:function(touches, e)
  {
    if (this.enabled && !this.readOnly && !this.isFirstResponder)
    {
      this.becomeFirstResponder(true);
    }
    return WV.TextField.superclass.touchesBegan.call(this, touches, e);
  },
  mouseDown: function(e)
  {
    if (this.enabled && !this.readOnly)
    {
      if (this.isFirstResponder)
      {
        this.updateInsertion(!this.selectedText().length);
      }
      else
      {
        this.becomeFirstResponder(true);
      }
    }
    return WV.TextField.superclass.mouseDown.call(this, e);
  },
  mouseMove: function(e)
  {
    if (this.enabled && !this.readOnly)
    {
      if (this.dom)
      {
        this.dom.style.display = '';
      }
    }
    return WV.TextField.superclass.mouseMove.call(this, e);
  },
  mouseExited: function(e)
  {
    if (!this.isFirstResponder && this.dom)
    {
      this.dom.style.display = 'none';
    }
    return WV.TextField.superclass.mouseExited.call(this, e);
  },
  mouseDragged: function(e)
  {
    this.updateInsertion(false);
    return WV.TextField.superclass.mouseDragged.call(this, e);
  },
  keyDown: function(e)
  {
    var self = this;

    if (e.keyCode !== 9) // Skip tab keys, responder chain will handle it
    {
      setTimeout(function() {  // Dom value will change on next trip through event loop
        self.setText(self.dom.value);
        self.updateInsertion(true);
      }, 0);
    }

    return WV.TextField.superclass.keyDown.call(this, e);
  },
  becomeFirstResponder: function(preventSelect)
  {
    var result = WV.TextField.superclass.becomeFirstResponder.call(this),
        dom = this.dom;

    if (result === true)
    {
      if (dom && !this.isHiddenOrHasHiddenAncestor())
      {
        dom.style.display = '';
        // Needs to be deferred to next pass through event loop because we need to wait after clearing 'display=none' to focus
        setTimeout(function() {
          preventSelect ? dom.focus() : dom.select();
        }, 0);

        this.updateInsertion(preventSelect);
      }
    }
    return result;
  },
  resignFirstResponder: function()
  {
    var result = WV.TextField.superclass.resignFirstResponder.call(this);

    if (result === true)
    {
      if (this.dom && !this.isHiddenOrHasHiddenAncestor())
      {
        this.dom.blur();
        this.dom.style.display = 'none';
        this.updateInsertion(false);
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
    subviews: [
        WV.TextField.prototype.subviews[0],
    {
        vtag: 'input',
        tag: 'textarea',
        stateful: true,
        domTpl: { html: '{value}', name: '{name}' }
    }],
    setValue: function(val)
    {
        WV.TextArea.superclass.setValue.call(this, val);
        // Make the innerHTML consistent with the new value
        if (this.rendered)
        {
            this.subviews.input.dom.innerHTML = this[this.valuePropName];
        }
        return this;
    }
});
