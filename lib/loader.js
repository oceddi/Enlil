var Loader = (function () {
   var Loader = {
     states : [], 
   };

   Loader.loadPackage = function( package ) {
      var i;
      var j;
      var firstState = package.states[package.first];
      var anchor     = document.getElementById(package.anchor);

      console.log("Loading: " + firstState.name);
     

      /* Backdrop - For now just use a Sheet and Actor (that doesn't move) */
      for ( i=0; i< package.assets.backdrops.length; i++)
      {
         if(firstState.backdrop == package.assets.backdrops[i].id)
         {
            console.log("Loading backdrop: " + firstState.backdrop);
            
            Sheets.add(package.assets.backdrops[i].id, package.assets.backdrops[i].data);

            Actors.add(
               {
                  name : 'stage',
               sheetid : firstState.backdrop,
                   div : anchor.id
               }
            );
            break;
         }
      }

      /* Sprite Sheets */
      for( i=0; i < package.assets.spritesheets.length; i++)
      {
         Sheets.add(package.assets.spritesheets[i].id, package.assets.spritesheets[i].data);
      }
      
      /* Paths */
      for( i=0; i < firstState.paths.length; i++)
      {
         var path = firstState.paths[i];

         Paths.add(path.id, { waypoints: path.waypoints } );
      }


      /* Actors */
      for( i=0; i < firstState.actors.length; i++)
      {
         var actor  = firstState.actors[i];
         var newdiv = document.createElement('div');

         newdiv.id = Enlil.getNextDivId();

         anchor.appendChild(newdiv);

         console.log("Creating " + actor.name + "\n");

         Actors.add( 
            {
               name : actor.name,
            sheetid : actor.sheetid,
                div : newdiv.id 
            }
         );

         for( j=0; j < actor.paths.length; j++)
         {
            var pinst = actor.paths[j];

            Paths.instantiate(pinst.id, pinst);
         }
      }
   };

   return Loader;
})();