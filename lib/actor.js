/********************************************************************/
/* actor.js 
/* 
/* Exported Classes:
/*  Actors
/* 
/* Internal Classes:
/*  Layer  
/*  LayerManager
/* 
/********************************************************************/
define(function(require) {

    var Sheets    = require('../lib/sheets');
    var Effects   = require('../lib/effects');
    var Physics   = require('../lib/physics');
    var Particles = require('../lib/particles');
    var UI        = require('../lib/ui');

    /****************************************************************/
    /* Layer - A container for holding/displaying graphical content.
    /* Currently supports 6 types:
    /*  1. TYPE_SHEET  - An image that may contain animation frames.
    /*  2. TYPE_CIRCLE - A circle outline.
    /*  3. TYPE_RECT   - A rectangular outline.
    /*  4. TYPE_PARTICLES - A particle generator based effect.
    /*  5. TYPE_NAME   - A string of text.
    /*  6. TYPE_SPEECHBUBBLE - A cute speech bubble with text inside.
    /****************************************************************/
    var Layer = function(type, params) {
        /* We don't use this constructor for these layer types. */
        if(type === Layer.TYPE_PARTICLES || 
           type === Layer.TYPE_SPEECHBUBBLE)
            return;

        this.type    = type;
        this.enabled = true;
        this.params  = params;
        this.div     = document.createElement('div');
        this.canvas  = document.createElement('canvas');

        this.div.style.position    = "absolute";
        this.canvas.style.position = "absolute";
        //this.div.style.border      = "1px solid black";

        this.div.appendChild(this.canvas);

        if (type === Layer.TYPE_SHEET) {
            var dims = params[0].getCharDims();

            this.canvas.width     = dims.cwidth;
            this.canvas.height    = dims.cheight;

            this.div.style.left   = 50 -dims.cwidth/2  + "px";
            this.div.style.top    = 50 -dims.cheight/2 + "px";   
            this.div.style.width  = dims.cwidth  + "px";
            this.div.style.height = dims.cheight + "px";
        } else if (type === Layer.TYPE_CIRCLE) {
            var ctx = this.canvas.getContext('2d');

            this.canvas.width = this.canvas.height = params[0]*2;

            ctx.strokeStyle = 'rgba(255, 0, 0, 1.0)';
            ctx.lineWidth   = '1';
            ctx.beginPath();
            ctx.arc(params[0], params[0], params[0], 0, Math.PI*2, true); 
            ctx.closePath();
            ctx.stroke();

            this.div.style.left = 50 -params[0] + "px";
            this.div.style.top  = 50 -params[0] + "px";
            this.div.style.width = params[0]*2;
            this.div.style.height = params[0]*2;
        } else if (type === Layer.TYPE_RECTANGLE) {
            var ctx = this.canvas.getContext('2d');

            this.canvas.width  = params[0];
            this.canvas.height = params[1];

            ctx.strokeStyle = 'rgba(255, 0, 0, 1.0)';
            ctx.lineWidth   = '1';
            ctx.rect(0, 0, params[0], params[1]);
            ctx.stroke();

            this.div.style.left   = 50 -(params[0]>>>1) + "px";
            this.div.style.top    = 50 -(params[1]>>>1) + "px";
            this.div.style.width  = params[0] + "px";
            this.div.style.height = params[1] + "px";
        } else if (type === Layer.TYPE_NAME) {
            var ctx = this.canvas.getContext('2d');
            var top = -1;

            this.canvas.width  = 100;
            this.canvas.height = 26;

            ctx.font = "bold 12px arial";
            ctx.fillText(params[0], 10, 10);

            this.div.style.left   =  "0px";

            /* If there is a sheet, place the name above it. */
            if(params[1])
            {
                var dims = params[1].getCharDims();
                top -= dims.cheight/2;
            }
            this.div.style.top    = top + "px";
            this.div.style.width  = 100 + "px";
            this.div.style.height = 26 + "px";
        }
    }

    Layer.TYPE_SHEET        = 0;
    Layer.TYPE_RECTANGLE    = 1;
    Layer.TYPE_CIRCLE       = 2;
    Layer.TYPE_PARTICLES    = 3;
    Layer.TYPE_NAME         = 4;
    Layer.TYPE_SPEECHBUBBLE = 5;

    /****************************************************************/
    /* LayerManager - A class that handles adding, removing, querying
    /* and setting layer states on an actor.
    /****************************************************************/
    var LayerManager = function (actor) {
        this.actor               = actor;
        this.layers              = [];

        this.addLayerAtIndex       = addLayerAtIndex;
        this.getLayerAtIndex       = getLayerAtIndex;
        this.getLayerOfType        = getLayerOfType;
        this.getEnabledLayerOfType = getEnabledLayerOfType;
        this.removeLayerAtIndex    = removeLayerAtIndex;
        this.setLayerDrawState     = setLayerDrawState;
    }

    function addLayerAtIndex(index, newLayer) {
        this.layers[index]        = newLayer;
        newLayer.div.style.zIndex = index;

        this.actor.div.appendChild(newLayer.div);
    }

    function getLayerAtIndex(index) {
        return this.layers[index];
    }

    function getLayerOfType(type) {
        for(var i=0; i<7; i++)
        {
            if(!this.layers[i]) continue;

            if(this.layers[i].type === type)
                return this.layers[i];
        }
        return 0;
    }

    function getEnabledLayerOfType(type) {
        for(var i=0; i<7; i++)
        {
            if(!this.layers[i]) continue;

            if(this.layers[i].type === type && this.layers[i].enabled === true)
                return this.layers[i];
        }
        return 0;
    }

    function removeLayerAtIndex(index) {
        this.setLayerDrawState(index, false);

        // Keep all other layers at same index
        this.layers[index] = 0;
    }

    function setLayerDrawState(index, enabled) {
        if(!this.layers[index]) return;

        if(enabled === true && this.layers[index].enabled !== true) {
            //this.actor.div.appendChild(this.layers[index].div);
            this.layers[index].div.style.display = "inline";
        } else if(enabled === false && this.layers[index].enabled !== false) {
            //this.actor.div.removeChild(this.layers[index].div);
            this.layers[index].div.style.display = "none";
        }

        this.layers[index].enabled = enabled;
    }

    /****************************************************************/
    /* Actors
    /* 
    /* A visual "thing" that can animate or move and collide
    /* with its surroundings.  Each actor is comprised of one or
    /* more "Layers".  Layers are useful for stacking graphical elements
    /* or easily enabling/disabling grapical effects on an actor.
    /* All active actors are maintained inside the actor class
    /* in an array.  The Enlil drawFrame() method is used to trigger
    /* drawing of all active actors on the current stage.
    /*
    /*  Parameters and their purpose:
    /* 
    /*  name      - (string) Text used by name layer.
    /*  div       - (HTMLDiv) Parent div element.
    /*  relative  - (bool) Controls whether x/y is relative/absolute to div.
    /*  sheet     - (object) A sheet object to use with sheet layer.
    /*  circle    - (number) Radius of circle layer to create.
    /*  rectangle - (array) Specifies width [0] and height [1] of rect layer.
    /*  x         - (number) Specifies x position.
    /*  y         - (number) Specifies y position.
    /*  
    /****************************************************************/

    /* Holds all active actors. */
    var actors = [];

    // constructor
    var Actors = function (params) {
        this.name               = params.name;
        this.div                = document.createElement('div');
        this.div.style.position = "absolute";
        //this.div.style.border   = "1px solid orange";
        this.div.style.width    = 100;
        this.div.style.height   = 100;
        this.div.style.zIndex   = 100;
        this.div.id             = 'div_'+params.name;
        this.lm                 = new LayerManager(this);
        this.effects            = [];

        if(params.div !== undefined && document.getElementById(params.div))
            document.getElementById(params.div).appendChild(this.div);
        else
            document.body.appendChild(this.div);

        if (params.relative !== undefined && params.relative === true) { /* Set the top div to absolute positioning to make it easy to move. */
            this.div.style.position = "absolute";
        }

        if(params.sheet !== undefined)
            this.lm.addLayerAtIndex(0, new Layer(Layer.TYPE_SHEET, [params.sheet]));
        else
            params.sheet = 0;

        if(params.circle !== undefined && params.circle > 0)
            this.lm.addLayerAtIndex(3, new Layer(Layer.TYPE_CIRCLE, [params.circle]));
        else
            params.circle = 0;

        if(params.rectangle !== undefined)
            this.lm.addLayerAtIndex(4, new Layer(Layer.TYPE_RECTANGLE, params.rectangle));
        else
            params.rectangle = 0;

        if(params.name !== undefined)
            this.lm.addLayerAtIndex(5, new Layer(Layer.TYPE_NAME, [params.name, params.sheet]));
        else
            params.name = 0;

        this.getSheet               = getSheet;
        this.setPosition            = setPosition;
        this.getPosition            = getPosition;
        this.draw                   = draw;
        this.drawGroup              = drawGroup;
        this.addSpeechBubble        = addSpeechBubble;
        this.addTimedSheetEffect    = addTimedSheetEffect;
        this.addTimedParticleEffect = addTimedParticleEffect;
        this.hasActiveEffect        = hasActiveEffect;
        this.getCollisions          = getCollisions;
        this.getAllCollisions       = getAllCollisions;
        this.getCollisionsWithinCircle = getCollisionsWithinCircle;
        this.getCollisionsWithinRect   = getCollisionsWithinRect;
        this.collidesWithBitmap     = collidesWithBitmap;
        this.attachPhysicsModel     = attachPhysicsModel;
        this.changePhysicsAttr      = changePhysicsAttr;
        this.remove                 = remove;

        actors.push(this);
    }

    function remove() {
        for (var i=0; i < actors.length; i++)
        {
            if(actors[i] === this)
            {
                actors.splice(i, 1);
                break;
            }
        }
    }

    function getAll() {
        return actors;
    }

    function getSheet() {
        var layer = this.lm.getLayerOfType(Layer.TYPE_SHEET);
        if(layer && layer.params[0].ready)
            return layer.params[0];
        else
            return 0;
    }

    function setPosition(x, y) {
        this.div.style.left = (x) + "px";
        this.div.style.top  = (y) + "px";
        this.x              = x;
        this.y              = y;
    }

    function getPosition() {
        return { x: this.x, y: this.y};
    }

    function draw(offset, dx, dy) {

        if(dx !== undefined && dy !== undefined)
            this.setPosition(dx, dy);

        for(var i = 0; i < 7; i++ )
        {
            var layer = this.lm.getLayerAtIndex(i);

            if(!layer || !layer.enabled) continue;

            var ctx   = layer.canvas.getContext('2d');

            switch(layer.type)
            {
                case Layer.TYPE_SHEET:
                    ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
                    layer.params[0].drawCell(ctx, offset);
                    break;

                case Layer.TYPE_PARTICLES:
                    layer.clear();
                    layer.create();
                    layer.update();
                    layer.render();
                    layer.remove();
                    break;

                default:
                    /* The rest of the layers don't animate. */
                    break;
            }
        }
    }

    function drawGroup(groupName, groupOffset, dx, dy) {

        if(dx !== undefined && dy !== undefined)
            this.setPosition(dx, dy);

        for(var i = 0; i < 7; i++ )
        {
            var layer = this.lm.getLayerAtIndex(i);

            if(!layer || !layer.enabled) continue;

            var ctx   = layer.canvas.getContext('2d');

            switch(this.lm.layers[i].type)
            {
                case Layer.TYPE_SHEET:
                    ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
                    layer.params[0].drawCellForGroupAtPosition(ctx, groupName, groupOffset, 0, 0);
                    break;

                case Layer.TYPE_PARTICLES:
                    layer.clear();
                    layer.create(groupName, groupOffset);
                    layer.update();
                    layer.render();
                    layer.remove();
                    break;

                default:
                    /* The rest of the layers don't animate. */
                    break;
            }
        }
    }

    function addSpeechBubble(params) {
        this.lm.addLayerAtIndex(6, new UI(UI.TYPE_SPEECHBUBBLE, params));

        var bubbleLayer   = this.lm.getLayerAtIndex(6);

        bubbleLayer.type = Layer.TYPE_SPEECHBUBBLE;
    }

    function addTimedSheetEffect(type, startTime, period, steps, duration) {
        var sheet         = this.getSheet();        
        var effectSheet   = sheet.copy();
        var effectParams  = [sheet, effectSheet, this];
        var effect;

        this.lm.addLayerAtIndex(1, new Layer(Layer.TYPE_SHEET, [effectSheet]));

        if(steps === undefined)
            steps = 1;

        if(duration == undefined)
            duration = 0;

        if(duration > 0)
        {
            effect = new Effects(type,
                                effectParams,
                                startTime,
                                period,
                                steps,
                                duration,
                                cleanupTimedEffect,
                                [this, sheet]);
        }
        else
        {
            effect = new Effects(type,
                                effectParams,
                                startTime,
                                period,
                                steps,
                                duration);
        }

        this.lm.setLayerDrawState(0, false);
        this.effects.push(effect);

        return effect;
    }

    function addTimedParticleEffect(type, startTime, period, steps, duration, hideSheet) {
        var sheet = this.getSheet();
        var dims  = sheet.getCharDims();

        var emitter = {
            width  : dims.cwidth*4,
            height : dims.cheight*4,
            dieoff : duration
        };
        
        this.lm.addLayerAtIndex(2, new Particles(emitter));

        var effectSheet   = this.lm.getLayerAtIndex(2);

        effectSheet.type = Layer.TYPE_PARTICLES;

        var effectParams  = [sheet, effectSheet, this];
        var effect;

        if(steps === undefined)
            steps = 1;

        if(duration == undefined)
            duration = 0;

        if(duration > 0)
        {
            effect = new Effects(type,
                                effectParams,
                                startTime,
                                period,
                                steps,
                                duration,
                                cleanupTimedEffect,
                                [this, sheet]);
        }
        else
        {
            effect = new Effects(type,
                                effectParams,
                                startTime,
                                period,
                                steps,
                                duration);
        }

        if(hideSheet)
            this.lm.setLayerDrawState(0, false);
        this.effects.push(effect);

        return effect;
    }

    function cleanupTimedEffect(oldSheet, effect)  {
        this.lm.setLayerDrawState(0, true);
        this.lm.setLayerDrawState(1, false);
        this.lm.setLayerDrawState(2, false);
        this.effects.splice(this.effects.indexOf(effect), 1);
    }

    function hasActiveEffect(type) {
        for(var i = 0; i < this.effects.length; i++) {
            if(this.effects[i].type === type)
                return true;
        }
        return false;
    }

    function getCollisions() {
        var collisions = [];
        var mylayer = this.lm.getEnabledLayerOfType(Layer.TYPE_SHEET);

        if(!mylayer)
            return collisions;

        for(var i=0; i<actors.length; i++)
        {
            if(actors[i] === this) continue;

            var theirlayer = actors[i].lm.getEnabledLayerOfType(Layer.TYPE_SHEET);

            if(!theirlayer) continue;

            if(Physics.intersectsBitmap(this.x,
                                        this.y,
                                        mylayer.canvas.width,
                                        mylayer.canvas.height,
                                        actors[i].x,
                                        actors[i].y,
                                        theirlayer.canvas.width,
                                        theirlayer.canvas.height,
                                        mylayer.canvas.getContext('2d').getImageData(0, 0, mylayer.canvas.width, mylayer.canvas.height).data,
                                        theirlayer.canvas.getContext('2d').getImageData(0, 0, theirlayer.canvas.width, theirlayer.canvas.height).data
                                     ))
            {
                collisions.push(actors[i]);
            }  
        }

        return collisions;
    }

    function getAllCollisions() {
        var collisions = [];

        for(var i=0; i<actors.length; i++)
        {
            var layeri = actors[i].lm.getEnabledLayerOfType(Layer.TYPE_SHEET);

            for(var j=0; j<actors.length; j++)
            {
                if(i === j) continue;

                var layerj = actors[j].lm.getEnabledLayerOfType(Layer.TYPE_SHEET);

                if(Physics.intersectsBitmap(actors[i].x,
                                            actors[i].y,
                                            layeri.canvas.width,
                                            layeri.canvas.height,
                                            actors[j].x,
                                            actors[j].y,
                                            layerj.canvas.width,
                                            layerj.canvas.height,
                                            layeri.canvas.getContext('2d').getImageData(0, 0, layeri.canvas.width, layeri.canvas.height).data,
                                            layerj.canvas.getContext('2d').getImageData(0, 0, layerj.canvas.width, layerj.canvas.height).data
                                         ))
                {
                    collisions.push([ actors[i] , actors[j] ]);
                }
            }
        }

        return collisions;
    }

    function getCollisionsWithinCircle(radius) {
        var collisions = [];

        for(var i=0; i<actors.length; i++)
        {
            if(actors[i] === this) continue;

            var layer = actors[i].lm.getEnabledLayerOfType(Layer.TYPE_SHEET);

            if(!layer) continue;

            if(Physics.intersectsCircleRect(actors[i].x,
                                            actors[i].y,
                                            layer.canvas.width,
                                            layer.canvas.height,
                                            this.x,
                                            this.y,
                                            radius
                                            ))
            {
                collisions.push(actors[i]);
            }  
        }

        return collisions;
    }

    function getCollisionsWithinRect(x, y, width, height) {
        var i;
        var collisions = [];

        var rectPixmap = new Uint8Array(width*height*4);

        for(i=3; i<rectPixmap.length; i+=4)
            rectPixmap[i] = 255;

        for(i=0; i<actors.length; i++)
        {
            var layer = actors[i].lm.getEnabledLayerOfType(Layer.TYPE_SHEET);

            if(Physics.intersectsBitmap(actors[i].x,
                                        actors[i].y,
                                        layer.canvas.width,
                                        layer.canvas.height,
                                        x,
                                        y,
                                        width,
                                        height,
                                        layer.canvas.getContext('2d').getImageData(0, 0, layer.canvas.width, layer.canvas.height).data,
                                        rectPixmap
                                     ))
            {
                collisions.push(actors[i]);
            }
        }

        return collisions;   
    }

    function collidesWithBitmap(x1, y1, x2, y2, width, height, bitmap) {
        var layer = this.lm.getEnabledLayerOfType(Layer.TYPE_SHEET);

        // Convert center coord to top left.
        var x1left = x1;//x1 - (layer.canvas.width>>>1);
        var y1top  = y1;//y1 - (layer.canvas.height>>>1);


        return Physics.intersectsBitmap(x1left,
                                        y1top,
                                        layer.canvas.width,
                                        layer.canvas.height,
                                        x2,
                                        y2,
                                        width,
                                        height,
                                        layer.canvas.getContext('2d').getImageData(0, 0, layer.canvas.width, layer.canvas.height).data,
                                        bitmap);
                                    
    }

    function attachPhysicsModel(data) {

        this.setPosition(data.x, data.y);

        if(data.collider === undefined)
            data.collider = Physics.defaultCollider;

        var layer = this.lm.getEnabledLayerOfType(Layer.TYPE_SHEET);


        this.physics = new Physics( {
                                        x : data.x + layer.div.offsetLeft,
                                        y : data.y + layer.div.offsetTop,
                                       vx : data.vx,
                                       vy : data.vy,
                                 collider : data.collider,
                                    });
    }

    function changePhysicsAttr(vx, vy, ax, ay) {

        if(ax !== undefined && ay != undefined)
            this.physics.changeAttributes(vx, vy, ax, ay);        
        else
            this.physics.changeAttributes(vx, vy);
    }

    function stepPhysics(screentlx, screently) {
        var timeNow = (new Date()).getTime()/1000;
        var ret = [];

        for(var i=0; i<actors.length; i++)
        {
            if(actors[i].physics === undefined)
                continue;

            var layer = actors[i].lm.getEnabledLayerOfType(Layer.TYPE_SHEET);
            var next  = actors[i].physics.interpolate(timeNow, screentlx, screently);
            
            /* Determine any collisions at the next state. */
    
            var params = {
                    actor : actors[i],
                screentlx : screentlx,
                screently : screently,
                        x : parseInt(next.x),
                        y : parseInt(next.y),
                    width : layer.canvas.width,
                   height : layer.canvas.height
            };

            collision = actors[i].physics.checkCollisions(params);

            /* If collision, cancel the physics. */
            if(collision)
            {
                actors[i].physics.changeAttributes(0, 0, 0, 0);
                actors[i].physics.updateTime(timeNow);      

                ret.push(actors[i].physics);
            } 
            else
            {
                /* If no collisions update time step and apply interpolation. */
                next.timeStart = timeNow;
                actors[i].physics.applyState(next);

                /* Update position */
                //console.log(next.x + " : " + next.y);

                actors[i].setPosition(parseInt(next.x)-layer.div.offsetLeft, parseInt(next.y)-layer.div.offsetTop);

                ret.push(next);
            }
        }
        return ret;
    }
    
    Actors.getAll      = getAll;
    Actors.stepPhysics = stepPhysics;

    return Actors;
});