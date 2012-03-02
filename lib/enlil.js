

var Enlil = (function () {
   var Enlil = {
      version:   '0.0.1',
      actors:    [],
      nextDivId:  1,
   };

   Enlil.getNextDivId = function()
   {
      return 'div_' + Enlil.nextDivId++;
   }

   Enlil.loadPackage = function(params) {
      
      Loader.loadPackage(params);
   };

   Enlil.startFPS = function() {
      Enlil.fps           = 0;
      Enlil.frameCount    = 0;
      Enlil.lastTimestamp = new Date;
      Enlil.currTimestamp = new Date;
      Enlil.avgDelay      = 0;
   };

   Enlil.drawFrame = function() {
      var i;
      var locations;
      var rollover;

      /* Calculate location and animation frame. */
      locations = Paths.interpolateAll();

      for( var i = 0; i < Actors.getLength(); i++)
      {
         /* Draw actor with specified group? */
         if(locations[i].gid)
         {
            rollover = Sheets.getGroupLength(Actors.getSheet(i), locations[i].gid);

            Actors.drawGroup(i, locations[i].gid, Enlil.frameCount%rollover, locations[i].x, locations[i].y);
         }
         else
         {
            /* Don't use groups, just raw offset. */
            Actors.draw(i, Enlil.frameCount%4, locations[i].x, locations[i].y);
         }
      }
   };

   Enlil.tick = function() {
      Enlil.frameCount++;
      Enlil.currTimestamp = new Date;
      var delay = Enlil.currTimestamp - Enlil.lastTimestamp;

      Enlil.avgDelay += (delay - Enlil.avgDelay) / 10;
      Enlil.lastTimestamp = Enlil.currTimestamp;
      Enlil.fps = (1000/Enlil.avgDelay).toFixed(1);
   };

   Enlil.registerRunLoop = function(func) {
      Enlil.runLoop = func;
   };

   Enlil.start = function(interval) {
      window.setInterval(Enlil.runLoop, interval);
   };

   return Enlil;
})();
