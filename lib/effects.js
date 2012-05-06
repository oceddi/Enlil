
var Vector = function(x,y,z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
Vector.prototype.copy    = function() { return new Vector(this.x, this.y, this.z) }
Vector.prototype.add     = function(v) { return this.copy().add_(v) }
Vector.prototype.add_    = function(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this}
Vector.prototype.sub     = function(v) { return this.copy().sub_(v) }
Vector.prototype.sub_    = function(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this}
Vector.prototype.round_  = function() { this.x=Math.round(this.x); this.y = Math.round(this.y); this.z=Math.round(this.z); return this }
Vector.prototype.round   = function() { return this.copy().round_() }
Vector.prototype.scale   = function(s) { return this.copy().scale_(s) }
Vector.prototype.scale_  = function(s) { this.x *= s; this.y *= s; this.z *= s; return this }
Vector.prototype.dot     = function(v) { return this.x * v.x + this.y * v.y + this.z * v.z }
Vector.prototype.norm    = function(v) { return this.copy().scale(1/this.mag()) }
//project self in direction of v
Vector.prototype.proj    = function(v) { return v.scale(this.dot(v)/v.selfdot());}
Vector.prototype.selfdot = function() { return this.dot(this) }
Vector.prototype.sumOfSquaresTo = Vector.prototype.selfdot
Vector.prototype.mag     = function() { return Math.sqrt(this.selfdot()) }
var Vector2 = function(x,y) { Vector.call(this, x,y,0) }
var Vector3 = function(x,y,z) { Vector.call(this, x,y,z) }
Vector2.prototype = Vector.prototype;
Vector2.prototype.rotate_ = function(ang, rads) {
   if (!rads) ang = ang*Math.PI/180
   var cos=Math.cos(ang), sin=Math.sin(ang), x=this.x, y=this.y;
   this.x = cos*x - sin*y;
   this.y = cos*y + sin*x;
   return this;
}
Vector2.prototype.rotate = function(ang) { return this.copy().rotate_(ang) }
Vector3.prototype = Vector.prototype;
Vector.prototype.toString = function() { return "(" + this.x + "," + this.y + "," + this.z + ")"; }

var Effects = (function() {

	function explode(id, offset, frameCount, center) {
		var frames = [];

		/* Assemble n frames of animation into an array of canvas items.*/

		var sheetid     = Actors.getSheet(id);
		var origCanvas  = Sheets.getCanvasWithCell(sheetid, offset);
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
			ctx	          = canvas.getContext('2d');
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

	var Effects = {};

	Effects.expode = explode;

	return Effects;
})();