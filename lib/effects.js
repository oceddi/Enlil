/********************************************************************/
/* effects.js 
/* 
/* Exported Classes:
/*  Effects
/* 
/* 
/********************************************************************/
define(function(require) {
    var Sheets    = require('../lib/sheets');
    var Particles = require('../lib/particles');
    var Vertex    = require('../lib/vector');

    var effects = [];
    var effectID = 0;

    function RGBA (r, g, b, a) {
        return {
            R : r || 0,
            G : g || 0,
            B : b || 0,
            A : a || 0.5
        };
    }

    function alphaComposite(mv, ov, a) {
        return (mv * a) + (ov * (1 - a));
    }

    function multiplyValues(t, b) {
        return (t * b) / 255;
    }

    function multiplyImage(sheet, targetColor) {
        var canvas  = sheet.getCanvas();
        var ctx     = canvas.getContext('2d');
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels  = imgData.data;

        for (var i=0; i < pixels.length; i += 4)
        {
            var r = multiplyValues(targetColor.R, pixels[i]);
            var g = multiplyValues(targetColor.G, pixels[i+1]);
            var b = multiplyValues(targetColor.B, pixels[i+2]);

            pixels[i]   = alphaComposite(r, pixels[i],   targetColor.A);
            pixels[i+1] = alphaComposite(g, pixels[i+1], targetColor.A);
            pixels[i+2] = alphaComposite(b, pixels[i+2], targetColor.A);
        }

        ctx.putImageData(imgData, 0, 0);
    }

    /* Invert the color on the entire sheet, that way all animations are also inverted. */
    /* This is a single step operation. */
    /* params - sheet, copySheet, actor. */
    function invert() {
        var canvas  = this.parms[1].getCanvas();
        var ctx     = canvas.getContext('2d');
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels  = imgData.data;

        for (var i=0; i < pixels.length; i += 4)
        {
            pixels[i]   = 255 - pixels[i];
            pixels[i+1] = 255 - pixels[i+1];
            pixels[i+2] = 255 - pixels[i+2];
        }

        ctx.putImageData(imgData, 0, 0);        
    }

    /* GrayScale the colors on an entire sheet, that way all animations are also grayscaled. */
    /* This is a single step operation. */
    /* params - sheet, copySheet, actor. */
    function grayscale() {
        var canvas  = this.parms[1].getCanvas();
        var ctx     = canvas.getContext('2d');
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels  = imgData.data;
        var avg;

        for (var i=0; i < pixels.length; i += 4)
        {
            avg = (pixels[i] + pixels[i+1] + pixels[i+2])/3;

            pixels[i]   = avg;
            pixels[i+1] = avg;
            pixels[i+2] = avg;
        }

        ctx.putImageData(imgData, 0, 0);        
    }

    /* Emboss the colors on an entires sheet, that way all animations are also embossed. */
    /* This is a single step operation. */
    /* params - sheet, copySheet, actor. */
    function emboss() {
        var canvas  = this.parms[1].getCanvas();
        var ctx     = canvas.getContext('2d');
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels  = imgData.data;
        var width   = imgData.width;

        for (var i=0; i < pixels.length; i ++)
        {
            if(i <= pixels.length - width*4)
            {
                if((i+1) % 4 !==0) 
                {
                    if((i+4) % (width*4) === 0)
                    {
                        /* Last pixel in row, copy previous pixel. */
                        pixels[i]   = pixels[i-4];
                        pixels[i+1] = pixels[i-3];
                        pixels[i+2] = pixels[i-2];
                        pixels[i+3] = pixels[i-1];
                    }
                    else
                    {
                        pixels[i] = 128 + 2 * pixels[i] - pixels[i+4] - pixels[i+width*4];
                    }
                }
            }
            else // last row, copy one from above.
            {
                if((i+1) % 4 !==0)
                {
                    pixels[i] = pixels[i-width*4];
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);        
    }

    /* Fade to black the entire sheet.                                   */
    /* This can be done in one or more steps to create a gradual effect. */
    /* params - sheet, copySheet, actor. */
    function fadeOut() {
        var canvas   = this.parms[1].getCanvas();
        var ctx      = canvas.getContext('2d');
        var imgData  = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var origData = this.parms[0].getOriginalImgData();
        var pixels   = imgData.data;
        var n        = pixels.length;
        var alpha;
        var r;
        var g;
        var b;
        var current;
        var step;

        if(this.parms.steps === undefined)
            this.parms.steps = 1;

        for (var i=3; i < n; i+=4)
        {
            r     = origData.data[i-3];
            g     = origData.data[i-2];
            b     = origData.data[i-1];            
        	alpha = origData.data[i];

            if(alpha > 0 && pixels[i] > 0)
            {
            	current = pixels[i-3];
            	step = Math.ceil(r/this.parms.steps);

	            if((current - step) > 0)
                {
	            	pixels[i-3] -= step;
                }
	            else
                {
	            	pixels[i-3] = 0;
                }

                current = pixels[i-2];
                step = Math.ceil(g/this.parms.steps);

                if((current - step) > 0)
                {
                    pixels[i-2] -= step;
                }
                else
                {
                    pixels[i-2] = 0;
                }

                current = pixels[i-1];
                step = Math.ceil(b/this.parms.steps);

                if((current - step) > 0)
                {
                    pixels[i-1] -= step;
                }
                else
                {
                    pixels[i-1] = 0;
                }
        	}
        }

        ctx.putImageData(imgData, 0, 0);        
        
        this.parms[0].flushToDestination();
    }

    /* Fade from black to original colors on the entire sheet.           */
    /* This can be done in one or more steps to create a gradual effect. */
    /* params - sheet, copySheet, actor. */
    function fadeIn() {
        var canvas   = this.parms[1].getCanvas();
        var ctx      = canvas.getContext('2d');
        var imgData  = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var origData = this.parms[0].getOriginalImgData();
        var pixels   = imgData.data;
        var n        = pixels.length;
        var alpha;
        var r;
        var g;
        var b;
        var current;
        var step;

        if(this.parms.steps === undefined)
            this.parms.steps = 1;

        for (var i=3; i < n; i+=4)
        {
            r     = origData.data[i-3];
            g     = origData.data[i-2];
            b     = origData.data[i-1];            
            alpha = origData.data[i];

            if(alpha > 0 && pixels[i] > 0)
            {
                current = pixels[i-3];
                step = Math.ceil(r/this.parms.steps);

                if((current + step) < r)
                {
                    pixels[i-3] += step;
                }
                else
                {
                    pixels[i-3] = r;
                }

                current = pixels[i-2];
                step = Math.ceil(g/this.parms.steps);

                if((current + step) < g)
                {
                    pixels[i-2] += step;
                }
                else
                {
                    pixels[i-2] = g;
                }

                current = pixels[i-1];
                step = Math.ceil(b/this.parms.steps);

                if((current + step) < b)
                {
                    pixels[i-1] += step;
                }
                else
                {
                    pixels[i-1] = b;
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);        
        
        this.parms[0].flushToDestination();

    }

    /* Explode a single cell within the sheet. */
    /* params - sheet, particles, frame, actor. */
    function explode() {
        var self = this;
        var once = false;

        /* Override the create function. */
        self.parms[1].create = function (group, groupOffset) {
            if(once) return;
            var offset = self.parms[0].groups[group][0] + groupOffset;
            var sx = offset % self.parms[0].wcount;
            var sy = Math.floor(offset / self.parms[0].wcount);
            var imgData = self.parms[0].canvas.getContext('2d').getImageData(sx*self.parms[0].cwidth, sy*self.parms[0].cheight, self.parms[0].cwidth, self.parms[0].cheight);
            var pixels  = imgData.data;
 
            for(var i=0; i<pixels.length; i+=4) {
                var y = Math.floor((i/4) / (self.parms[0].cheight));
                var x = (i/4) - (y * (self.parms[0].cwidth));

                if(pixels[i+3] > 0) {

                    var hsl = Particles.rgb2hsl([pixels[i], pixels[i+1], pixels[i+2]]);

                    self.parms[1].particles.push(
                        {
                            parent: Particles,
                            x : (self.parms[1].width/2)-(self.parms[0].cwidth/2)+x,
                            y : (self.parms[1].height/2)-(self.parms[0].cheight/2)+y,
                            ax : Particles.frand(-1, 1),
                            ay : Particles.frand(-1, 1),
                            vx : 0,
                            vy : 0,
                            width : 1,
                            height : 1,
                            polys : [[0, 0], [1, 0], [1, 1], [0, 1]],
                            age : 0,
                            hue : hsl[0],
                            saturation : hsl[1],
                            lightness  : hsl[2],
                            alpha : 0.5,
                            dieoff : self.parms[1].dieoff
                        }
                    );
                }
            }
            once = true;
        };

        self.parms[2].lm.setLayerDrawState(2, true);
    }


    /* Particle effect where it looks like something is on fire! */
    /* Params should be placed in self.params                    */
    /*   sheet    - Source Sheet object                          */
    /*   outlayer - The particle layer where effect is done.     */
    /*   actor    - The actor that is targetted by the effect.   */
    function burn() {
        var self = this;

        /* Override the create function. */
        self.parms[1].create = function (group, groupOffset) {
            var offset  = self.parms[0].groups[group][0] + groupOffset;
            var sx      = offset % self.parms[0].wcount;
            var sy      = Math.floor(offset / self.parms[0].wcount);
            var imgData = self.parms[0].canvas.getContext('2d').getImageData(sx*self.parms[0].cwidth, sy*self.parms[0].cheight, self.parms[0].cwidth, self.parms[0].cheight);
            var pixels  = imgData.data;

            for(var i=0; i<pixels.length; i+=4) {
                var y = Math.floor((i/4) / (self.parms[0].cheight));
                var x = (i/4) - (y * (self.parms[0].cwidth));

                if(y > 0 && pixels[i+3] > 0 && pixels[i+3 - (self.parms[0].cwidth*4)] === 0) {

                    self.parms[1].particles.push(
                        {
                            parent: Particles,
                            x : (self.parms[1].width/2)-(self.parms[0].cwidth/2)+x,
                            y : (self.parms[1].height/2)-(self.parms[0].cheight/2)+y+2,
                            ax : 0,
                            ay : -0.5,
                            vx : 0,
                            vy : 0,
                            width : 1,
                            height : 1,
                            polys : [[0, 0], [5, 0], [3, -10]],
                            age : 0,
                            hue : Particles.rand(0, 40),
                            saturation : Particles.rand(60, 100),
                            lightness  : Particles.rand(30, 60),
                            alpha : Particles.rand(.03, .2),
                            dieoff : 1
                        }
                    );
                }
            }
        };

        self.parms[2].lm.setLayerDrawState(2, true);
    }


    /****************************************************************/
    /* Effects
    /* 
    /*  A way to create interesting timed graphical effects on sheet images.
    /*  The effects can be color based - fadeIn/Out, invert, emboss, etc.
    /*  or they can be particle based - explode, burn, etc.
    /*
    /*  Parameters and their purpose:
    /*  
    /*  type         - (See TYPE_ definitions below)
    /*  effectParams - (array) Contains effect specific params (see each effect above).
    /*  startTime    - (time) When to start the effect.
    /*  period       - (number) Number of seconds each step lasts
    /*  steps        - (number) Number of steps to go through until full effect is reached.
    /*  duration     - (number) Number of seconds until effect ends.
    /*  finishCB     - (function) Callback function to invoke when effect ends.
    /*  finishParams - (array) Parameters to pass to callback function.
    /*  
    /****************************************************************/
    var Effects = function (type, effectParams, startTime, period, steps, duration, finishCB, finishParams) {
        var queuedCalls = [];

        var funcLookup = [invert, grayscale, emboss, fadeOut, fadeIn, explode, burn];

        this.type         = type;
        this.func         = funcLookup[type];
        this.parms        = effectParams.concat(steps);
        this.steps        = steps;
        this.duration     = duration;
        this.finishCB     = finishCB;
        this.finishParams = finishParams;
        this.done         = false;

        this.invert       = invert;
        this.grayscale    = grayscale;
        this.emboss       = emboss;
        this.fadeOut      = fadeOut;
        this.fadeIn       = fadeIn;
        this.explode      = explode;
        this.burn         = burn;

        /* add one more step to remove timed effect at end. */
        steps++;

        var delta = (period / (steps - 1))*1000;

        for(var i = 0; i<steps; i++) {
            var triggerTime;

            if(i < steps-1 || duration === 0)
                triggerTime = startTime + (i * delta);
            else
                triggerTime = startTime + (duration * 1000);


            var entry = {
                time : triggerTime,
                done : false
            };

            queuedCalls.push(entry);
        }

        this.queue = queuedCalls;

        effects.push(this);
    }

    function processEffects() {
        var now = (new Date()).getTime();
        var i;

        for (i = 0; i < effects.length; i++) 
        {
        	var allDone = true;

            for(var j=0; j < effects[i].queue.length; j++) 
            {
                if (now > effects[i].queue[j].time && effects[i].queue[j].done === false)
                {
                	/* Don't invoke the effect if this is the last step (this is just here to mark removal at end) */
                	if(j < effects[i].queue.length-1)
	                    effects[i].func.apply(effects[i]);
                    effects[i].queue[j].done = true;
                }

                if(effects[i].queue[j].done === false)
                	allDone = false;
            }

            if(allDone === true)
            {
            	if(effects[i].finishCB !== undefined)
            		effects[i].finishCB.apply(effects[i].finishParams[0],
                                              effects[i].finishParams.slice(1));

            	effects[i].done = true;
            }
        }

        /* Remove all the effects that are done. */
    	for (i = 0; i < effects.length;)
    	{
    		if(effects[i].done === true)
    			effects.splice(i, 1);
    		else
    			i++;
    	}
    }

    Effects.TYPE_INVERT    = 0;
    Effects.TYPE_GRAYSCALE = 1;
    Effects.TYPE_EMBOSS    = 2;
    Effects.TYPE_FADEOUT   = 3;
    Effects.TYPE_FADEIN    = 4;
    Effects.TYPE_EXPLODE   = 5;
    Effects.TYPE_BURN      = 6;

    Effects.RGBA           = RGBA;
    Effects.multiplyImage  = multiplyImage;
    Effects.processEffects = processEffects;
    
    return Effects;
});