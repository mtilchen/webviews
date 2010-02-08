/**
 * Additions to base ECMA standard objects
 */

(function() {

    function pad(n){ return n < 10 ? '0' + n : n; };

    var isoDateTpl = new Ext.Template('{0}-{1}-{2}T{3}:{4}:{5}Z', { compiled: true });
    var logDateTpl = new Ext.Template('{0}-{1}-{2} {3}:{4}:{5},{6}', { compiled: true });

    Date.prototype.toISOString = function()
    {
        return isoDateTpl.apply([
            this.getUTCFullYear(),
            pad(this.getUTCMonth() + 1),
            pad(this.getUTCDate()),
            pad(this.getUTCHours()),
            pad(this.getUTCMinutes()),
            pad(this.getUTCSeconds())
        ]);
    };

    Date.prototype.toLogString = function()
    {
        return logDateTpl.apply([
            this.getFullYear(),
            pad(this.getMonth() + 1),
            pad(this.getDate()),
            pad(this.getHours()),
            pad(this.getMinutes()),
            pad(this.getSeconds()),
            pad(this.getMilliseconds())
        ]);
    };
})();