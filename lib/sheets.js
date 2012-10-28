define(function(require) {

    // constructor
    var Sheets = function(data, flushFunc, callback) {
        var self = this;

        if(data.scalefactor === undefined)
            data.scalefactor = 1;

        this.cwidth      = data.cwidth;
        this.cheight     = data.cheight;
        this.groups      = data.groups;
        this.scalefactor = data.scalefactor;

        /* In some cases, the caller won't specify a resource. */
        if(data.resource) {
            this.resource = data.resource;
            this.image    = new Image();

            var onImgLoaded = function() {
                    self.wcount = Math.floor(self.image.width / self.cwidth);
                    self.hcount = Math.floor(self.image.height / self.cheight);

                    /* Create a canvas to store the image so we can use it as a source canvas to copy from later. */
                    self.canvas  = self.createNewCanvasFromImg();
                    self.imgData = self.canvas.getContext('2d').getImageData(0, 0, self.canvas.width, self.canvas.height);

                    if(flushFunc !== undefined)
                        self.flushFunc = flushFunc;

                    self.ready = true;

                    if(callback !== undefined)
                        callback();
            };

            this.image.onload = onImgLoaded;
            this.image.src = data.resource;            
        }

        this.copy                       = copy;
        this.createNewCanvasFromImg     = createNewCanvasFromImg;
        this.getCanvasWithCell          = getCanvasWithCell;
        this.getOriginalImgData         = getOriginalImgData;
        this.getImageWithID             = getImageWithID;
        this.drawCell                   = drawCell;
        this.drawCellAtPosition         = drawCellAtPosition;
        this.drawCellForGroup           = drawCellForGroup;
        this.drawCellForGroupAtPosition = drawCellForGroupAtPosition;
        this.getCharDims                = getCharDims;
        this.getGroupLength             = getGroupLength;
        this.flushToDestination         = flushToDestination;
    };

    function copy() {

        /* We omit resource in the constructor and copy the relevant this values instead. */
        var newOne = new Sheets(
            {
                cwidth: this.cwidth,
                cheight: this.cheight,
                groups: this.groups
            },
            this.flushFunc
        );
        newOne.resource    = this.resource,
        newOne.image       = this.image,
        newOne.wcount      = this.wcount,
        newOne.hcount      = this.hcount,
        newOne.canvas      = newOne.createNewCanvasFromImg();
        newOne.imgData     = newOne.canvas.getContext('2d').getImageData(0, 0, newOne.canvas.width, newOne.canvas.height);
        newOne.scalefactor = this.scalefactor
        newOne.ready       = true;

        return newOne;
    }

    function createNewCanvasFromImg() {
        var canvas = document.createElement('canvas');
        var ctx;

        canvas.width  = this.image.width*this.scalefactor;
        canvas.height = this.image.height*this.scalefactor;

        ctx = canvas.getContext('2d');

        if(this.scalefactor !== 1)
            ctx.scale(this.scalefactor, this.scalefactor);

        ctx.drawImage(this.image, 0, 0);

        return canvas;
    }

    function resetCellToOriginal(offset) {
        var ctx = this.canvas.getContext('2d');
        
        var cx = (offset % this.wcount) * this.cwidth;
        var cy = Math.floor(offset / this.wcount) * this.cheight;


        ctx.drawImage(this.image,
                      cx, cy,
                      this.cwidth, this.cheight,
                      cy, cy,
                      this.cwidth, this.cheight);
    }

    function getCanvasWithCell() {
        return this.canvas;
    }

    function getOriginalImgData() {
        return this.imgData;
    }

    function getImageWithID() {
        if (!this.ready) return;

        return this.image;
    }

    function drawCell(ctx, offset) {
        if (!this.ready) return;

        var sx = offset % this.wcount;
        var sy = Math.floor(offset / this.wcount);

        ctx.drawImage(this.canvas,
                      sx * this.cwidth, sy * this.cheight,
                      this.cwidth, this.cheight,
                      0, 0,
                      this.cwidth, this.cheight);
    }

    function drawCellAtPosition(ctx, offset, x, y) {
        var sx;
        var sy;

        if (!this.ready) return;

        /* offset can be specified as array of x,y positions or a single integer offset ... normalize */
        if(offset.length)
        {
            sx = offset[0];
            sy = offset[1];
        }
        else
        {
            sx = offset % this.wcount;
            sy = Math.floor(offset / this.wcount);
        }

        ctx.drawImage(this.canvas, sx * this.cwidth, sy * this.cheight, this.cwidth, this.cheight, x, y, this.cwidth, this.cheight);        
    }

    function drawCellForGroup(ctx, group, groupOffset) {
        if (!this.ready) return;

        var offset = this.groups[group][0] + groupOffset;
        var sx = offset % this.wcount;
        var sy = Math.floor(offset / this.wcount);

        ctx.drawImage(this.canvas, sx * this.cwidth, sy * this.cheight, this.cwidth, this.cheight, 0, 0, this.cwidth, this.cheight);
    }

    function drawCellForGroupAtPosition(ctx, group, groupOffset, x, y) {
        if (!this.ready) return;

        var offset = this.groups[group][0] + groupOffset;
        var sx = offset % this.wcount;
        var sy = Math.floor(offset / this.wcount);

        ctx.drawImage(this.canvas, sx * this.cwidth, sy * this.cheight, this.cwidth, this.cheight, x, y, this.cwidth, this.cheight);
    }

    function getCharDims() {
        return {
             cwidth : this.cwidth,
            cheight : this.cheight
        };
    }

    function getGroupLength(group) {
        return (this.groups[group][1] - this.groups[group][0]) + 1;
    }

    function flushToDestination() {
        if(this.flushFunc !== undefined)
            this.flushFunc();
    }

    return Sheets;
});