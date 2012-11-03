define(function(require) {

  var Vertex = require('../lib/vector');


  var Bombs = [];
  var Wind = [];

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

  // Verlet integration
  Verlet = function Verlet(initializer, constraints, pinned, iterations, x, y)
  {
    this.numParticles  = initializer.length;

    this.pos           = [];
    this.oldpos        = [];
    this.a             = [];
    this.gravity       = Vector.create([0, 0]);
    this.ftimeStep     = 0.2;
    this.numIterations = iterations;
    this.constraints   = [];
    this.pinned        = pinned;

    for(var i = 0; i < initializer.length; i++)
    {
      this.pos.push(Vertex.create(initializer[i].pos));
      this.oldpos.push(Vertex.create(initializer[i].oldpos));
      this.a.push(Vertex.create(initializer[i].a));
    }

    for(var i = 0; i < constraints.length; i++)
    {
      var a = constraints[i].a;
      var b = constraints[i].b;

      this.constraints.push(
        {
          'a' : a,
          'b' : b,
          'cl' : (this.pos[a].distanceFrom(this.pos[b])) * constraints[i].r, /* Rigidity */
          'rl' : (this.pos[a].distanceFrom(this.pos[b])),
          'r' : constraints[i].r
        }
      );
    }

    return this;
  }

  Verlet.prototype.removePins = function()
  {
    this.pinned.length = 0;
  }

  Verlet.setBomb = function(x, y)
  {
    Bombs.push(
      {
        x: x,
        y: y,
        time: 0.5
      }
    );
  }

  Verlet.setWind = function(x, y)
  {
    Wind.push(
      {
        x: x,
        y: y,
        strength : [0.0, 25],
        time: [1, 20],
        str : 0,
        t : 0
      }
    );
  }

  Verlet.bombTick = function()
  {
    if(Bombs.length)
    {
      for(var i=0; i<Bombs.length; i++)
      {
        Bombs[i].time -= 0.1;
      }

      for(var i=0; i<Bombs.length;)
      {
        if(Bombs[i].time <= 0)
          Bombs.splice(i, 1);
        else
          i++;
      }
    }
  }

  Verlet.windTick = function()
  {
    if(Wind.length)
    {
      for(var i=0; i<Wind.length; i++)
      {
        Wind[i].t -= 0.1;

        if(Wind[i].t <= 0)
        {
          Wind[i].str = frand(Wind[i].strength[0], Wind[i].strength[1]);
          Wind[i].t   = rand(Wind[i].time[0], Wind[i].time[1]);
        }
      }
    }
  }

  Verlet.prototype.accumulateForces = function()
  {
    // All particles are influenced by gravity
    for(var i=0; i < this.numParticles; i++)
    {
      this.a[i] = this.gravity;
    }

    if(Bombs.length)
    {
      for(var i=0; i<Bombs.length; i++)
      {
        var bomb = Vector.create([Bombs[i].x, Bombs[i].y]);

        // Push each particle away from the explosion a distance inversely
        // proportional to the square distance between the particle and the bomb center.
        for(var j=0; j < this.numParticles; j++)
        {
          var diff   = this.pos[j].subtract(bomb);
          var dist   = diff.modulus();
          var bombv  = diff.toUnitVector().multiply(1000000/(dist*dist));

          // Adjust acceleration of particle to account for explosion
          this.a[j] = this.a[j].add(bombv);
        }
      }
    }

    if(Wind.length)
    {
      for(var i=0; i<Wind.length; i++)
      {
        var wind     = Vector.create([Wind[i].x, Wind[i].y]);
        var strength = Wind[i].str;

        for(var j=0; j < this.numParticles; j++)
        {
          var diff   = this.pos[j].subtract(wind);
          var windv  = diff.toUnitVector().multiply(strength);

          this.a[j] = this.a[j].add(windv);
        }
      }
    }
  }

  Verlet.prototype.integrate = function()
  {
    for(var i=0; i < this.numParticles; i++)
    {
      var temp = this.pos[i].dup();
      // x += x-oldx+a*fTimeStep*fTimeStep;

      // Calculate velocity from the change in position (pos - oldpos) and then add velocity to current position.
      this.pos[i] = this.pos[i].add(((this.pos[i].subtract(this.oldpos[i])).add((this.a[i].multiply(this.ftimeStep * this.ftimeStep)))));
      this.oldpos[i] = temp;
    }
  }


  Verlet.prototype.satisfyConstraints = function()
  {
    for(var j=0; j < this.numIterations; j++)
    {
      // This is a push/pull constraint between two verlet points (a stick).
      for(var i=0; i < this.constraints.length; i++)
      {
        var delta = this.pos[this.constraints[i].b].subtract(this.pos[this.constraints[i].a]);

        var L2 = delta.dot(delta);
        var C2 = this.constraints[i].rl*this.constraints[i].rl;
        var d  = (this.constraints[i].r*(C2/(L2+C2)-0.5));

        var l = delta.multiply(d);

        this.pos[this.constraints[i].a] = this.pos[this.constraints[i].a].subtract(l);
        this.pos[this.constraints[i].b] = this.pos[this.constraints[i].b].add(l);




        //var delta = this.pos[this.constraints[i].b].subtract(this.pos[this.constraints[i].a]);
        
        // SQUARE ROOT APPROXIMATION
        //var rl2   = this.constraints[i].rl*this.constraints[i].rl;
        //delta = delta.multiply(rl2/(delta.dot(delta)+rl2)-0.5);

        //this.pos[this.constraints[i].a] = this.pos[this.constraints[i].a].subtract(delta);
        //this.pos[this.constraints[i].b] = this.pos[this.constraints[i].b].add(delta);

        






        // REAL SQUARE ROOT
        //var deltalength = Math.sqrt(delta.dot(delta));
        //var diff        = (deltalength - this.constraints[i].rl)/deltalength;

        //this.pos[this.constraints[i].a] = this.pos[this.constraints[i].a].add(delta.multiply(0.5*diff));
        //this.pos[this.constraints[i].b] = this.pos[this.constraints[i].b].subtract(delta.multiply(0.5*diff));
      }

      // Loop through pinned list and set back to specified point.
      for(var k=0; k < this.pinned.length; k++)
      {
        this.pos[this.pinned[k].index].setElements(this.pinned[k].pos);
      }

      if(1)
      {
        // box
        for(var i=0; i < this.numParticles; i++)
        {
          var temp = this.pos[i].maximum([0, 0]);
          this.pos[i] = temp.minimum([500, 500]);
        }
      } 

      if(0)
      {
        // stick
        var delta       = this.pos[1].subtract(this.pos[0]);
        var deltalength = Math.sqrt(delta.dot(delta));
        var diff        = (deltalength - 100)/deltalength;

        //console.log(delta.elements);

        this.pos[0] = this.pos[0].add(delta.multiply(0.5*diff));
        this.pos[1] = this.pos[1].subtract(delta.multiply(0.5*diff));
      }
    }
  }

  Verlet.prototype.timeStep = function()
  {
    this.accumulateForces();
    this.integrate();
    this.satisfyConstraints();
  }

  return Verlet;
 });