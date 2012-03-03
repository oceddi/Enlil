
var Actors = ( function() {
   var actors = [];

   var Actors = {};

   /* params { name, sheet, } */
   Actors.add = function(params) {
      if(!params.name)
      {
         return;
      }

      var newOne =
      {
           name : params.name,
            div : document.getElementById(params.div),
         canvas : document.createElement('canvas'),
      };

      
      newOne.div.appendChild(newOne.canvas);

      if(!params.relative)
      {
         /* Set the div to absolute positioning to make it easy to move. */
         newOne.div.style.position="absolute";
      }

      actors.push(newOne);

      Actors.setSheet(actors.length-1, params.sheetid);
   };

   Actors.getIdForName = function(name) {
      for(var i=0; i<actors.length; i++)
      {
         if(actors[i].name == name)
            return i;
      }
      return -1;
   };

   Actors.getLength = function() {
      return actors.length;
   };

   Actors.getSheet = function(id)  {
      return actors[id].sheetid;
   };

   Actors.setSheet = function(id, sheetid) {
      var dims = Sheets.getCharDims(sheetid);

      /* Resize canvas. */
      actors[id].sheetid       = sheetid;
      actors[id].canvas.width  = dims.cwidth;
      actors[id].canvas.height = dims.cheight;
   };

   Actors.draw = function(id, offset, dx, dy) {
      var ctx = actors[id].canvas.getContext('2d');

      ctx.clearRect(0, 0, actors[id].canvas.width, actors[id].canvas.height);
      Sheets.drawCell(actors[id].sheetid, ctx, offset);
      
      actors[id].div.style.left = (dx)+"px";
      actors[id].div.style.top  = (dy)+"px";
   };

   Actors.drawGroup = function(id, groupName, groupOffset, dx, dy) {
      var ctx = actors[id].canvas.getContext('2d');

      ctx.clearRect(0, 0, actors[id].canvas.width, actors[id].canvas.height);
      Sheets.drawCellForGroup(actors[id].sheetid, ctx, groupName, groupOffset);
      
      actors[id].div.style.left = (dx)+"px";
      actors[id].div.style.top  = (dy)+"px";      
   };

   return Actors;
})();
