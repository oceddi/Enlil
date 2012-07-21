
define(function(require) {

	function intersectsRect(x1, y1, w1, h1, x2, y2, w2, h2) {
	    if (x2 > (w1 + x1) || x1 > (w2 + x2)) return false;
	    if (y2 > (h1 + y1) || y1 > (h2 + y2)) return false;

		return true;
	}

	function intersectsCircleRect(x1, y1, w1, h1, x2, y2, radius) {
		var cx = Math.abs(x2 - x1);
		var cy = Math.abs(y2 - y1);

		if(cx > (w1/2 + radius)) return false;
		if(cy > (h1/2 + radius)) return false;

		if(cx <= (w1/2)) return true;
		if(cy <= (h1/2)) return true;

		var cdsq = Math.pow((cx - w1/2), 2) + Math.pow((cy - h1/2), 2);

		return (cdsq <= Math.pow(radius, 2));
	}

	function intersectsBitmap(x1, y1, w1, h1, x2, y2, w2, h2, pixels1, pixels2) {
		if(!intersectsRect(x1, y1, w1, h1, x2, y2, w2, h2))
			return false;

	    /* Per pixel check of overlapping rectangle...*/
	    var xMin = Math.max(x1, x2);
	    var xMax = Math.min(x1+w1, x2+w2);
	    var yMin = Math.max(y1, y2);
	    var yMax = Math.min(y1+h1, y2+h2);

	    for ( var pixelX = xMin; pixelX < xMax; pixelX++ ) {
    		for ( var pixelY = yMin; pixelY < yMax; pixelY++ ) {
        		if ((pixels1[ ((pixelX-x1) + (pixelY-y2)*w1)*4 + 3 ] !== 0) &&
                	(pixels2[ ((pixelX-x2) + (pixelY-y2)*w2)*4 + 3 ] !== 0))
               	{
            		return true;
        		}
    		}
		}

		return false;
	}


	var Physics = {};

	Physics.intersectsRect       = intersectsRect;
	Physics.intersectsCircleRect = intersectsCircleRect;
	Physics.intersectsBitmap     = intersectsBitmap

	return Physics;
});