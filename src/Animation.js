
(function() {

    var SEC_MS = 1000,
        FPS = 35,
        UNIT_RE = /(^-?(\d+)(.\d*)?)(px|deg)/,
        COLOR_RE = /^#((\d|[A-F]){6})/i,
        animIdSeed = 0,
        activeViews = {},
        uncommittedAnimations = [],
        isAnimating;

    function commitAnimations()
    {
        var anim,
            startTime = WV.now(), // Start all the new animations together
            i, l;

        for (i = 0, l = uncommittedAnimations.length; i < l; i++)
        {
            anim = uncommittedAnimations[i];
            anim.lastFrame = -1;
            anim.totalFrames = Math.ceil(FPS * anim.duration);
            anim.drawnFrames = 0;
            if (anim.delay) {
              anim.startTime = startTime + ((parseFloat(anim.delay) * SEC_MS) || 0);
              delete anim.delay;
            }
            else {
              anim.startTime = startTime;
            }

            anim.running = false;
            anim.cancelled = false;
            activeViews[anim.owner.id] = anim.owner;
        }
        uncommittedAnimations = [];

        if (l && !isAnimating)
        {
          isAnimating = true;
          runAnimations();
        }
    }

    function runAnimations()
    {
      var anim,
          animId,
          view,
          dirty,
          shortestDelay = Infinity,
          delay,
          newVal,
          reRun,
          now = WV.now(),
          futureAnimTask = null;

      for (var viewId in activeViews)
      {
          view = activeViews[viewId];
          dirty = false;
          for (animId in view.animations)
          {
              reRun = false;
              anim = view.animations[animId];

              if (anim.cancelled)
              {
                  delete view.animations[animId];
                  view._animCount--;
              }

              else if (!anim.running)
              {
                  delay = anim.startTime - now;
                  if (delay <= 0)
                  {
                      anim.running = true;
                      if (typeof anim.onStart === 'function')
                      {
                          anim.onStart.call(anim.scope || view, anim, view);
                      }
                  }
                  // Start the animation loop later when this animation needs to start
                  else
                  {
                      if (delay < shortestDelay)
                      {
                          shortestDelay = delay;
                      }
                      clearTimeout(futureAnimTask);
                      futureAnimTask = setTimeout(function() {
                        if (!isAnimating) {
                          requestAnimationFrame(runAnimations);
                        }
                      }, shortestDelay);
                  }
              }
              else
              {
                  // Compute the current frame and only draw it if we need to
                  anim.currentFrame = Math.min(((now - anim.startTime) / SEC_MS * FPS), anim.totalFrames);
                  if ((anim.currentFrame > anim.lastFrame) && (anim.currentFrame <= anim.totalFrames))
                  {
                      dirty = true;
                      anim.lastFrame = anim.currentFrame;

                      if (anim.isColor) // We need to ease r, g and b independently
                      {
                          newVal = [];
                          for (var i = 0; i < 3; i++)
                          {
                              newVal[i] = anim.easing(anim.currentFrame,
                                           anim.from[i], anim.to[i] - anim.from[i],
                                           anim.totalFrames);
                          }
                          newVal = '#' + WV.decToHexString(newVal[0], newVal[1], newVal[2]);
                      }
                      else
                      {
                          newVal = anim.easing(anim.currentFrame,
                                           anim.from, anim.to - anim.from,
                                           anim.totalFrames);
                      }
                      if (anim.units)
                      {
                          newVal = newVal + anim.units;
                      }
                      if (anim.target === view.style)
                      {
                          view.setStyle(anim.key, newVal);
                      }
                      else if (typeof anim.setterFn === 'function')
                      {
                          anim.setterFn.call(anim.target, newVal);
                      }
                      else
                      {
                          anim.target[anim.key] = newVal;
                      }
                      anim.drawnFrames++;
                  }
                  // We're done
                  if (anim.currentFrame >= anim.totalFrames)
                  {
                      var realDuration = now - anim.startTime,
                          stats = {
                              duration: realDuration,
                              frames: anim.drawnFrames,
                              fps:  Math.round(anim.drawnFrames / realDuration * SEC_MS) };

                      anim.running = false;
                      if (typeof anim.onComplete === 'function')
                      {
                          anim.onComplete.call(anim.scope || view, anim, view, stats);
                      }
                      if (anim.autoReverse)
                      {
                          var tmp = anim.from;
                              anim.from = anim.to;
                              anim.to = tmp;
                          if (anim.reversed !== true)
                          {
                              anim.reversed = true;
                              reRun = true;
                              uncommittedAnimations.push(anim);
                          }
                          else
                          {
                              anim.reversed = false;
                          }
                      }

                      if (anim.repeatCount > 0 && anim.reversed !== true)
                      {
                          anim.repeatCount--;
                          reRun = true;
                          uncommittedAnimations.push(anim);
                      }

                      if (!reRun)
                      {
                          delete view.animations[animId];
                          view._animCount--;
                      }
                  }
              }
          }

          if (view._animCount === 0) // Remember that onComplete functions may add more animations
          {
              delete view._animCount;
              delete activeViews[viewId];
          }
      }

      if (!viewId) // We are done animating all the views.
      {
        isAnimating = false;
        requestAnimationFrame(commitAnimations);
      }
      else
      {
        commitAnimations();
        requestAnimationFrame(runAnimations);
      }
    }

    WV.Animation = WV.extend(Object, {
        startTime: null,
        duration: 1,
        easing: Ext.lib.Easing.easeNone,
        currentFrame: 0,
        totalFrames: FPS,
        drawnFames: 0,
        constructor: function(config)
        {
            WV.apply(this, config);

            this.id = this.id || 'anim-' + animIdSeed++;

            // Find easing functions by name
            if (typeof this.easing === 'string') {
              if (Ext.lib.Easing[this.easing]) {
                this.easing = Ext.lib.Easing[this.easing];
              }
              else {
                throw 'Invalid easing function: ' + this.easing;
              }
            }

            var target = config.owner,
                key,
                unitMatches,
                path = this.path.split('.'),
                i, l;

            // Walk the property path and find the penulimate entry. This is the target.
            // If the key path is of length 1 then the target is the animation's owner-view.
            // The target will be the object whose property is being changed in the animation.
            // The ultimate entry is the property of the target object that is being changed.
            // This is the key.
            for (i = 0, l = path.length; i < (l - 1); i++)
            {
                target = target[path[i]];
            }
            key = path[l - 1];

            // If 'from' is not specified, try to pick it up from the current value
            this.from = this.hasOwnProperty('from') ? this.from : target[key];

            if (typeof this.from === 'number')
            {
                this.to = parseFloat(this.to);
                if (isNaN(this.to)) { throw new Error('Invalid "to" value'); }
                // -1 Means Infinity
                if (this.repeatCount === -1) {
                  this.repeatCount = Infinity;
                }
            }

            // Check to see if this property is using units
            // Makes sure we are using numbers as arg for easing functions
            else if (unitMatches = UNIT_RE.exec(this.from))
            {
                this.from = parseFloat(unitMatches[1]);
                this.units = unitMatches[4];
                this.to = parseFloat(this.to);
                if (isNaN(this.to)) { throw new Error('Invalid "to" value'); }
            }

            else if (COLOR_RE.test(this.from))
            {
                this.isColor = true;
                this.from = [parseInt(this.from.substr(1,2), 16), parseInt(this.from.substr(3,2), 16),
                             parseInt(this.from.substr(5,2), 16)];
                if (COLOR_RE.test(this.to))
                {
                    this.to = [parseInt(this.to.substr(1,2), 16), parseInt(this.to.substr(3,2), 16),
                               parseInt(this.to.substr(5,2), 16)];
                }
                else if (this.to instanceof WV.style.Color)
                {
                    this.to = [this.to.r, this.to.g, this.to.b];
                }
                else { throw new Error('"to" value is not a valid color'); }
            }
            else { throw new Error('Invalid "from" value'); }

            key = key === 'w' ? 'width' : key;
            key = key === 'h' ? 'height' : key;

            // Use a setter function to access the target if it is defined
            this.setterFn = target['set' + key.replace(/([a-z])/, key.charAt(0).toUpperCase())];
            this.target = target;
            this.key = key;
        }
    });

    WV.override(WV.View, {
        addAnimation: function(config, deferCommit)
        {
            if (WV.isArray(config))
            {
                for (var i = 0, l = config.length; i < l; i++)
                {
                    this.addAnimation(config[i], true);
                }
                requestAnimationFrame(commitAnimations);
            }
            else
            {
                var anim;
                config.owner = this;
                anim = config instanceof WV.Animation ? config : new WV.Animation(config);
                uncommittedAnimations.push(anim);
                this._animCount = this._animCount || 0;
                this._animCount += 1;
                this.animations[anim.id] = anim;

                if (deferCommit !== true)
                {
                    requestAnimationFrame(commitAnimations);
                }
            }
            return anim;
        },
        removeAllAnimations: function()
        {
          for (var animId in this.animations)
          {
              this.removeAnimation(this.animations[animId]);
          }
          return this;
        },
        removeAnimation: function(animation)
        {
            // The animation loop will pick this up and it will be removed properly
           this.animations[animation.id].cancelled = true;
          return this;
        }
    });

    // Takes an object with view ids as keys and values containing configs for WV.View.addAnimation
    // Also takes vararg version where args alternate between view reference and anim config (view, config, view, confg)
    WV.addAnimations = function(animations)
    {
        if (arguments.length >= 2 && (arguments.length % 2 === 0))
        {
            for (var i = 0, l = arguments.length; i < (l - 1); i += 2)
            {
                arguments[i].addAnimation(arguments[i + 1], true);
            }
        }
        else
        {
            for (var viewId in animations)
            {
                WV.get(viewId).addAnimation(animations[viewId], true);
            }
        }
        commitAnimations();
    };

    for (var easingFn in Ext.lib.Easing)
    {
        if (typeof Ext.lib.Easing[easingFn] === 'function')
        {
            WV.Animation[easingFn.toUpperCase()] = Ext.lib.Easing[easingFn];
        }
    }

})();