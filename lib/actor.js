define(function(require) {

    var Sheets  = require('../lib/sheets');
    var Effects = require('../lib/effects');
    var Physics = require('../lib/physics');

    var actors = [];

    // constructor
    var Actors = function (params) {
        if (!params.name) {
            return;
        }

        if(params.circle === undefined)
            params.circle = 0;

        this.name    = params.name;
        this.div     = document.createElement('div');
        this.layers  = [];
        this.effects = [];

        document.body.appendChild(this.div);

        if (!params.relative) { /* Set the top div to absolute positioning to make it easy to move. */
            this.div.style.position = "absolute";
        }


        this.addLayer          = addLayer;
        this.getSheet          = getSheet;
        this.setSheet          = setSheet;
        this.setPosition       = setPosition;
        this.getPosition       = getPosition;
        this.draw              = draw;
        this.drawGroup         = drawGroup;
        this.addTimedEffect    = addTimedEffect;
        this.getEffectIDs      = getEffectIDs;
        this.getCollisions     = getCollisions;
        this.getAllCollisions  = getAllCollisions;
        this.getCollisionsWithinCircle = getCollisionsWithinCircle;
        this.getCollisionsWithinRect   = getCollisionsWithinRect;
        this.collidesWithBitmap = collidesWithBitmap;
        this.attachPhysicsModel = attachPhysicsModel;
        this.changePhysicsAttr  = changePhysicsAttr;
        this.remove             = remove;

        this.addLayer(Actors.LAYER_SHEET);

        if(params.circle)
            this.addLayer(Actors.LAYER_CIRCLE, [params.circle]);

        if(params.rectangle)
            this.addLayer(Actors.LAYER_RECTANGLE, params.rectangle);

        this.setSheet(params.sheet);

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

    function addLayer(type, params) {

        if(params === undefined)
            params = [];

        var layer = {
                div : document.createElement('div'),
             canvas : document.createElement('canvas'),
               type : type,
             params : params
        };

        layer.div.style.position    = "relative";
        layer.div.style.zIndex      = this.layers.length;
        layer.canvas.style.position = "absolute";
        layer.div.appendChild(layer.canvas);

        this.div.appendChild(layer.div);

        if(type === Actors.LAYER_CIRCLE) {
            var ctx = layer.canvas.getContext('2d');

            layer.canvas.width = layer.canvas.height = params[0]*2;

            ctx.strokeStyle = 'rgba(255, 0, 0, 1.0)';
            ctx.lineWidth   = '1';
            ctx.beginPath();
            ctx.arc(params[0], params[0], params[0], 0, Math.PI*2, true); 
            ctx.closePath();
            ctx.stroke();

            layer.div.style.left = (-params[0]) + "px";
            layer.div.style.top  = (-params[0]) + "px";
        } else if (type === Actors.LAYER_RECTANGLE) {
            var ctx = layer.canvas.getContext('2d');

            layer.canvas.width  = params[0];
            layer.canvas.height = params[1];

            ctx.strokeStyle = 'rgba(0, 255, 0, 1.0)';
            ctx.lineWidth   = '1';
            ctx.rect(0, 0, params[0], params[1]);
            ctx.stroke();

            //layer.div.style.left = (-params[0]/2) + "px";
            //layer.div.style.top  = (-params[1]/2) + "px";
            layer.div.style.left = 0 + "px";
            layer.div.style.top  = -params[1] + "px";
            layer.div.style.width = params[0] + "px";
            layer.div.style.height = params[1] + "px";
        }

        this.layers.push(layer);
    }

    function getSheet(layer) {
        if(layer === undefined)
            layer = 0;

        return this.layers[layer].params[0];
    }

    function setSheet(sheet, layer) {
        var dims = sheet.getCharDims();

        if(layer == undefined)
            layer = 0;

        this.layers[layer].params[0]     = sheet;

        /* Resize canvas. */
        this.layers[layer].canvas.width  = dims.cwidth;
        this.layers[layer].canvas.height = dims.cheight;

        //this.layers[layer].div.style.left = (-dims.cwidth/2) + "px";
        //this.layers[layer].div.style.top  = (-dims.cheight/2) + "px"; 
        this.layers[layer].div.style.left = 0 + "px";
        this.layers[layer].div.style.top  = 0 + "px";   
        this.layers[layer].div.style.width = dims.cwidth + "px";
        this.layers[layer].div.style.height = dims.cheight + "px";
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

        for(var i = 0; i < this.layers.length; i++ )
        {
            var ctx = this.layers[i].canvas.getContext('2d');

            switch(this.layers[i].type)
            {
                case Actors.LAYER_SHEET:
                    ctx.clearRect(0, 0, this.layers[i].canvas.width, this.layers[i].canvas.height);
                    this.layers[i].params[0].drawCell(ctx, offset);
                    break;

                default:
                    break;
            }
        }
    }

    function drawGroup(groupName, groupOffset, dx, dy) {

        if(dx !== undefined && dy !== undefined)
            this.setPosition(dx, dy);

        for(var i = 0; i < this.layers.length; i++ )
        {
            var ctx = this.layers[i].canvas.getContext('2d');

            switch(this.layers[i].type)
            {
                case Actors.LAYER_SHEET:
                    ctx.clearRect(0, 0, this.layers[i].canvas.width, this.layers[i].canvas.height);
                    this.layers[i].params[0].drawCellForGroupAtPosition(ctx, groupName, groupOffset, 0, 0);
                    break;

                default:
                    break;
            }
        }
    }

    function addTimedEffect(effect, startTime, period, steps, duration) {
        /* Create a new sheet (a copy of the current one) */
        var effectSheet   = this.layers[Actors.LAYER_SHEET].params[0].copy();
        var effectParams  = [effectSheet];
        var effectID;

        if(steps === undefined)
            steps = 1;

        if(duration == undefined)
            duration = 0;

        if(duration > 0)
        {
            effectID = Effects.addTimedEffect(effect,
                                              effectParams,
                                              startTime,
                                              period,
                                              steps,
                                              duration,
                                              cleanupTimedEffect,
                                              [this, this.layers[Actors.LAYER_SHEET].params[0]]);
        }
        else
        {
            effectID = Effects.addTimedEffect(effect,
                                              effectParams,
                                              startTime,
                                              period,
                                              steps,
                                              duration);            
        }

        this.setSheet(effectSheet);
        this.effects.push(effectID);

        return effectID;
    }

    function cleanupTimedEffect(oldSheet, effectID)  {
        this.setSheet(oldSheet);
        this.effects.splice(this.effects.indexOf(effectID), 1);
    }

    function getEffectIDs() {
        return this.effects;
    }

    function getCollisions() {
        var collisions = [];

        for(var i=0; i<actors.length; i++)
        {
            if(actors[i] === this) continue;

            if(Physics.intersectsBitmap(this.x,
                                        this.y,
                                        this.layers[Actors.LAYER_SHEET].canvas.width,
                                        this.layers[Actors.LAYER_SHEET].canvas.height,
                                        actors[i].x,
                                        actors[i].y,
                                        actors[i].layers[Actors.LAYER_SHEET].canvas.width,
                                        actors[i].layers[Actors.LAYER_SHEET].canvas.height,
                                        this.layers[Actors.LAYER_SHEET].canvas.getContext('2d').getImageData(0, 0, this.layers[Actors.LAYER_SHEET].canvas.width, this.layers[Actors.LAYER_SHEET].canvas.height).data,
                                        actors[i].layers[Actors.LAYER_SHEET].canvas.getContext('2d').getImageData(0, 0, actors[i].layers[Actors.LAYER_SHEET].canvas.width, actors[i].layers[Actors.LAYER_SHEET].canvas.height).data
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
            for(var j=0; j<actors.length; j++)
            {
                if(i === j) continue;

                if(Physics.intersectsBitmap(actors[i].x,
                                            actors[i].y,
                                            actors[i].layers[Actors.LAYER_SHEET].canvas.width,
                                            actors[i].layers[Actors.LAYER_SHEET].canvas.height,
                                            actors[j].x,
                                            actors[j].y,
                                            actors[j].layers[Actors.LAYER_SHEET].canvas.width,
                                            actors[j].layers[Actors.LAYER_SHEET].canvas.height,
                                            actors[i].layers[Actors.LAYER_SHEET].canvas.getContext('2d').getImageData(0, 0, actors[i].layers[Actors.LAYER_SHEET].canvas.width, actors[i].layers[Actors.LAYER_SHEET].canvas.height).data,
                                            actors[j].layers[Actors.LAYER_SHEET].canvas.getContext('2d').getImageData(0, 0, actors[j].layers[Actors.LAYER_SHEET].canvas.width, actors[j].layers[Actors.LAYER_SHEET].canvas.height).data
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

            if(Physics.intersectsCircleRect(actors[i].x,
                                            actors[i].y,
                                            actors[i].layers[Actors.LAYER_SHEET].canvas.width,
                                            actors[i].layers[Actors.LAYER_SHEET].canvas.height,
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
            if(Physics.intersectsBitmap(actors[i].x,
                                        actors[i].y,
                                        actors[i].layers[Actors.LAYER_SHEET].canvas.width,
                                        actors[i].layers[Actors.LAYER_SHEET].canvas.height,
                                        x,
                                        y,
                                        width,
                                        height,
                                        actors[i].layers[Actors.LAYER_SHEET].canvas.getContext('2d').getImageData(0, 0, actors[i].layers[Actors.LAYER_SHEET].canvas.width, actors[i].layers[Actors.LAYER_SHEET].canvas.height).data,
                                        rectPixmap
                                     ))
            {
                collisions.push(actors[i]);
            }
        }

        return collisions;   
    }

    function collidesWithBitmap(x1, y1, x2, y2, width, height, bitmap) {
 
        return Physics.intersectsBitmap(x1,
                                        y1,
                                        this.layers[Actors.LAYER_SHEET].canvas.width,
                                        this.layers[Actors.LAYER_SHEET].canvas.height,
                                        x2,
                                        y2,
                                        width,
                                        height,
                                        this.layers[Actors.LAYER_SHEET].canvas.getContext('2d').getImageData(0, 0, this.layers[Actors.LAYER_SHEET].canvas.width, this.layers[Actors.LAYER_SHEET].canvas.height).data,
                                        bitmap);
                                    
    }

    function attachPhysicsModel(data) {

        this.setPosition(data.x, data.y);

        if(data.collider === undefined)
            data.collider = Physics.defaultCollider;

        this.physics = new Physics( {
                                        x : data.x,
                                        y : data.y,
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

            var next = actors[i].physics.interpolate(timeNow, screentlx, screently);
            
            /* Determine any collisions at the next state. */
    
            var params = {
                    actor : actors[i],
                screentlx : screentlx,
                screently : screently,
                        x : parseInt(next.x),
                        y : parseInt(next.y),
                    width : actors[i].layers[Actors.LAYER_SHEET].canvas.width,
                   height : actors[i].layers[Actors.LAYER_SHEET].canvas.height
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

                actors[i].setPosition(parseInt(next.x), parseInt(next.y));

                ret.push(next);
            }
        }
        return ret;
    }

    /* Layer types. */
    Actors.LAYER_SHEET       = 0;
    Actors.LAYER_CIRCLE      = 1;
    Actors.LAYER_RECTANGLE   = 2;
    
    Actors.getAll      = getAll;
    Actors.stepPhysics = stepPhysics;

    return Actors;
});