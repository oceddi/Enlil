/* Large portions of this file copied from jcoglan Sylvester.js located here:
/* https://github.com/jcoglan/sylvester                           
/* 
/* (The MIT License)
/* 
/* Copyright (c) 2007-2012 James Coglan

/* Permission is hereby granted, free of charge, to any person obtaining a copy of
/* this software and associated documentation files (the 'Software'), to deal in
/* the Software without restriction, including without limitation the rights to use,
/* copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
/* Software, and to permit persons to whom the Software is furnished to do so,
/* subject to the following conditions:

/* The above copyright notice and this permission notice shall be included in all
/* copies or substantial portions of the Software.

/* THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
/* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
/* FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
/* COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
/* IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
/* CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */


define(function() {
  Vector = function() {};

  Vector.create = function(elements)
  {
    var V = new Vector();
    return V.setElements(elements);
  }

  Vector.prototype = {

    e: function(i) {
      return ( i < 1 || i > this.elements.length) ? null : this.elements[i-1];
    },

    modulus: function() {
      return Math.sqrt(this.dot(this));
    },

    map: function(fn, context) {
      var elements = [];
      this.forEach(function(x, i) {
        elements.push(fn.call(context, x, i));
      });
      return Vector.create(elements);
    },

    forEach: function(fn, context) {
      var n = this.elements.length;
      for (var i = 0; i < n; i++) {
        fn.call(context, this.elements[i], i+1);
      }
    },

    toUnitVector: function() {
      var r = this.modulus();
      if (r === 0) { return this.dup(); }
      return this.map(function(x) { return x/r; });
    },

    dup: function()
    {
      return Vector.create(this.elements);
    },

    add: function(vector) {
      var V = vector.elements || vector;
      if ( this.elements.length !== V.length) { return null; }
      return this.map(function(x, i) { return x + V[i-1]; })
    },

    subtract: function(vector) {
      var V = vector.elements || vector;
      if ( this.elements.length !== V.length) { return null; }
      return this.map(function(x, i) { return x - V[i-1]; })
    },

    multiply: function (k)
    {
      return this.map(function(x) { return x*k; });
    },
    
    dot: function(vector) {
      var V = vector.elements || vector;
      var i, product = 0, n = this.elements.length;
      if (n !== V.length) { return null; }
      while (n--) { product += this.elements[n] * V[n]; }
      return product;
    },

    max: function() {
      var m = 0, i = this.elements.length;
      while (i--) {
        if (Math.abs(this.elements[i]) > Math.abs(m)) { m = this.elements[i]; }
      }
      return m;
    },

    maximum: function(vector) {
      var V = vector.elements || vector;
      if ( this.elements.length !== V.length) { return null; }
      return this.map(function(x, i) { 
        if (V[i-1] > x)
          return V[i-1];
        else
          return x;
      })
    },

    minimum: function(vector) {
      var V = vector.elements || vector;
      if ( this.elements.length !== V.length) { return null; }
      return this.map(function(x, i) {
        if (V[i-1] < x)
          return V[i-1];
        else
          return x;
      })
    },

    distanceFrom: function(obj) {
      var V = obj.elements || obj;
      if (V.length !== this.elements.length) { return null; }
      var sum = 0, part;
      this.forEach(function(x, i) {
        part = x - V[i-1];
        sum += part * part;
      });
      return Math.sqrt(sum);
    },

    setElements: function(els) 
    {
      this.elements = (els.elements || els).slice();
      return this;
    }
  };

  return Vector;
});