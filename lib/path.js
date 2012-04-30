

define( function(require) {
   var paths     = {};
   var pathInst  = [];
   var animInst  = {};


   function resetIndices(indices, incrementing) {
      var count = indices.length;

      indices.length = 0;

      if(incrementing)
      {
         for (var i=0; i<count; i++)
         {
            indices.push(i);
         }
      }
      else
      {
         for (var i=count-1; i>=0; i--)
         {
            indices.push(i);
         }
      }
   };

   function swapIndices(indices) {
      var tmp;

      tmp = indices[0];
      indices[0] = indices[indices.length-1];
      indices[indices.length-1] = tmp;

      if(indices.length == 4)
      {
         tmp = indices[1];
         indices[1] = indices[2];
         indices[2] = tmp;
      }
   };

   function waypointForward(entry) {
      var waypoints = paths[entry.id].waypoints;
      var amount    = entry.direction;
      var reversed  = false;

      for(var i=0; i < entry.indices.length; i++)
      {
         /* Advance to next waypoint, if easily addressable. */
         if(waypoints[entry.indices[i]+amount])
         {
            /* Are we about to set the first indice to the last waypoint? */
            if(i == 0  && ((entry.indices[0]+amount) == (waypoints.length-1)))
            {
               if(!entry.closeLoop)
               {
                  if(entry.reverses)
                  {
                     return true;
                  }
                  else if(entry.repeats)
                  {
                     resetIndices(entry.indices, true);
                     return false;
                  }
                  else
                  {
                     entry.stopped = true;
                  }
               }
               else
               {
                  entry.indices[i] += amount;
               }
            }
            else
            {
               entry.indices[i] += amount;
            }
         }
         else if(entry.closeLoop)
         {
            // Wrap around
            entry.indices[i] = ((waypoints.length - (entry.indices[i] + 1))); //(amount - (waypoints.length - entry.indices[i]));

            // Did the last indice hit zero (indicates change of direction)?
            if(i == entry.indices.length-1 && entry.reverses)
               entry.direction = -(entry.direction);
         }
         else if(entry.reverses && (i == entry.indices.length-1))
         {
            /* Reverse direction. */
            reversed = true;
         }
         else if(entry.repeats)
         {
            /* Jump to start. */
            entry.indices[i] = 0;
         }
      }

      return reversed;
   };

   function waypointBackwards(entry) {
      var waypoints = paths[entry.id].waypoints;
      var amount    = entry.direction;
      var reversed  = false;

      for(var i=0; i < entry.indices.length; i++)
      {
         /* Advance to next keyframe, if easily addressable. */
         if(waypoints[entry.indices[i]+amount])
         {
            /* If advancing past first location, reverse directions. */
            if((i == 0) && (entry.indices[0]+amount == 0))
            {
               return true;
            }
            else
            {
               entry.indices[i] += amount;
            }
         }
         else if(entry.closeLoop)
         {
            entry.indices[i] = waypoints.length - Math.abs(amount);
         }
         else if(entry.reverses && (i == indices.length-1))
         {
            /* Reverse direction. */
            reversed = true;
         }
         else if(entry.repeats)
         {
            /* Jump to end. */
            entry.indices[i] = waypoints.length - 1;
         }
      }

      return reversed;
   };

   /* End internal functions. */

   function add( id, data) {
      paths[id] = data;
   };

   function instantiate(id, data) {
      var inst; 
      
      /* Make sure we have at least two waypoints. */

      pathInst.push( 
      {
        id        : id,
        timeStart : 0,
        totalTime : 0,
        direction : 1,
        indices   : [0, 1],
        stopped   : false,
        wpCount   : 0,
        runCount  : 0,
        automatic : data.automatic,
        repeats   : data.repeats,
        closeLoop : data.closeLoop,
        reverses  : data.reverses,
        curve     : data.curve,
        intervals : data.intervals,
      });

      inst = pathInst.length-1;

      /* if not an automatic path start out stopped. */
      if(!data.automatic)
         pathInst[inst].stopped = true;

      /* Optional parameters */
      if(data.groups)
         pathInst[inst].groups = data.groups;

      switch(data.curve)
      {
         case 'quadratic':
            pathInst[inst].indices.push(2);
            pathInst[inst].direction = 2;
            break;

         case 'cubic':
            pathInst[inst].indices.push(2);
            pathInst[inst].indices.push(3);         
            pathInst[inst].direction = 3;
            break;
      }

      //console.log(pathInst[inst].indices);

      return inst;
   };

   /* Bezier curve interpolation. */
   function interpolate(inst) {
      var entry   = pathInst[inst];
      var timeNow = (new Date).getTime();
      var tDelta  = 0;
      var interval;
      var loc;
      var skipAdvance = false;

      if(entry.stopped == false)
      {
         if(entry.timeStart == 0)
            entry.timeStart = timeNow;
         else
            tDelta = ((timeNow - entry.timeStart) - entry.totalTime) / 1000;

         if(entry.direction > 0)
            interval = entry.intervals[entry.indices[0]];
         else
            interval = entry.intervals[entry.indices[1]];

         if(tDelta >= interval)
         {
            entry.wpCount++;

            // console.log(entry.indices);

            /* Did we just enter into the final position? */
            if(entry.indices[entry.indices.length-1] == 0)
            {
               if(!entry.closeLoop)
                  entry.runCount++;

               if(!entry.repeats)
               {
                  entry.stopped = true;
               }
               else if(entry.reverses && entry.closeLoop)
               {
                  /* Reverse direction. */
                  entry.direction = -(entry.direction);
                  swapIndices(entry.indices);
                  skipAdvance = true;
               }
            }
            /* Did we just enter into the first position? */
            else if((entry.indices[0] == 0) && (entry.closeLoop))
            {
               entry.runCount++
            }

            if(!skipAdvance)
            {
               if(entry.direction > 0)
               {
                  if(waypointForward(entry))
                  {
                     /* Reverse direction. */
                     entry.direction = -(entry.direction);
                     swapIndices(entry.indices);
                  }
               }
               else
               {
                  if(waypointBackwards(entry))
                  {
                     /* Reverse direction. */
                     entry.direction = -(entry.direction);
                     swapIndices(entry.indices);
                  }
               }
            }

            entry.timeStart = timeNow;
            entry.totalTime = 0;
            tDelta = 0;

            if(!entry.automatic)
            {
               entry.stopped = true;
            }
         }
      }

      entry.totalTime += tDelta;

      /* Calculate current time between these two waypoints (0 and 1) in time scale [0,1] */
      var t = tDelta/interval;

      /* If we are stopped, time is zero (we are not moving past current waypoint)  */
      if(entry.stopped == true)
      {
         if(entry.closeLoop)
            t = 0;
         else
            t = 1;
      }

      return currentLocation(inst, t);
   };

   function currentLocation (inst, t) {
      var loc;
      var entry = pathInst[inst];

      /* P0 - Starting Point       P1 - End Point */
      var P0 = paths[entry.id].waypoints[entry.indices[0]];
      var P1 = paths[entry.id].waypoints[entry.indices[1]];

      switch(entry.curve)
      {
         default:
         case 'linear':
         /* Start with a linear Bezier curve calculation (2 points). */
         /* B(t) = P0 + t⋅(P1-P0) = (1 - t)⋅P0 + tP1        */
         loc = {
            'x'   : parseInt((1 - t) * P0[0] + t*P1[0]),
            'y'   : parseInt((1 - t) * P0[1] + t*P1[1]),
            'gid' : entry.groups ? entry.groups[entry.indices[0]] : 0
         };
         break;

         case 'quadratic':
         var P2 = paths[entry.id].waypoints[entry.indices[2]];
         /* Second order (quadratic) Bezier curve calcuation (3 points). */
         /* B(t) = (1−t)^2⋅P0 + 2⋅(1−t)⋅t⋅P1 + t^2⋅P2        */
         loc = {
            'x'   : parseInt(Math.pow((1 - t), 2) * P0[0] + 2 * (1 - t) * t * P1[0] + Math.pow(t, 2) * P2[0]),
            'y'   : parseInt(Math.pow((1 - t), 2) * P0[1] + 2 * (1 - t) * t * P1[1] + Math.pow(t, 2) * P2[1]),
            'gid' : entry.groups ? entry.groups[entry.indices[0]] : 0
         };         
         break;

         case 'cubic':
         var P2 = paths[entry.id].waypoints[entry.indices[2]];
         var P3 = paths[entry.id].waypoints[entry.indices[3]];
         /* Third order (cubic) Bezier curve calculation (4 points ) */
         /* B(t) = (1−t)^3⋅P0 + 3⋅(1−t)^2⋅t⋅P1 + 3⋅(1−t)⋅t^2⋅P2 + t^3⋅P3 */
         loc = {
            'x'   : parseInt(Math.pow((1 - t), 3) * P0[0] + 3 * Math.pow((1-t), 2) * t * P1[0] + 
                             3 * ( 1 - t) * Math.pow(t, 2) * P2[0] + Math.pow(t, 3) * P3[0]),
            'y'   : parseInt(Math.pow((1 - t), 3) * P0[1] + 3 * Math.pow((1-t), 2) * t * P1[1] + 
                             3 * ( 1 - t) * Math.pow(t, 2) * P2[1] + Math.pow(t, 3) * P3[1]),
            'gid' : entry.groups ? entry.groups[entry.indices[0]] : 0
         };         
         break;
      }
      return loc;
   };

   /* Tell a non-automatic (manual) path to continue animating on the next invocation of an interpolate function. */
   function resume(inst) {
      var now = (new Date).getTime();
      var sofar = pathInst[inst].totalTime;

      pathInst[inst].stopped    = false;
      pathInst[inst].timeStart  = (now - sofar);
   };

   function stop (inst) {
      pathInst[inst].stopped = true;
   };

   /* Query the state of a non-repeating path (to tell if it has finished moving) */
   function hasStopped(inst) {
      return pathInst[inst].stopped;
   };

   function waypointCount(inst) {
      return pathInst[inst].wpCount; 
   };

   function runCount(inst) {
      return pathInst[inst].runCount; 
   };

   /* Resets a non-repeating path so it animates again on the next invocation of an interpolate function (from the beginning). */
   function reset(inst) {
      var entry   = pathInst[inst];

      resetIndices(entry.indices, entry.direction > 0);

      entry.timeStart = 0;
      entry.totalTime = 0;
      entry.stopped   = false;
      entry.wpCount   = 0;
   };

   function interpolateAll() {
      var locations = [];

      for (var i=0; i<pathInst.length; i++) 
      {
         locations.push(Paths.interpolate(i));
      }

      return locations;
   };

   var Paths = {};
   
   Paths.add             = add;
   Paths.instantiate     = instantiate;
   Paths.interpolate     = interpolate;
   Paths.currentLocation = currentLocation;
   Paths.resume          = resume;
   Paths.stop            = stop;
   Paths.hasStopped      = hasStopped;
   Paths.waypointCount   = waypointCount;
   Paths.runCount        = runCount;
   Paths.reset           = reset;
   Paths.interpolateAll  = interpolateAll;

   return Paths;
});
