

var Enlil = (function () {
   var Enlil = {
      version:   '0.0.1',
      actors:    [],
   };

   /* params { name, sheet, } */
   Enlil.createActor = function(params) {
      if(!params.name)
      {
         return;
      }

      Enlil.actors[params.name] = {
         div:    document.getElementById(params.div),
         canvas: document.createElement('canvas'),
      };

      Enlil.setActorSheet(params.name, params.sheetid);
      Enlil.actors[params.name].div.appendChild(Enlil.actors[params.name].canvas);

      /* Set the div to absolute positioning to make it easy to move. */
      Enlil.actors[params.name].div.style.position="absolute";
   };

   Enlil.getActorSheet = function(name)  {
      return Enlil.actors[name].sheetid;
   };

   Enlil.setActorSheet = function(name, sheetid) {
      var dims = Sheets.getCharDims(sheetid);

      /* Resize canvas. */
      Enlil.actors[name].sheetid       = sheetid;
      Enlil.actors[name].canvas.width  = dims.cwidth;
      Enlil.actors[name].canvas.height = dims.cheight;
   };

   Enlil.drawActor = function(name, offset, dx, dy) {
      var ctx = Enlil.actors[name].canvas.getContext('2d');

      ctx.clearRect(0, 0, Enlil.actors[name].canvas.width, Enlil.actors[name].canvas.height);
      Sheets.drawCell(Enlil.actors[name].sheetid, ctx, offset);
      
      Enlil.actors[name].div.style.left = (dx)+"px";
      Enlil.actors[name].div.style.top  = (dy)+"px";
   };

   Enlil.drawActorGroup = function(name, groupName, groupOffset, dx, dy) {
      var ctx = Enlil.actors[name].canvas.getContext('2d');

      ctx.clearRect(0, 0, Enlil.actors[name].canvas.width, Enlil.actors[name].canvas.height);
      Sheets.drawCellForGroup(Enlil.actors[name].sheetid, ctx, groupName, groupOffset);
      
      Enlil.actors[name].div.style.left = (dx)+"px";
      Enlil.actors[name].div.style.top  = (dy)+"px";      
   };

   Enlil.startFPS = function() {
      Enlil.fps           = 0;
      Enlil.frameCount    = 0;
      Enlil.lastTimestamp = (new Date).getTime();
      Enlil.currTimestamp = (new Date).getTime();
   };

   Enlil.tick = function() {
      Enlil.frameCount++;
      Enlil.currTimestamp = (new Date).getTime();

      if(Enlil.frameCount % 10 == 0) {
         Enlil.fps = parseInt(10000 / (Enlil.currTimestamp - Enlil.lastTimestamp));
         Enlil.lastTimestamp = Enlil.currTimestamp;
      }
   };

   Enlil.registerRunLoop = function(func) {
      Enlil.runLoop = func;
   };

   Enlil.start = function() {
      window.setInterval(Enlil.runLoop, 100);
   };

   return Enlil;
})();
