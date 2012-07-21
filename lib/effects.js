

define(function(require) {
    var Sheets = require('../lib/sheets');

    var effects = [];
    var effectID = 0;

    function explode(id, offset, frameCount, center) {
        var frames = [];

        /* Assemble n frames of animation into an array of canvas items.*/

        var sheetid     = Actors.getSheet(id);
        var origCanvas  = Sheets.getNewCanvasWithCell(sheetid, offset);
        var lastImgData = origCanvas.getContext('2d').getImageData(0, 0, origCanvas.width, origCanvas.height);

        /* Push starting frame onto array */
        frames.push(origCanvas);

        for (var i=1; i<frameCount; i++)
        {
            var canvas = document.createElement('canvas');
            var ctx;
            var imgData;

            canvas.width  = origCanvas.width;
            canvas.height = origCanvas.height;
            ctx              = canvas.getContext('2d');
            imgData       = ctx.getImageData(0, 0, canvas.width, canvas.height);

            /* Go around the outside of the rectangle.  Calculate a vector from
               the center point to the outside point.  Along this vector, see if
               there is an opaque pixel on the last frame.  If there is, move the
               pixel along the vector towards the outer edge of the rectangle in
               the current frame by a certain amount.  Rinse, repeat. */

            /* Top line. */
            for (var x = 0; x < origCanvas.width; x++)
            {
                var outer  = new Vector2(x, 0);
                var center = new Vector2(center.x, center.y);

                var proj = center.project(outer); 
            }


            /* Take the previous frame and move everything out from center pt. */
            for (var i = 0, n = lastImgData.length; i < n; i += 4)
            {
                var row = Math.floor((i/4) / canvas.width);
                var col = (i/4) - (row * canvas.width);

                if(lastImgData[i+3])
                {

                    /* In current frame, move pixel outwards from center */

                }
            }

            ctx.putImageData(imgData, 0, 0);

            frames.push(canvas);
            lastImgData = imgData;
        }

        return frames;
    };

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

    function multiplyImage(sheetid, offset, targetColor) {
        var canvas  = Sheets.getCanvasWithCell(sheetid, offset);
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

    function invert(sheetid, offset) {
        var canvas  = Sheets.getCanvasWithCell(sheetid, offset);
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

    function grayscale(sheetid, offset) {
        var canvas  = Sheets.getCanvasWithCell(sheetid, offset);
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

    function emboss(sheetid, offset) {
        var canvas  = Sheets.getCanvasWithCell(sheetid, offset);
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

    function fadeOut(sheetid, offset, steps) {
        var canvas   = Sheets.getCanvasWithCell(sheetid, offset);
        var ctx      = canvas.getContext('2d');
        var imgData  = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var origData = Sheets.getOriginalImgData(sheetid);
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
        
        Sheets.flushToDestination(sheetid);

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
            		effects[i].finishCB.apply(0, effects[i].finishParams);

            	effects[i].done = true;
            }
        }

        /* Remove all the effects that are done. */
    	for (i = 0; i < effects.length;)
    	{
    		if(effects[i].done === true)
    			effects.shift();
    		else
    			i++;
    	}
    }

    var Effects = {};

    Effects.expode         = explode;
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