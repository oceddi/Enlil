define(function(require) {

   function calcGCost(square, parent) {
      var G       = 0;
      var current = square;

      while(parent)
      {
         if(current.x != parent.x && current.y != parent.y)
            G += 14; // diagonal to
         else
            G += 10; // next to

         current = parent;
         parent  = current.parent;
      }

      return G;
   }

   // Manhattan method
   function calcHCost(square, goal) {
      var H = 0;

      if(goal.x > square.x)
         H += goal.x - square.x;
      else
         H += square.x - goal.x;

      if(goal.y > square.y)
         H += goal.y - square.y;
      else
         H += square.y - goal.y;

      return H*10;
   }

   function aStar(start, goal, grid) {

      var openList   = new Object();
      var closedList = new Object();
      var curKey;
      var goalKey = goal.x+"-"+goal.y;
      var current;
      var path = [];

      start.F=0;
      start.G=0;
      start.H=0;

      openList[start.x+"-"+start.y] = start;

      do
      {
         // Look for the lowest F cost square on the open list
         curKey = null;
         {
            for(var key in openList)
            {
               if(!openList.hasOwnProperty(key))
                  continue;

               if(!curKey || openList[key].F < openList[curKey].F)
                  curKey=key;
            }
         }

         // no more keys on the openList?
         if(!curKey)
            break;

         current = openList[curKey];

         // Move this square from open to closed list.
         closedList[curKey] = current;
         delete openList[curKey];

         // Did we just add the goal to the closed list?  If so, we are done.
         if(curKey === goalKey)
            break;

         // check if 8 surrounding neighbors to current should be added to openList.
         for(var y=current.y-1; y < current.y+2; y++)
         {
            if(y<0 || y > grid.height-1) continue;

            for(var x=current.x-1; x < current.x+2; x++)
            {
               if(x<0 || x > grid.width-1 || (x === current.x && y === current.y))
                  continue;

               var square    = grid.squares[y][x];
               var squareKey = square.x+"-"+square.y;

               // not walkable or on the closed list?
               if(square.blocked === true || closedList[squareKey])
                  continue;

               // not on openList?
               if(!openList[squareKey])
               {
                  square.parent = current;

                  openList[squareKey] = square;

                  // Record the F, G, H cost of this square.
                  square.G = calcGCost(square, current);
                  square.H = calcHCost(square, goal);
                  square.F = square.G + square.H;
               }
               else
               {
                  // Already on the openList, Is this path better?
                  var newG = calcGCost(square, current);

                  if(newG < square.G)
                  {
                     // This is a better path, update the squares path.
                     square.parent = current;

                     square.G = newG;
                     square.F = square.G + square.H;
                  }
               }
            }
         }
      }
      while(1);

      if(curKey === goalKey)
      {
         // A path was found. Return it.
         do
         {
            path.unshift(current);
            current = current.parent;
         }
         while(current !== start);
         path.unshift(current);
      }
      else
      {
         path = null;
      }

      return path;
   }

   // constructor
   var AI = function(params) {
      this.aStar = aStar;
   }

   return AI;
});