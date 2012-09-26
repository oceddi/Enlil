define(function(require) {
	var active = [];

	function init(emitter) {

		emitter.particles = [];
		emitter.div       = document.createElement('div');
		emitter.canvas    = document.createElement('canvas');

    document.body.appendChild(emitter.div);
    emitter.div.appendChild(emitter.canvas);
		emitter.canvas.width  = emitter.width;
		emitter.canvas.height = emitter.height;

		active.push(emitter);

		return active.length-1;
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

	function create(id) {

		for(var i=0; i<active[id].rate; i++)
		{
			var w = rand(active[id].size[0], active[id].size[1]);
			var h = rand(active[id].size[2], active[id].size[3]);
			var start = -h;
			var polys;

			if(active[id].accelleration[2] < 0)
				start = active[id].canvas.height - h/2;
			else if(active[id].accelleration[2] === 0)
				start = active[id].canvas.height/2;

			if(active[id].shape <= 2)
				polys = [[0, 0], [0, h]];
			else if(active[id].shape <= 3)
				polys = [[0, 0], [w, 0], [w/2, h]];
			else
				polys = [[0, 0], [w, 0], [w, h], [0, h]];

			active[id].particles.push(
				{
					parent: Particles,
					x : rand(10+(w/2), active[id].canvas.width-10-(w/2)),
					y : start,
					ax : frand(active[id].accelleration[0], active[id].accelleration[1]),
					ay : frand(active[id].accelleration[2], active[id].accelleration[3]),
					vx : 0,
					vy : 0,
					width : w,
					height : h,
					polys : polys,
					age : 0,
					hue : rand(active[id].hue[0], active[id].hue[1]),
					saturation : rand(active[id].saturation[0], active[id].saturation[1]),
					lightness  : rand(active[id].lightness[0], active[id].lightness[1]),
					alpha : frand(active[id].alpha[0], active[id].alpha[1]),
					dieoff : rand(active[id].dieoff[0], active[id].dieoff[1])
				}
			);
		}
	}

	function update(id) {
		for(var i=0; i<active[id].particles.length; i++)
		{
			var p = active[id].particles[i];

			p.vx  += p.ax; 
			p.vy  += p.ay;
			p.x   += p.vx;
			p.y   += p.vy;
			p.age += 1;		
		}
	}

	function render(id) {
		var ctx = active[id].canvas.getContext('2d');

		for(var i=0; i<active[id].particles.length; i++)
		{
			var p = active[id].particles[i];

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

	function remove(id) {
		for(i=0; i<active[id].particles.length;)
		{
			var p = active[id].particles[i];

			if(p.dieoff !== 0)
			{
				if(p.age > p.dieoff)
				{
					if(active[id].finishEffect !== undefined)
						active[id].finishEffect(active[id].canvas, p);

					active[id].particles.splice(i, 1);
					continue;
				}
			}
			
			i++;
		}
	}

	function clear(id) {
		var ctx = active[id].canvas.getContext('2d');

		ctx.globalCompositeOperation = 'destination-out';
		ctx.fillStyle = 'rgba(255,255,255,.06)';
		ctx.fillRect(0, 0, active[id].canvas.width, active[id].canvas.height);
		ctx.globalCompositeOperation = 'lighter';
	}

	function processParticles() {
		var i;

		for(i = 0; i < active.length; i++)
		{
			Particles.clear(i);
      Particles.create(i);
      Particles.update(i);
      Particles.render(i);
      Particles.remove(i);
		}
	}


	var Particles = {};

	Particles.init             = init;
	Particles.rand             = rand;
	Particles.create           = create;
	Particles.update           = update;
	Particles.render           = render;
	Particles.remove           = remove;
	Particles.clear            = clear;
	Particles.processParticles = processParticles;

	return Particles;
});