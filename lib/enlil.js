

var Enlil = (function () {
   var Enlil = {
      version:   '0.0.1',
      actors:    [],
      nextDivId:  1,
   };

   Enlil.delay = function(seconds) {

   };

   Enlil.getNextDivId = function()
   {
      return 'div_' + Enlil.nextDivId++;
   }

   onLoaderChange = function( newState ) {
      console.log(newState);

      switch(newState)
      {
         case 'finished':
         break;
      }

      Enlil.loadingDiv.innerHTML = 'STATUS: ' + newState;
   };

   Enlil.loadPackage = function( url, stageDiv, startFunc ) {
      Enlil.stageDiv   = document.getElementById(stageDiv);
      Enlil.loadingDiv = document.createElement('div');
      
      Enlil.loadingDiv.style.position="absolute";
      Enlil.stageDiv.appendChild(Enlil.loadingDiv);

      Loader.addObserver(onLoaderChange);
      Loader.requestPackage(url, startFunc);
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

      /* Draw the stage background first. */
      Actors.draw(0, 0, 0, 0);

      for( var i = 1; i < Actors.getLength(); i++)
      {
         /* Draw actor with specified group? */
         if(locations[i-1].gid)
         {
            rollover = Sheets.getGroupLength(Actors.getSheet(i), locations[i-1].gid);

            Actors.drawGroup(i, locations[i-1].gid, Enlil.frameCount%rollover, locations[i-1].x, locations[i-1].y);
         }
         else
         {
            /* Don't use groups, just raw offset. */
            Actors.draw(i, Enlil.frameCount%4, locations[i-1].x, locations[i-1].y);
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
