

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
        stopped   : false,
        wpCount   : 0,
        runCount  : 0,
        automatic : data.automatic,
        repeats   : data.repeats,
        closeloop : data.closeloop,
        intervals : data.intervals,
      };

      /* if not an automatic path start out stopped. */
      if(!data.automatic)
         instances[inst].stopped = true;

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
      var tDelta  = 0;
      var loc;

      if(entry.stopped == false)
      {
         if(entry.timeStart == 0)
            entry.timeStart = timeNow;
         else
            tDelta = ((timeNow - entry.timeStart) - entry.totalTime) / 1000;

         if(entry.direction > 0)
            interval = entry.intervals[entry.current];
         else
            interval = entry.intervals[entry.next];

         if(tDelta >= interval)
         {
            entry.wpCount++;

            /* Advance to next keyframe */
            entry.current   = entry.next;
            entry.timeStart = timeNow;
            entry.totalTime = 0;
            tDelta = 0;

            if(paths[entry.id].waypoints[entry.next+entry.direction])
            {
               entry.next = entry.next + entry.direction;
            }
            else if(entry.repeats)
            {
               entry.runCount++;

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
            else
            {
               entry.stopped = true;
               entry.runCount++;
            }

            if(!entry.automatic)
            {
               entry.stopped = true;
            }
         }
      }
      
      /* P0 - Starting Point       P1 - End Point */
      var P0 = paths[entry.id].waypoints[entry.current];
      var P1 = paths[entry.id].waypoints[entry.next];

      entry.totalTime += tDelta;

      /* Calculate current time between these two waypoints (current and next) in time scale [0,1] */
      var t = tDelta/interval;

      /* If we are stopped, time is zero (we are not moving past current waypoint)  */
      if(entry.stopped == true)
         t = 0;

      /* Start with a linear Bezier curve calculation (2 points). */
      /* B(t) = P0 + t(P1-P0) = (1 - t)P0 + tP1        */
      loc = {
         'x'   :  parseInt((1 - t) * P0[0] + t*P1[0]),
         'y'   :  parseInt((1 - t) * P0[1] + t*P1[1]),
         'gid' :  entry.groups ? entry.groups[entry.current] : 0
      };

      return loc;
   };

   /* Tell a non-automatic (manual) path to continue animating on the next invocation of an interpolate function. */
   function resume(inst)
   {
      var now = (new Date).getTime();
      var sofar = instances[inst].totalTime;

      instances[inst].stopped    = false;
      instances[inst].timeStart  = (now - sofar);
   };

   /* Query the state of a non-repeating path (to tell if it has finished moving) */
   function hasStopped(inst)
   {
      return instances[inst].stopped;
   };

   function waypointCount(inst)
   {
      return instances[inst].wpCount; 
   };

   function runCount(inst)
   {
      return instances[inst].runCount; 
   };

   /* Resets a non-repeating path so it animates again on the next invocation of an interpolate function (from the beginning). */
   function reset(inst)
   {
      var entry   = instances[inst];

      entry.timeStart = 0;
      entry.totalTime = 0;
      entry.current   = 0;
      entry.next      = 1;
      entry.stopped   = false;
      entry.wpCount   = 0;
   };

   var Paths = {};
   Paths.add           = add;
   Paths.instantiate   = instantiate;
   Paths.interpolate   = interpolate;
   Paths.resume        = resume;
   Paths.hasStopped    = hasStopped;
   Paths.waypointCount = waypointCount;
   Paths.runCount      = runCount;
   Paths.reset         = reset;

   return Paths;
})();