define(function(require) {

    var Sheets  = require('../lib/sheets');
    var Effects = require('../lib/effects');
    var Physics = require('../lib/physics');

    var actors = [];

    function add(params) {
        if (!params.name) {
            return;
        }

        if(params.circle === undefined)
            params.circle = 0;

        var newOne = {
               name : params.name,
                div : document.createElement('div'),
             layers : [],
            effects : []
        };

        document.body.appendChild(newOne.div);

        if (!params.relative) { /* Set the top div to absolute positioning to make it easy to move. */
            newOne.div.style.position = "absolute";
        }


        actors.push(newOne);

        addLayer(actors.length - 1, Actors.LAYER_SHEET);

        if(params.circle)
            addLayer(actors.length - 1, Actors.LAYER_CIRCLE, [params.circle]);

        if(params.rectangle)
            addLayer(actors.length - 1, Actors.LAYER_RECTANGLE, params.rectangle);

        Actors.setSheet(actors.length - 1, params.sheetid);
    }

    function addLayer(id, type, params) {

        if(params === undefined)
            params = [];

        var layer = {
                div : document.createElement('div'),
             canvas : document.createElement('canvas'),
               type : type,
             params : params
        };

        layer.div.style.position    = "relative";
        layer.div.style.zIndex      = actors[id].layers.length;
        layer.canvas.style.position = "absolute";
        layer.div.appendChild(layer.canvas);

        actors[id].div.appendChild(layer.div);

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

        actors[id].layers.push(layer);
    }

    function getIdForName(name) {
        for (var i = 0; i < actors.length; i++) {
            if (actors[i].name == name) return i;
        }
        return -1;
    }

    function getLength() {
        return actors.length;
    }

    function getSheet(id, layer) {
        if(layer === undefined)
            layer = 0;

        return actors[id].layers[layer].params[0];
    }

    function setSheet(id, sheetid, layer) {
        var dims = Sheets.getCharDims(sheetid);

        if(layer == undefined)
            layer = 0;

        actors[id].layers[layer].params[0]     = sheetid;

        /* Resize canvas. */
        actors[id].layers[layer].canvas.width  = dims.cwidth;
        actors[id].layers[layer].canvas.height = dims.cheight;

        //actors[id].layers[layer].div.style.left = (-dims.cwidth/2) + "px";
        //actors[id].layers[layer].div.style.top  = (-dims.cheight/2) + "px"; 
        actors[id].layers[layer].div.style.left = 0 + "px";
        actors[id].layers[layer].div.style.top  = 0 + "px";   
        actors[id].layers[layer].div.style.width = dims.cwidth + "px";
        actors[id].layers[layer].div.style.height = dims.cheight + "px";
    }

    function setPosition(id, x, y) {
        actors[id].div.style.left = (x) + "px";
        actors[id].div.style.top  = (y) + "px";
        actors[id].x              = x;
        actors[id].y              = y;
    }

    function getPosition(id) {
        return { x: actors[id].x, y: actors[id].y};
    }

    function draw(id, offset) {

        for(var i = 0; i < actors[id].layers.length; i++ )
        {
            var ctx = actors[id].layers[i].canvas.getContext('2d');

            switch(actors[id].layers[i].type)
            {
                case Actors.LAYER_SHEET:
                    ctx.clearRect(0, 0, actors[id].layers[i].canvas.width, actors[id].layers[i].canvas.height);
                    Sheets.drawCell(actors[id].layers[i].params[0], ctx, offset);
                    break;

                default:
                    break;
            }
        }
    }

    function drawGroup(id, groupName, groupOffset) {

        for(var i = 0; i < actors[id].layers.length; i++ )
        {
            var ctx = actors[id].layers[i].canvas.getContext('2d');

            switch(actors[id].layers[i].type)
            {
                case Actors.LAYER_SHEET:
                    ctx.clearRect(0, 0, actors[id].layers[i].canvas.width, actors[id].layers[i].canvas.height);
                    Sheets.drawCellForGroupAtPosition(actors[id].layers[i].params[0], ctx, groupName, groupOffset, 0, 0);
                    break;

                default:
                    break;
            }
        }
    }

    function addTimedEffect(id, effect, startTime, period, steps, duration) {
        /* Create a new sheet (a copy of the current one) */
        var effectSheetId = Sheets.copy(actors[id].layers[Actors.LAYER_SHEET].params[0]);
        var effectParams  = [effectSheetId, 0];
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
                                              [id, actors[id].layers[Actors.LAYER_SHEET].params[0]]);
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

        setSheet(id, effectSheetId);
        actors[id].effects.push(effectID);

        return effectID;
    }

    function cleanupTimedEffect(id, oldSheetId, effectID)  {
        var effectSheetId = getSheet(id);

        setSheet(id, oldSheetId);

        Sheets.remove(effectSheetId);

        actors[id].effects.splice(actors[id].effects.indexOf(effectID), 1);
    }

    function getEffectIDs(id) {
        return actors[id].effects;
    }

    function getCollisions(id) {
        var collisions = [];

        for(var i=0; i<actors.length; i++)
        {
            if(i === id) continue;

            if(Physics.intersectsBitmap(actors[id].x,
                                        actors[id].y,
                                        actors[id].layers[Actors.LAYER_SHEET].canvas.width,
                                        actors[id].layers[Actors.LAYER_SHEET].canvas.height,
                                        actors[i].x,
                                        actors[i].y,
                                        actors[i].layers[Actors.LAYER_SHEET].canvas.width,
                                        actors[i].layers[Actors.LAYER_SHEET].canvas.height,
                                        actors[id].layers[Actors.LAYER_SHEET].canvas.getContext('2d').getImageData(0, 0, actors[id].layers[Actors.LAYER_SHEET].canvas.width, actors[id].layers[Actors.LAYER_SHEET].canvas.height).data,
                                        actors[i].layers[Actors.LAYER_SHEET].canvas.getContext('2d').getImageData(0, 0, actors[i].layers[Actors.LAYER_SHEET].canvas.width, actors[i].layers[Actors.LAYER_SHEET].canvas.height).data
                                     ))
            {
                collisions.push(i);
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
                    collisions.push([ i , j ]);
                }
            }
        }

        return collisions;
    }

    function getCollisionsWithinCircle(id, radius) {
        var collisions = [];

        for(var i=0; i<actors.length; i++)
        {
            if(i === id) continue;

            if(Physics.intersectsCircleRect(actors[i].x,
                                            actors[i].y,
                                            actors[i].layers[Actors.LAYER_SHEET].canvas.width,
                                            actors[i].layers[Actors.LAYER_SHEET].canvas.height,
                                            actors[id].x,
                                            actors[id].y,
                                            radius
                                            ))
            {
                collisions.push(i);
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
                collisions.push(i);
            }
        }

        return collisions;   
    }

    function collidesWithBitmap(id, x1, y1, x2, y2, width, height, bitmap) {
 
        return Physics.intersectsBitmap(x1,
                                        y1,
                                        actors[id].layers[Actors.LAYER_SHEET].canvas.width,
                                        actors[id].layers[Actors.LAYER_SHEET].canvas.height,
                                        x2,
                                        y2,
                                        width,
                                        height,
                                        actors[id].layers[Actors.LAYER_SHEET].canvas.getContext('2d').getImageData(0, 0, actors[id].layers[Actors.LAYER_SHEET].canvas.width, actors[id].layers[Actors.LAYER_SHEET].canvas.height).data,
                                        bitmap);
                                    
    }

    function attachPhysicsModel(id, data) {

        setPosition(id, data.x, data.y);

        if(data.collider === undefined)
            data.collider = Physics.defaultCollider;

        actors[id].physicsid = Physics.instantiate( {
                                                        x : data.x,
                                                        y : data.y,
                                                       vx : data.vx,
                                                       vy : data.vy,
                                                 collider : data.collider,
                                                    });
    }

    function changePhysicsAttr(id, vx, vy, ax, ay) {

        if(ax !== undefined && ay != undefined)
            Physics.changeAttributes(actors[id].physicsid, vx, vy, ax, ay);        
        else
            Physics.changeAttributes(actors[id].physicsid, vx, vy);
    }

    function stepPhysics(screentlx, screently) {
        var timeNow = (new Date()).getTime()/1000;
        var ret = [];

        for(var i=0; i<actors.length; i++)
        {
            if(actors[i].physicsid === undefined)
                continue;

            var next = Physics.interpolate(actors[i].physicsid, timeNow, screentlx, screently);
            
            /* Determine any collisions at the next state. */
    
            var params = {
                  actorid : i,
                screentlx : screentlx,
                screently : screently,
                        x : parseInt(next.x),
                        y : parseInt(next.y),
                    width : actors[i].layers[Actors.LAYER_SHEET].canvas.width,
                   height : actors[i].layers[Actors.LAYER_SHEET].canvas.height
            };

            collision = Physics.checkCollisions(actors[i].physicsid, params);

            /* If collision, cancel the physics. */
            if(collision)
            {
                Physics.changeAttributes(actors[i].physicsid, 0, 0, 0, 0);  
                Physics.updateTime(actors[i].physicsid, timeNow);      

                ret.push(Physics.getAttributes(actors[i].physicsid));
            } 
            else
            {
                /* If no collisions update time step and apply interpolation. */
                next.timeStart = timeNow;
                Physics.applyState(actors[i].physicsid, next);

                /* Update position */
                //console.log(next.x + " : " + next.y);

                setPosition(i, parseInt(next.x), parseInt(next.y));

                ret.push(next);
            }
        }
        return ret;
    }

    var Actors = {};

    /* Layer types. */
    Actors.LAYER_SHEET       = 0;
    Actors.LAYER_CIRCLE      = 1;
    Actors.LAYER_RECTANGLE   = 2;


    Actors.add               = add;
    Actors.getIdForName      = getIdForName;
    Actors.getLength         = getLength;
    Actors.getSheet          = getSheet;
    Actors.setSheet          = setSheet;
    Actors.setPosition       = setPosition;
    Actors.getPosition       = getPosition;
    Actors.draw              = draw;
    Actors.drawGroup         = drawGroup;
    Actors.addTimedEffect    = addTimedEffect;
    Actors.getEffectIDs      = getEffectIDs;
    Actors.getCollisions     = getCollisions;
    Actors.getAllCollisions  = getAllCollisions;
    Actors.getCollisionsWithinCircle = getCollisionsWithinCircle;
    Actors.getCollisionsWithinRect   = getCollisionsWithinRect;
    Actors.collidesWithBitmap = collidesWithBitmap;
    Actors.attachPhysicsModel = attachPhysicsModel;
    Actors.changePhysicsAttr  = changePhysicsAttr;
    Actors.stepPhysics        = stepPhysics;
    
    return Actors;
});