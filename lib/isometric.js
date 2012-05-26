
define(function (require) {
	var Sheets = require('../lib/sheets');
	var Loader = require('../lib/loader');

	var sectors = [];
    var numsectors;
	var tilesheet;
	var tileprops;
    var constructsheet;
    var screendiv;
    var screencanvas;
    var screenctx;
    var parent;

	function init(pid, mode, tw, th, mw, mh, sw, sh, pathToTiles, pathToProps, callback) {
		var sectorswide;
		var sectorstall;
		var sectorx;
		var sectory;

		htheight       = th/2;
		idealWidth     = Math.floor((sw+tw-1)/tw);
		idealHeight    = Math.floor((sh+htheight-1)/htheight) - 1;
		parent         = document.getElementById(pid);

		if(mode == Isometric.RELATIVE_DIV)
		{
			screenwidth    = sw;
			screenheight   = sh;
		}
		else if(mode == Isometric.FULLSCREEN)
		{
			screenwidth = window.innerWidth;

			screenheight = Math.max(
	      		Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
	      		Math.max(document.body.offsetHeight, document.documentElement.offsetHeight),
	      		Math.max(document.body.clientHeight, document.documentElement.clientHeight)
    		);
		}
		

		twidth         = tw;
		theight        = th;
		tilesheet      = new Image();
		constructsheet = new Image();

		refreshTileAtlas(pathToTiles, pathToProps, callback);

		if(mw >= screenwidth)
		{
			sectorswide = Math.floor(mw  / (idealWidth*twidth));

			if(Math.floor(mw  % (idealWidth*twidth)))
				sectorswide ++;
		}
		else
		{
		  sectorswide = 1;
		}

		if(mh >= screenheight)
		{
			sectorstall = Math.floor(mh / (Math.floor((screenheight+htheight-1)/htheight)*htheight));

			if(Math.floor(mh % (Math.floor((screenheight+htheight-1)/htheight)*htheight)))
				sectorstall++;
		}
		else
		{
			sectorstall = 1;
		}

		console.log('sw:'+sectorswide + ' st:'+sectorstall);

		numsectors   = sectorswide * sectorstall;

		var mhremaining = mh;

		for(sectory=0; sectory<sectorstall; sectory++, mhremaining -= sheight*htheight)
		{
			var mwremaining = mw;

			for(sectorx=0; sectorx<sectorswide; sectorx++, mwremaining -= swidth*twidth)
			{
				var swidth;
				var sheight;
				var canvas = document.createElement('canvas');
				var context;

				/* Calculate the number of tiles for each sector, the last one possibly being smaller in either dimension.*/
				if(mwremaining >= idealWidth*twidth)
				{
					swidth = idealWidth;
				}
				else
				{
					swidth = (mw - (sectorx*idealWidth*twidth))/twidth;
				}

				if(mhremaining >= idealHeight*htheight)
				{
					sheight = idealHeight;
				}
				else
				{
					sheight = (mh - (sectory*idealHeight*htheight))/htheight;
				}

				/* Create an offscreen buffer to render this sectors tiles */
				canvas.width  = (swidth)*twidth   + twidth/2;
				canvas.height = (sheight)*theight + theight;
				context       = canvas.getContext('2d');

				sectors[sectory*sectorswide+sectorx] = {
				                             sectorx:       sectorx,
				                             sectory:       sectory,
				                             topleftx:      sectorx*(idealWidth*twidth),
				                             toplefty:      sectory*(idealHeight*htheight),
				                             sectorwidth:   swidth,
				                             sectorheight:  sheight,
				                             sectorcontext: context,
				                             sectorcanvas:  canvas,
				                             mapdata:       null,
				                             loaded:        false,
				                             mapRequested:  false
				                           };
			}
		}

		screendiv = parent;

		switch(mode) {
		case Isometric.FULLSCREEN:
			document.body.style.overflow='hidden'; /* Hide Scroll Bars.  */
			screendiv.innerHTML += '<canvas id="ib" width="' + screenwidth*2 +'" height="' + screenheight*2 +
                           	  '" style="position:absolute;left:0px;top:0px;width:'    + screenwidth*2 +
			                       'px;height:' + screenheight*2 + 'px;"></canvas>';
			break;
		case Isometric.RELATIVE_DIV:
			screendiv.innerHTML += '<canvas id="ib" width="' + screenwidth*2 +'" height="' + screenheight*2 +
			                       '" style="width:'    + screenwidth*2 +
			                       'px;height:' + screenheight*2 + 'px;"></canvas>';
			break;
		}

		screencanvas = document.getElementById('ib');
		screenctx    = screencanvas.getContext('2d');

	};

	function refreshTileAtlas(pathToTiles, pathToProps, callback) {
		var date = new Date().getTime();

		tilesheet.onload = function () {
		   	Loader.requestTileProps( pathToProps+'?'+date, function(data) {
		   		tileprops = data;
		   		callback();
		   	});
	    };
		tilesheet.src = pathToTiles+'?'+date;
	}

	function setMapData(sid, message) {
		var swidth  = sectors[sid].sectorwidth;
		var sheight = sectors[sid].sectorheight;
		var x,y;

		sectors[sid].mapdata = [];
		sectors[sid].constructdata = {};

		/* Copy relevant map data. */
		for(y=0; y<sheight; y++)
		{
			for(x=0; x<swidth; x++)
			{
				/* GameTiles */
				if(!sectors[sid].mapdata[x]) sectors[sid].mapdata[x] = [];
				sectors[sid].mapdata[x][y] = message.mapData[x][y];
			}
		}

		renderTilemapToOffScreenCanvas(sid);

		sectors[sid].loaded       = true;
		sectors[sid].mapRequested = false;
	};

	function renderTilemapToOffScreenCanvas(sid) {
		var swidth  = sectors[sid].sectorwidth;
		var sheight = sectors[sid].sectorheight;
		var context = sectors[sid].sectorcontext;
		var md      = sectors[sid].mapdata;
		var cd      = sectors[sid].constructdata;
		var x,y;
		var oddAdjust = 0;

		/* Does this sector have an odd yoffset? If so, drawing needs to be adjusted. */
		if((sectors[sid].sectory*idealHeight) % 2)
		{
			oddAdjust = 1;
		}

		context.globalCompositeOperation  = "source-over";

		/* Draw Tiles first */
		for(y=0; y<sheight; y++)
		{   
			for(x=0; x<swidth; x++)
			{
				var tileid  = md[x][y];
				var left    = parseInt(x*twidth + ((y+oddAdjust)&1)*(twidth/2));
				var top     = parseInt(y*htheight);

				context.drawImage(tilesheet,  
				   tileprops[tileid].x, tileprops[tileid].y,
				   twidth, theight,
				   left, top,
				   twidth, theight);
			}
		}

		context.globalCompositeOperation  = "source-atop";
	};

	function drawToContext(sid, worldtlx, worldtly) {
		var sxoffset;
		var dxoffset;
		var width;
		var syoffset;
		var dyoffset;
		var height;
		var sectortlx = sectors[sid].topleftx;
		var sectortly = sectors[sid].toplefty;
		var drawboxes = 0;
		var copytiles = 1;

		/* Destination (screen) offsets */
		if(sectortlx < worldtlx)
		{
			sxoffset = worldtlx - sectortlx;

			dxoffset = 0;
			width    = sectors[sid].sectorwidth*twidth - sxoffset + twidth/2;
		}
		else
		{
			sxoffset = 0;

			dxoffset = sectortlx - worldtlx;
			width    = sectors[sid].sectorwidth*twidth + twidth/2;
		}

		if(sectortly < worldtly)
		{
			syoffset = worldtly - sectortly;

			dyoffset = 0;
			height  = Math.floor(sectors[sid].sectorheight*theight) - syoffset + theight;
		}
		else
		{
			syoffset = 0;

			dyoffset = sectortly - worldtly;
			height  =  Math.floor(sectors[sid].sectorheight*theight) + theight;
		}

		if(copytiles)
		{
			screenctx.drawImage( sectors[sid].sectorcanvas, sxoffset, syoffset, width, height, dxoffset, dyoffset, width, height);
		}

		if(drawboxes) // for debugging purposes
		{ 
			screenctx.beginPath();
			screenctx.lineWidth=1; 
			screenctx.strokeRect(dxoffset, dyoffset, width, height);
			screenctx.stroke();
		}
	};

	function insidesector(sid, x, y) {
		if((x >= sectors[sid].topleftx) &&
		   (x <= (sectors[sid].topleftx + (sectors[sid].sectorwidth*twidth) + twidth/2 - 1)) &&
		   (y >= sectors[sid].toplefty) &&
		   (y <= (sectors[sid].toplefty + (sectors[sid].sectorheight*theight))))
		{
		  return true;
		}
		return false;
	};

	function drawViewport(screentlx, screently) {
		var i;
		var seclist = [];

		screenctx.fillStyle ='rgba(255,255,255,255)';
		screenctx.fillRect(0,0, screenwidth, screenheight);

		/* Iterate over every sector and if it is within the screen boundaries, draw its contents */
		for(i=0; i<numsectors; i++)
		{
			if(insidesector(i, screentlx, screently) ||
			   insidesector(i, screentlx+screenwidth, screently) ||
			   insidesector(i, screentlx, screently+screenheight) ||
			   insidesector(i, screentlx+screenwidth, screently+screenheight))
			{
				if(sectors[i].loaded)
				{
					drawToContext(i, screentlx, screently);
				}

				seclist.push(i);
			}
		}
		  
		/* Draw some info on the bottom right */
		screenctx.fillStyle ='rgba(255,0,0,255)';
		screenctx.fillRect(screenwidth-100, screenheight-75, 100, 75);
		screenctx.fillStyle ='rgba(0,0,0,255)';
		screenctx.font = 'bold 12px sans-serif';
		screenctx.fillText('x:' + screentlx + ' y:' + screently, screenwidth-90, screenheight-65);

		for(i=0; i<seclist.length; i++)
		{
			screenctx.fillText(seclist[i].toString() + ':', screenwidth-90, screenheight-(50 - 15*i));  
			screenctx.fillText(sectors[seclist[i]].topleftx.toString(), screenwidth-75, screenheight-(50 - 15*i));  
			screenctx.fillText(sectors[seclist[i]].toplefty.toString(), screenwidth-30, screenheight-(50 - 15*i));
		}
	};

	var Isometric = {};

	Isometric.init         = init;
	Isometric.setMapData   = setMapData;
	Isometric.drawViewport = drawViewport;


	Isometric.FULLSCREEN   = 1;
	Isometric.RELATIVE_DIV = 2;

	return Isometric;
});