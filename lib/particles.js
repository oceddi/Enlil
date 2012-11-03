define(function(require) {
	var active = [];

	// Constructor
	var Particles = function(emitter) {

		this.width         = emitter.width;
		this.height        = emitter.height;
		this.rate          = emitter.rate;
		this.accelleration = emitter.accelleration;
		this.hue           = emitter.hue;
		this.saturation    = emitter.saturation;
		this.lightness     = emitter.lightness;
		this.alpha         = emitter.alpha;
		this.shape         = emitter.shape;
		this.size          = emitter.size;
		this.dieoff        = emitter.dieoff;
		this.finishEffect  = emitter.finishEffect;

		this.particles = [];
		this.div       = document.createElement('div');
		this.canvas    = document.createElement('canvas');

    //document.body.appendChild(this.div);
    this.div.style.position    = "relative";
    this.canvas.style.position = "absolute";    
    //this.div.style.border      = "1px solid black";
    this.div.style.left = -this.width/2 + "px";
    this.div.style.top  = -this.height/2 + "px";   
    this.div.style.width  = this.width  + "px";
    this.div.style.height = this.height + "px";

    this.div.appendChild(this.canvas);
		this.canvas.width  = this.width;
		this.canvas.height = this.height;

		//active.push(this);

		// object methods
		this.activate         = activate;
		this.create           = create;
		this.update           = update;
		this.render           = render;
		this.remove           = remove;
		this.clear            = clear;

		return active.length-1;
	}

	function activate() {
		document.body.appendChild(this.div);
		active.push(this);
	}

	function rand(rMi, rMa){
		if(rMi === rMa)
			return rMi;

		return ~~((Math.random()*(rMa-rMi+1))+rMi);
	}

	function frand(rMi, rMa) {
		if(rMi === rMa)
			return rMi;

		return rMi + (rMa - rMi)*Math.random();
	}

  function rgb2hsl(rgb) {
		var r = rgb[0]/255,
		    g = rgb[1]/255,
		    b = rgb[2]/255,
		    min = Math.min(r, g, b),
		    max = Math.max(r, g, b),
		    delta = max - min,
		    h, s, l;

		if (max == min)
		  h = 0;
		else if (r == max) 
		  h = (g - b) / delta; 
		else if (g == max)
		  h = 2 + (b - r) / delta; 
		else if (b == max)
		  h = 4 + (r - g)/ delta;

		h = Math.min(h * 60, 360);

		if (h < 0)
		  h += 360;

		l = (min + max) / 2;

		if (max == min)
		  s = 0;
		else if (l <= 0.5)
		  s = delta / (max + min);
		else
		  s = delta / (2 - max - min);

		return [h, s * 100, l * 100];
  }

	function create() {

		for(var i=0; i<this.rate; i++)
		{
			var w = rand(this.size[0], this.size[1]);
			var h = rand(this.size[2], this.size[3]);
			var start = -h;
			var polys;

			if(this.accelleration[2] < 0)
				start = this.canvas.height - h/2;
			else if(this.accelleration[2] === 0)
				start = this.canvas.height/2;

			if(this.shape <= 2)
				polys = [[0, 0], [0, h]];
			else if(this.shape <= 3)
				polys = [[0, 0], [w, 0], [w/2, h]];
			else
				polys = [[0, 0], [w, 0], [w, h], [0, h]];

			this.particles.push(
				{
					parent: Particles,
					x : rand(10+(w/2), this.canvas.width-10-(w/2)),
					y : start,
					ax : frand(this.accelleration[0], this.accelleration[1]),
					ay : frand(this.accelleration[2], this.accelleration[3]),
					vx : 0,
					vy : 0,
					width : w,
					height : h,
					polys : polys,
					age : 0,
					hue : rand(this.hue[0], this.hue[1]),
					saturation : rand(this.saturation[0], this.saturation[1]),
					lightness  : rand(this.lightness[0], this.lightness[1]),
					alpha : frand(this.alpha[0], this.alpha[1]),
					dieoff : rand(this.dieoff[0], this.dieoff[1])
				}
			);
		}
	}

	function update() {
		for(var i=0; i<this.particles.length; i++)
		{
			var p = this.particles[i];

			p.vx  += p.ax; 
			p.vy  += p.ay;
			p.x   += p.vx;
			p.y   += p.vy;
			p.age += 1;		
		}
	}

	function render() {
		var ctx = this.canvas.getContext('2d');

		for(var i=0; i<this.particles.length; i++)
		{
			var p = this.particles[i];

			ctx.strokeStyle = 'hsla('+ p.hue +', '+ p.saturation +'%, '+ p.lightness +'%, ' + p.alpha + ')';
			ctx.beginPath();

			ctx.moveTo(p.x + p.polys[0][0], p.y + p.polys[0][1]);
			for (var j = 1, k = p.polys.length; j < k; j ++) {
				ctx.lineTo(p.x + p.polys[j][0], p.y + p.polys[j][1]);
			}
			ctx.lineTo(p.x + p.polys[0][0], p.y + p.polys[0][1]);

			if(k <= 2)
			{
				ctx.lineWidth = p.width/2;
				ctx.lineCap = 'round';
			}
			ctx.stroke();
		}
	}

	function remove() {
		for(i=0; i<this.particles.length;)
		{
			var p = this.particles[i];

			if(p.dieoff !== 0)
			{
				if(p.age > p.dieoff)
				{
					if(this.finishEffect !== undefined)
						this.finishEffect(this.canvas, p);

					this.particles.splice(i, 1);
					continue;
				}
			}
			
			i++;
		}
	}

	function clear() {
		var ctx = this.canvas.getContext('2d');

		ctx.globalCompositeOperation = 'destination-out';
		ctx.fillStyle = 'rgba(255,255,255,.06)';
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.globalCompositeOperation = 'lighter';
	}

	function processParticles() {
		var i;

		for(i = 0; i < active.length; i++)
		{
			active[i].clear();
      active[i].create();
      active[i].update();
      active[i].render();
      active[i].remove();
		}
	}

	// class methods
  Particles.rand             = rand;
  Particles.frand            = frand;
  Particles.rgb2hsl          = rgb2hsl;
	Particles.processParticles = processParticles;

	return Particles;
});