

define(function(require) {
    var Sheets = require('../lib/sheets');

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
        var canvas  = sheet.getCanvasWithCell();
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

    function invert(sheet) {
        var canvas  = sheet.getCanvasWithCell();
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

    function grayscale(sheet) {
        var canvas  = sheet.getCanvasWithCell();
        var ctx     = canvas.getContext('2d');
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels  = imgData.data;

        for (var i=0; i < pixels.length; i += 4)
        {
            var avg = (pixels[i] + pixels[i+1] + pixels[i+2])/3;

            pixels[i]   = avg;
            pixels[i+1] = avg;
            pixels[i+2] = avg;
        }

        ctx.putImageData(imgData, 0, 0);        
    }

    function emboss(sheet) {
        var canvas  = sheet.getCanvasWithCell();
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
                        pixels[i] = 255/2 + 2 * pixels[i] - pixels[i+4] - pixels[i+width*4];
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

    function fadeOut(sheet, steps) {
        var canvas   = sheet.getCanvasWithCell();
        var ctx      = canvas.getContext('2d');
        var imgData  = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var origData = sheet.getOriginalImgData();
        var pixels   = imgData.data;
        var n        = pixels.length;
        var alpha;
        var currentAlpha;
        var step;

        for (var i=3; i < n; i+=4)
        {
        	alpha = origData.data[i];

            if(alpha > 0 && pixels[i] > 0)
            {
            	currentAlpha = pixels[i];
            	step = Math.ceil(alpha/steps);

	            if((currentAlpha - step) > 0)
	            	pixels[i] -= step;
	            else
	            	pixels[i] = 0;
        	}
        }

        ctx.putImageData(imgData, 0, 0);        
        
        sheet.flushToDestination();

    }

    function addTimedEffect(effect, effectParams, startTime, period, steps, duration, finishCB, finishParams) {
        var queuedCalls = [];
        var eID = effectID++;
        var newEffect = {
                      id : eID,
                    func : effect,
                   parms : effectParams.concat(steps),
                   steps : steps,
                duration : duration,
                finishCB : finishCB,
            finishParams : finishParams ? finishParams.concat(eID) : 0,
                    done : false
        };
        
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

        newEffect.queue = queuedCalls;

        effects.push(newEffect);

        return newEffect.id;
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
	                    effects[i].func.apply(0, effects[i].parms);
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

    var Effects = {};

    Effects.RGBA           = RGBA;
    Effects.multiplyImage  = multiplyImage;
    Effects.invert         = invert;
    Effects.grayscale      = grayscale;
    Effects.emboss         = emboss;
    Effects.fadeOut        = fadeOut;
    Effects.addTimedEffect = addTimedEffect;
    Effects.processEffects = processEffects;
    
    return Effects;
});