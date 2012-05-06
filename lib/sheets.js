

define(function (require) {
   var sheets = {};

   function add(id, data) {
      sheets[id]       = data;
      sheets[id].image = new Image();

      var onImgLoaded  = function () {
         sheets[id].wcount = Math.floor(sheets[id].image.width / sheets[id].cwidth);
         sheets[id].hcount = Math.floor(sheets[id].image.height / sheets[id].cheight);
      };

      sheets[id].image.onload = onImgLoaded;
      sheets[id].image.src    = data.resource;
   };

   function getCanvasWithCell(id, offset) {
      var canvas = document.createElement('canvas');
      var context;

      canvas.width  = sheets[id].cwidth;
      canvas.height = sheets[id].cheight;

      context = canvas.getContext('2d');

      drawCell(id, ctx, offset);

      return canvas;
   };

   function drawCell(id, ctx, offset) {
      if(!sheets[id].image.complete)
         return;
 
      var sx = offset % sheets[id].wcount;
      var sy = Math.floor(offset / sheets[id].wcount);

      ctx.drawImage( sheets[id].image, 
                     sx * sheets[id].cwidth,
                     sy * sheets[id].cheight,
                     sheets[id].cwidth,
                     sheets[id].cheight,
                     0,
                     0,
                     sheets[id].cwidth,
                     sheets[id].cheight);
   };

   function drawCellForGroup(id, ctx, group, groupOffset) {
      if(!sheets[id].image.complete)
         return;

      var offset  = sheets[id].groups[group][0] + groupOffset;
      var sx      = offset % sheets[id].wcount;
      var sy      = Math.floor(offset / sheets[id].wcount);

      ctx.drawImage( sheets[id].image, 
                     sx * sheets[id].cwidth,
                     sy * sheets[id].cheight,
                     sheets[id].cwidth,
                     sheets[id].cheight,
                     0,
                     0,
                     sheets[id].cwidth,
                     sheets[id].cheight);
   };  

   function getCharDims(id) {
      return   {
                   cwidth : sheets[id].cwidth,
                  cheight : sheets[id].cheight
               };
   };

   function getGroupLength(id, group) {
     return (sheets[id].groups[group][1] - sheets[id].groups[group][0])+1;
   };

   var Sheets = {};

   Sheets.add               = add;
   Sheets.getCanvasWithCell = getCanvasWithCell;
   Sheets.drawCell          = drawCell;
   Sheets.drawCellForGroup  = drawCellForGroup;
   Sheets.getCharDims       = getCharDims;
   Sheets.getGroupLength    = getGroupLength;
   
   return Sheets;
});
