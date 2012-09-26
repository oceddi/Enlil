define(function(require) {
    var sheets = {};

    function add(id, data, flushFunc, callback) {

        if(data.scalefactor === undefined)
            data.scalefactor = 1;

        sheets[id] = data;
        sheets[id].image = new Image();

        var onImgLoaded = function() {
                sheets[id].wcount = Math.floor(sheets[id].image.width / sheets[id].cwidth);
                sheets[id].hcount = Math.floor(sheets[id].image.height / sheets[id].cheight);

                /* Create a canvas to store the image so we can use it as a source canvas to copy from later. */
                sheets[id].canvas  = createNewCanvasFromImg(id);
                sheets[id].imgData = sheets[id].canvas.getContext('2d').getImageData(0, 0, sheets[id].canvas.width, sheets[id].canvas.height);

                if(flushFunc !== undefined)
                    sheets[id].flushFunc = flushFunc;

                sheets[id].ready = true;

                if(callback !== undefined)
                    callback();
            };

        sheets[id].image.onload = onImgLoaded;
        sheets[id].image.src = data.resource;
        sheets[id].copyIndex = 0;
    }

    function copy(sourceId) {
        var newId = sourceId + '_' + sheets[sourceId].copyIndex++;

        sheets[newId] = {
               image : sheets[sourceId].image,
             imgData : sheets[sourceId].imgData,
            resource : sheets[sourceId].resource,
              cwidth : sheets[sourceId].cwidth,
             cheight : sheets[sourceId].cheight,
              groups : sheets[sourceId].groups,
              wcount : sheets[sourceId].wcount,
              hcount : sheets[sourceId].hcount,
         scalefactor : sheets[sourceId].scalefactor
        };
        
        sheets[newId].canvas = createNewCanvasFromImg(newId);

        sheets[newId].ready = true;

        return newId;
    }

    function remove(id) {
        sheets[id] = 0;
    }

    function createNewCanvasFromImg(id) {
        var canvas = document.createElement('canvas');
        var ctx;

        canvas.width  = sheets[id].image.width*sheets[id].scalefactor;
        canvas.height = sheets[id].image.height*sheets[id].scalefactor;

        ctx = canvas.getContext('2d');

        if(sheets[id].scalefactor !== 1)
            ctx.scale(sheets[id].scalefactor, sheets[id].scalefactor);

        ctx.drawImage(sheets[id].image, 0, 0);

        return canvas;
    }

    function resetCellToOriginal(id, offset) {
        var ctx = sheets[id].canvas.getContext('2d');
        
        var cx = (offset % sheets[id].wcount) * sheets[id].cwidth;
        var cy = Math.floor(offset / sheets[id].wcount) * sheets[id].cheight;


        ctx.drawImage(sheets[id].image,
                      cx, cy,
                      sheets[id].cwidth, sheets[id].cheight,
                      cy, cy,
                      sheets[id].cwidth, sheets[id].cheight);
    }

    function getCanvasWithCell(id, offset) {
        return sheets[id].canvas;
    }

    function getOriginalImgData(id) {
        return sheets[id].imgData;
    }

    function getImageWithID(id) {
        if (!sheets[id].ready) return;

        return sheets[id].image;
    }

    function drawCell(id, ctx, offset) {
        if (!sheets[id].ready) return;

        var sx = offset % sheets[id].wcount;
        var sy = Math.floor(offset / sheets[id].wcount);

        ctx.drawImage(sheets[id].canvas,
                      sx * sheets[id].cwidth, sy * sheets[id].cheight,
                      sheets[id].cwidth, sheets[id].cheight,
                      0, 0,
                      sheets[id].cwidth, sheets[id].cheight);
    }

    function drawCellAtPosition(id, ctx, offset, x, y) {
        var sx;
        var sy;

        if (!sheets[id].ready) return;

        /* offset can be specified as array of x,y positions or a single integer offset ... normalize */
        if(offset.length)
        {
            sx = offset[0];
            sy = offset[1];
        }
        else
        {
            sx = offset % sheets[id].wcount;
            sy = Math.floor(offset / sheets[id].wcount);
        }

        ctx.drawImage(sheets[id].canvas, sx * sheets[id].cwidth, sy * sheets[id].cheight, sheets[id].cwidth, sheets[id].cheight, x, y, sheets[id].cwidth, sheets[id].cheight);        
    }

    function drawCellForGroup(id, ctx, group, groupOffset) {
        if (!sheets[id].ready) return;

        var offset = sheets[id].groups[group][0] + groupOffset;
        var sx = offset % sheets[id].wcount;
        var sy = Math.floor(offset / sheets[id].wcount);

        ctx.drawImage(sheets[id].canvas, sx * sheets[id].cwidth, sy * sheets[id].cheight, sheets[id].cwidth, sheets[id].cheight, 0, 0, sheets[id].cwidth, sheets[id].cheight);
    }

    function drawCellForGroupAtPosition(id, ctx, group, groupOffset, x, y) {
        if (!sheets[id].ready) return;

        var offset = sheets[id].groups[group][0] + groupOffset;
        var sx = offset % sheets[id].wcount;
        var sy = Math.floor(offset / sheets[id].wcount);

        ctx.drawImage(sheets[id].canvas, sx * sheets[id].cwidth, sy * sheets[id].cheight, sheets[id].cwidth, sheets[id].cheight, x, y, sheets[id].cwidth, sheets[id].cheight);
    }

    function getCharDims(id) {
        return {
             cwidth : sheets[id].cwidth,
            cheight : sheets[id].cheight
        };
    }

    function getGroupLength(id, group) {
        return (sheets[id].groups[group][1] - sheets[id].groups[group][0]) + 1;
    }

    function flushToDestination(id) {
        if(sheets[id].flushFunc !== undefined)
            sheets[id].flushFunc();
    }

    var Sheets = {};

    Sheets.add                        = add;
    Sheets.copy                       = copy;
    Sheets.remove                     = remove;
    Sheets.createNewCanvasFromImg     = createNewCanvasFromImg;
    Sheets.getCanvasWithCell          = getCanvasWithCell;
    Sheets.getOriginalImgData         = getOriginalImgData;
    Sheets.getImageWithID             = getImageWithID;
    Sheets.drawCell                   = drawCell;
    Sheets.drawCellAtPosition         = drawCellAtPosition;
    Sheets.drawCellForGroup           = drawCellForGroup;
    Sheets.drawCellForGroupAtPosition = drawCellForGroupAtPosition;
    Sheets.getCharDims                = getCharDims;
    Sheets.getGroupLength             = getGroupLength;
    Sheets.flushToDestination         = flushToDestination;

    return Sheets;
});