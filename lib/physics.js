
define(function(require) {

	var phyInst = [];

	function intersectsLineLine(a1, a2, b1, b2) {
		var result;
		var ua_t=(b2.x-b1.x)*(a1.y-b1.y)-(b2.y-b1.y)*(a1.x-b1.x);
		var ub_t=(a2.x-a1.x)*(a1.y-b1.y)-(a2.y-a1.y)*(a1.x-b1.x);
		var u_b=(b2.y-b1.y)*(a2.x-a1.x)-(b2.x-b1.x)*(a2.y-a1.y);

		if(u_b!=0) {
			var ua=ua_t/u_b;
			var ub=ub_t/u_b;

			if(0 <= ua && ua<=1 && 0<=ub && ub<=1) {
				return true;
			} else { 
				return false;
			}
		} else {
			if(ua_t==0 || ub_t==0) {
				return true;
			} else {
				return false;
			}
		}
		return result;
	}

	function intersectsLineRect(a1, a2, topLeft, topRight, bottomLeft, bottomRight) {
		var inter1=intersectsLineLine(topLeft,     topRight,    a1, a2);
		var inter2=intersectsLineLine(topRight,    bottomRight, a1, a2);
		var inter3=intersectsLineLine(bottomRight, bottomLeft,  a1, a2);
		var inter4=intersectsLineLine(bottomLeft,  topLeft,     a1, a2);

		if(inter1 || inter2 || inter3 || inter4)
			return true;

		return false;
	}

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

	function instantiate(data) {
		if(data.timeStart === undefined)
			data.timeStart = (new Date()).getTime()/1000;

		phyInst.push(data);

		return phyInst.length -1;
	}

	function updateTime(inst, newTime) {
		phyInst[inst].timeStart = newTime;
	}

	function copyState(source, dest) {
		dest.x = source.x;
		dest.y = source.y;
		dest.vx = source.vx;
		dest.vy = source.vy;
		dest.timeStart = source.timeStart;
		dest.collider = source.collider;
	}

	function applyState(inst, state) {
		Physics.copyState(state, phyInst[inst]);
	}

	function accelleration(state, dt, accellerator) {

		switch (accellerator)
		{
			case Physics.GRAVITY:
			{
				var g = 32;

				var ret = {
					x : 0,
					y : g*g
				};
			}
			break;

			case Physics.SPRING_DAMPER:
			{
				// Spring properties hardcoded for now
				var k = 10;
				var b = 1;

				var ret = {
					x : (-k * state.x) - (b*state.vx),
					y : (-k * state.y) - (b*state.vy)
				};
			}
			break;
		}

		return ret;
	}

	function evaluate(istate, time, dt, d, integrator) {
		var output;

		switch (integrator) 
		{
			case Physics.RUNGE_KUTTA:
			{
				var state = {
					 x : istate.x  + (d.dx * dt),
					 y : istate.y  + (d.dy * dt),
					vx : istate.vx + (d.dvx * dt),
					vy : istate.vy + (d.dvy * dt)
				};

				var tmp = accelleration(state, time+dt, Physics.GRAVITY);

				output = {
					 dx : state.vx,
					 dy : state.vy,
					dvx : tmp.x,
					dvy : tmp.y
				};
			}
			break;
		}

		return output;
	}

	function integrator(state, time, dt, integrator) {

		switch (integrator)
		{
			case Physics.EULER:
			{
				state.x = state.x + state.vx * dt;
				state.y = state.y + state.vy * dt;
				state.vx = state.vx + (state.fx / state.mass) * dt;
				state.vy = state.vy + (state.fy / state.mass) * dt;
			}
			break;

			case Physics.EULER_IMPROVED:
			{

			}
			break;

			case Physics.RUNGE_KUTTA:
			{
				var start = {
					 dx : 0,
					 dy : 0,
					dvx : 0,
					dvy : 0
				};

				var a = evaluate(state, time, 0.0, start, integrator);
				var b = evaluate(state, time, dt*0.5, a, integrator);
				var c = evaluate(state, time, dt*0.5, b, integrator);
				var d = evaluate(state, time, dt, c, integrator);

				var dxdt  = 1.0/6.0 * (a.dx + 2.0 * (b.dx + c.dx) + d.dx);
				var dydt  =	1.0/6.0 * (a.dy + 2.0 * (b.dy + c.dy) + d.dy);
				var dvxdt = 1.0/6.0 * (a.dvx + 2.0 * (b.dvx + c.dvx) + d.dvx);
				var dvydt = 1.0/6.0 * (a.dvy + 2.0 * (b.dvy + c.dvy) + d.dvy);

				state.x = state.x + (dxdt * dt);
				state.y = state.y + (dydt * dt);
				state.vx = state.vx + (dvxdt * dt);
				state.vy = state.vy + (dvydt * dt);
			}
			break;
		}
	}

	function interpolate(inst, timeNow, screentlx, screently) {
		var entry = phyInst[inst];
		var next = {};
		var collision = false;

		copyState(entry, next);

		integrator(next, next.timeStart, (timeNow-next.timeStart), Physics.RUNGE_KUTTA);

		return next;
	}

	function interpolateAll(screentlx, screently) {
		var locations = [];
		var timeNow = (new Date()).getTime()/1000;

		for(var i=0; i<phyInst.length; i++) {
			locations.push(Physics.interpolate(i, timeNow, screentlx, screently));
		}

		return locations;
	}

	function changeAttributes(inst, vx, vy, ax, ay) {
		var entry = phyInst[inst];

		/* Change Velocity */
		entry.vx = vx;
		entry.vy = vy;

		/* Change Accelleration? */
		if(ax !== undefined && ay !== undefined)
		{
			entry.dvx = ax;
			entry.dvy = ay;
		}
	}

	function getAttributes(inst) {
		return phyInst[inst];
	}

	function defaultCollider()
	{
		return false;
	}

	function checkCollisions(inst, data) {
		return phyInst[inst].collider(data);
	}


	var Physics = {};

	Physics.intersectsLineLine   = intersectsLineLine;
	Physics.intersectsLineRect   = intersectsLineRect;
	Physics.intersectsRect       = intersectsRect;
	Physics.intersectsCircleRect = intersectsCircleRect;
	Physics.intersectsBitmap     = intersectsBitmap;

	Physics.instantiate          = instantiate;
	Physics.updateTime           = updateTime;
	Physics.copyState            = copyState;
	Physics.applyState           = applyState;
	Physics.interpolate          = interpolate;
	Physics.interpolateAll       = interpolateAll;
	Physics.changeAttributes     = changeAttributes;
	Physics.getAttributes        = getAttributes;
	Physics.defaultCollider      = defaultCollider;
	Physics.checkCollisions      = checkCollisions;

	Physics.EULER          = 1;
	Physics.EULER_IMPROVED = 2;
	Physics.RUNGE_KUTTA    = 3;

	Physics.SPRING_DAMPER  = 1;

	return Physics;
});