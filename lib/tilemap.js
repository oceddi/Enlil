define(function(require) {
    var Loader = require('../lib/loader');
    var Sheets = require('../lib/sheets');

    var sectors = [];
    var numsectors;
    var tilesheet;
    var constructsheet;
    var screendiv;
    var screencanvas;
    var screenctx;
    var parent;
    var screenwidth;
    var screenheight;
    var twidth;
    var theight;
    var idealWidth;
    var idealHeight;

    function init(params) {
        var sectorswide;
        var sectorstall;
        var sectorx;
        var sectory;

        parent = document.getElementById(params.pid);

        if (params.mode == Tilemap.RELATIVE_DIV) {
            screenwidth  = params.screenwidth;
            screenheight = params.screenheight;
        }
        else if (params.mode == Tilemap.FULLSCREEN) {
            screenwidth = window.innerWidth;
            screenheight = Math.max(
            Math.max(document.body.scrollHeight, document.documentElement.scrollHeight), Math.max(document.body.offsetHeight, document.documentElement.offsetHeight), Math.max(document.body.clientHeight, document.documentElement.clientHeight));
        }

        twidth  = params.tilewidth;
        theight = params.tileheight;

        idealWidth  = params.mapwidth/twidth;
        idealHeight = params.mapheight/theight;

        tilesheet = new Image();

        refreshTileAtlas(params.pathToTiles, params.callback);

        if (params.mapwidth >= params.screenwidth) {
            sectorswide = Math.floor(params.mapwidth / (idealWidth * twidth));

            if (Math.floor(params.mapwidth % (idealWidth * twidth))) sectorswide++;
        }
        else {
            sectorswide = 1;
        }

        if (params.mapheight >= screenheight) {
            sectorstall = Math.floor(params.mapheight / (idealHeight * theight));

            if (Math.floor(params.mapheight % (idealHeight * theight))) sectorstall++;
        }
        else {
            sectorstall = 1;
        }

        numsectors = sectorswide * sectorstall;

        var mhremaining = params.mapheight;


        for (sectory = 0; sectory < sectorstall; sectory++, mhremaining -= sheight * theight) {
            var mwremaining = params.mapwidth;

            for (sectorx = 0; sectorx < sectorswide; sectorx++, mwremaining -= swidth * twidth) {
                var swidth;
                var sheight;
                var canvas = document.createElement('canvas');
                var context;

                /* Calculate the number of tiles for each sector, the last one possibly being smaller in either dimension.*/
                if (mwremaining >= idealWidth * twidth) {
                    swidth = idealWidth;
                }
                else {
                    swidth = (params.mapwidth - (sectorx * idealWidth * twidth)) / twidth;
                }

                if (mhremaining >= idealHeight * theight) {
                    sheight = idealHeight;
                }
                else {
                    sheight = (params.mapheight - (sectory * idealHeight * theight)) / theight;
                }

                /* Create an offscreen buffer to render this sectors tiles */
                canvas.width  = swidth  * twidth;
                canvas.height = sheight * theight;
                context = canvas.getContext('2d');

                sectors[sectory * sectorswide + sectorx] = {
                    sectorx: sectorx,
                    sectory: sectory,
                    topleftx: sectorx * (idealWidth * twidth),
                    toplefty: sectory * (idealHeight * theight),
                    sectorwidth: swidth,
                    sectorheight: sheight,
                    sectorcontext: context,
                    sectorcanvas: canvas,
                    mapCanvas: document.createElement('canvas'),
                    loaded: false,
                    mapRequested: false
                };
            }
        }

        screendiv = parent;

        switch (params.mode) {
        case Tilemap.FULLSCREEN:
            document.body.style.overflow = 'hidden'; /* Hide Scroll Bars.  */
            screendiv.innerHTML += '<canvas id="ib" width="' + screenwidth * 2 + '" height="' + screenheight * 2 + '" style="position:absolute;left:0px;top:0px;width:' + screenwidth * 2 + 'px;height:' + screenheight * 2 + 'px;"></canvas>';
            break;
        case Tilemap.RELATIVE_DIV:
            screendiv.innerHTML += '<canvas id="ib" width="' + screenwidth * 2 + '" height="' + screenheight * 2 + '" style="width:' + screenwidth * 2 + 'px;height:' + screenheight * 2 + 'px;"></canvas>';
            break;
        }

        screencanvas = document.getElementById('ib');
        screenctx    = screencanvas.getContext('2d');
    }

    function refreshTileAtlas(pathToTiles, callback) {

        Sheets.add('tilemap',   
        {
           resource:pathToTiles,
           cwidth:twidth,
           cheight:theight
        },
        renderTilemapToAll,
        callback);
    }


    function setMapData(sid, pathToLevel) {
        var mapImage = new Image();

        var onImgLoaded = function() {
            var ctx = sectors[sid].mapCanvas.getContext("2d");
            sectors[sid].mapCanvas.width  = mapImage.width;
            sectors[sid].mapCanvas.height = mapImage.height;
            ctx.drawImage(mapImage, 0, 0);

            renderTilemapToOffScreenCanvas(sid);

            sectors[sid].loaded = true;
         };

        mapImage.onload = onImgLoaded;
        mapImage.src    = pathToLevel;
    }

    function renderTilemapToOffScreenCanvas(sid) {
        var swidth  = sectors[sid].sectorwidth;
        var sheight = sectors[sid].sectorheight;
        var context = sectors[sid].sectorcontext;

        var x, y;
        var mw = sectors[sid].mapCanvas.width;
        var mh = sectors[sid].mapCanvas.height;
        var mapLookup = sectors[sid].mapCanvas.getContext("2d").getImageData(0, 0, mw, mh);

        for(y=0; y<sheight; y++)
        {
            for(x=0; x<swidth; x++)
            {
                /* Lookup tile. */
                var tilex = mapLookup.data[((y*mw)+x)*4];    // R
                var tiley = mapLookup.data[((y*mw)+x)*4+1];  // G
                var left = parseInt(x * twidth, 10);
                var top  = parseInt(y * theight, 10);

                //console.log(tilex + " " + tiley);

                if(tilex != 255 && tiley != 255)
                {
                	Sheets.drawCellAtPosition('tilemap', context, [7, 7], left, top);
                    Sheets.drawCellAtPosition('tilemap', context, [tilex, tiley], left, top);
                }
                else
                {
                    Sheets.drawCellAtPosition('tilemap', context, [7, 7], left, top);
                }
            }
        }
    }

    function renderTilemapToAll() {
        for(var i = 0; i < 1; i++)
            renderTilemapToOffScreenCanvas(i);
    }

    function drawToContext(sid, worldtlx, worldtly) {
        var sxoffset;
        var dxoffset;
        var width;
        var syoffset;
        var dyoffset;
        var height;
        var sectortlx = sectors[sid].topleftx;
        var sectortly = sectors[sid].toplefty;
        var drawboxes = 1;
        var copytiles = 1;

        /* Destination (screen) offsets */
        if (sectortlx < worldtlx) {
            sxoffset = worldtlx - sectortlx;

            dxoffset = 0;
            width = sectors[sid].sectorwidth * twidth - sxoffset;
        }
        else {
            sxoffset = 0;

            dxoffset = sectortlx - worldtlx;
            width = sectors[sid].sectorwidth * twidth;
        }

        if (sectortly < worldtly) {
            syoffset = worldtly - sectortly;

            dyoffset = 0;
            height = Math.floor(sectors[sid].sectorheight * theight) - syoffset;
        }
        else {
            syoffset = 0;

            dyoffset = sectortly - worldtly;
            height = Math.floor(sectors[sid].sectorheight * theight);
        }

        if (copytiles) {
            screenctx.drawImage(sectors[sid].sectorcanvas, sxoffset, syoffset, width, height, dxoffset, dyoffset, width, height);
            //screenctx.drawImage(sectors[sid].sectorcanvas, 0, 0, width, height, 0, 0, width, height);

        }

        if (drawboxes) // for debugging purposes
        {
            screenctx.beginPath();
            screenctx.lineWidth = 1;
            screenctx.strokeRect(dxoffset, dyoffset, width, height);
            screenctx.stroke();
        }
    }

    function insidesector(sid, x, y) {
        if ((x >= sectors[sid].topleftx) && (x <= (sectors[sid].topleftx + (sectors[sid].sectorwidth * twidth) + twidth / 2 - 1)) && (y >= sectors[sid].toplefty) && (y <= (sectors[sid].toplefty + (sectors[sid].sectorheight * theight)))) {
            return true;
        }
        return false;
    }

    function drawViewport(screentlx, screently) {
        var i;
        var seclist = [];

        screenctx.fillStyle = 'rgba(255,255,255,255)';
        screenctx.fillRect(0, 0, screenwidth, screenheight);

        /* Iterate over every sector and if it is within the screen boundaries, draw its contents */
        for (i = 0; i < numsectors; i++) {
            if (insidesector(i, screentlx, screently) || insidesector(i, screentlx + screenwidth, screently) || insidesector(i, screentlx, screently + screenheight) || insidesector(i, screentlx + screenwidth, screently + screenheight)) {
                if (sectors[i].loaded) {
                    drawToContext(i, screentlx, screently);
                }

                seclist.push(i);
            }
        }

        /* Draw some info on the bottom right */
        screenctx.fillStyle = 'rgba(255,0,0,255)';
        screenctx.fillRect(screenwidth - 100, screenheight - 75, 100, 75);
        screenctx.fillStyle = 'rgba(0,0,0,255)';
        screenctx.font = 'bold 12px sans-serif';
        screenctx.fillText('x:' + screentlx + ' y:' + screently, screenwidth - 90, screenheight - 65);

        for (i = 0; i < seclist.length; i++) {
            screenctx.fillText(seclist[i].toString() + ':', screenwidth - 90, screenheight - (50 - 15 * i));
            screenctx.fillText(sectors[seclist[i]].topleftx.toString(), screenwidth - 75, screenheight - (50 - 15 * i));
            screenctx.fillText(sectors[seclist[i]].toplefty.toString(), screenwidth - 30, screenheight - (50 - 15 * i));
        }
    }


    var Tilemap = {};

    Tilemap.init         = init;
    Tilemap.setMapData   = setMapData;
    Tilemap.renderTilemapToOffScreenCanvas = renderTilemapToOffScreenCanvas;
    Tilemap.renderTilemapToAll = renderTilemapToAll;
    Tilemap.drawViewport = drawViewport;

    Tilemap.windowWidth = function() {
        return screenwidth;
    };
    Tilemap.windowHeight = function() {
        return screenheight;
    };

    Tilemap.FULLSCREEN   = 1;
    Tilemap.RELATIVE_DIV = 2;

    return Tilemap;
});