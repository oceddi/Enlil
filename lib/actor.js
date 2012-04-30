
define( function(require) {

   var Sheets = require('../lib/sheets');

   var actors = [];

   /* params { name, sheet, } */
   function add(params) {
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

   function getIdForName(name) {
      for(var i=0; i<actors.length; i++)
      {
         if(actors[i].name == name)
            return i;
      }
      return -1;
   };

   function getLength() {
      return actors.length;
   };

   function getSheet(id)  {
      return actors[id].sheetid;
   };

   function setSheet(id, sheetid) {
      var dims = Sheets.getCharDims(sheetid);

      /* Resize canvas. */
      actors[id].sheetid       = sheetid;
      actors[id].canvas.width  = dims.cwidth;
      actors[id].canvas.height = dims.cheight;
   };

   function draw(id, offset, dx, dy) {
      var ctx = actors[id].canvas.getContext('2d');

      ctx.clearRect(0, 0, actors[id].canvas.width, actors[id].canvas.height);
      Sheets.drawCell(actors[id].sheetid, ctx, offset);
      
      actors[id].div.style.left = (dx)+"px";
      actors[id].div.style.top  = (dy)+"px";
   };

   function drawGroup(id, groupName, groupOffset, dx, dy) {
      var ctx = actors[id].canvas.getContext('2d');

      ctx.clearRect(0, 0, actors[id].canvas.width, actors[id].canvas.height);
      Sheets.drawCellForGroup(actors[id].sheetid, ctx, groupName, groupOffset);
      
      actors[id].div.style.left = (dx)+"px";
      actors[id].div.style.top  = (dy)+"px";      
   };

   var Actors = {};

   Actors.add          = add;
   Actors.getIdForName = getIdForName;
   Actors.getLength    = getLength;
   Actors.getSheet     = getSheet;
   Actors.setSheet     = setSheet;
   Actors.draw         = draw;
   Actors.drawGroup    = drawGroup;
   
   return Actors;
});
