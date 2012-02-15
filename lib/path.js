

var Paths = ( function() {
   var idCounter = 1;
   var paths     = {};
   var instances = {};


   function getNextID()
   {
      return (idCounter++);
   }


   function add( id, data) {
      paths[id] = data;
   };

   function instantiate(id, data) {
      var inst     = id + '_' + getNextID(); 
      
      /* Make sure we have at least two waypoints. */

      instances[inst] = 
      {
        id        : id,
        timeStart : 0,
        totalTime : 0,
        direction : 1,
        current   : 0,
        next      : 1,
        repeats   : data.repeats,
        closeloop : data.closeloop,
        intervals : data.intervals,
      };

      /* Optional parameters */
      if(data.groups)
         instances[inst].groups = data.groups;

      return inst;
   };

   /* Bezier curve interpolation. */
   function interpolate(inst) {
      var entry   = instances[inst];
      var timeNow = (new Date).getTime();
      var interval;
      var tA;

      if(entry.timeStart == 0)
         entry.timeStart = timeNow;

      tA = ((timeNow - entry.timeStart) - entry.totalTime) / 1000;

      console.log( "tA: " + tA);

      if(entry.direction > 0)
         interval = entry.intervals[entry.current];
      else
         interval = entry.intervals[entry.next];

      if(tA >= interval)
      {
         /* Advance to next keyframe */
         entry.current   = entry.next;
         entry.timeStart = timeNow;
         entry.totalTime = 0;
         tA = 0;

         if(paths[entry.id].waypoints[entry.next+entry.direction])
         {
            entry.next = entry.next + entry.direction;
         }
         else if(entry.repeats)
         {
            if(entry.closeloop)
            {
               entry.next = 0;
            }
            else
            {
               /* Reverse direction of travel. */
               if(entry.direction > 0)
               {
                  entry.current = paths[entry.id].waypoints.length - 1;
                  entry.next    = paths[entry.id].waypoints.length - 2;
               }
               else
               {
                  entry.current = 0;
                  entry.next    = 1;                 
               }

               entry.direction = (-entry.direction);
            }
         }
      }

      /* P0 - Starting Point       P1 - End Point */
      var P0 = paths[entry.id].waypoints[entry.current];
      var P1 = paths[entry.id].waypoints[entry.next];

      entry.totalTime += tA;

      /* Time between each waypoint [0,1] */
      var t = tA/interval;

      /* Start with a linear Bezier curve calculation (2 points). */
      /* B(t) = P0 + t(P1-P0) = (1 - t)P0 + tP1        */
      var loc = {
         'x'   :  parseInt((1 - t) * P0[0] + t*P1[0]),
         'y'   :  parseInt((1 - t) * P0[1] + t*P1[1]),
         'gid' :  entry.groups ? entry.groups[entry.current] : 0
      };

      console.log("current: " + entry.current + " next: " + entry.next + " t: " + t);
      //console.log("P0: [" + P0[0] + "," + P0[1] + "] P1: [" + P1[0] + "," + P1[1] + "]");
      //console.log("curPath: " + entry.curPath + " t: " + t + " loc: [" + loc.x + ", " + loc.y + "]");

      return loc;
   };

   var Paths = {};

   Paths.add         = add;
   Paths.instantiate = instantiate;
   Paths.interpolate = interpolate;

   return Paths;
})();