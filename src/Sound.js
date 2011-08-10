WV.Sound = (function() {

    var soundEl,
        tpl = WV.createTemplate({
                tag: 'embed',
                src: '{0}',
                loop: '{1}',
                volume: 50,
                autostart: true,
                hidden: true
            });

    return {
        play: function(src, repeat)
        {
            if (soundEl)
            {
                soundEl.remove();
            }
            soundEl = tpl.append(Ext.getBody(), [src, repeat === true], true);
        }
    }
})();