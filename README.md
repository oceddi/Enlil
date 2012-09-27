#Enil
## Javascript HTML5 game library.  
The intent of Enlil is to package up and provide resources to HTML5 game developers making 2D sprite based games.

## Enlil Current Feature Set:

- Uses require.js packaging scheme to organize source code.
- Parses sprite sheets into groupings of animations (i.e. walk, run, fly, jump, etc).
- Cycle through various animation groupings during draw calls.
- Sprite movement can be controlled directly by setting screen coordinates or movement paths can be pre-defined and interpolated paths (tweening) can queried at varying time intervals for coordinates.
- Rudimentary json loader of game packages.
- Isometric tile engine that loads from json and scrolls as mouse is moved.
- Speech bubbles that can scale in size.


## Example use of this library can be cound under the the "/examples" folder:

- paths.html - Demonstrates loading sprite sheets, animating, sprite movement and the mouse input support.  Clicking on the screen will cause the pirate sprite to move towards the click.

- loader.html - Demonstrates the loader which is an early attempt to package up the game definition into a concise json grouping (see testpackage.json).  The intent is game makers would use some other tool to create this package
  and Enlil could parse and "run" the package to load your game.  This feature is a work in progress.

- isomap.html - Demonstrates loading and displaying and isometric tile map.  Can be run in fullscreen mode and moving the mouse to the edges of the screen/browser will cause the map to scroll.

- uitest.html - Demonstrates speech bubble ui elements.  Click on screen to see some random speech bubbles getting placed where you clicked (random text and size).


## Special Thanks:

Sprite sheets in the example directory courtesy of Sithjester at http://untamed.wild-refuge.net/rpgxp.php

## Questions/Feedback:

oceddi@gmail.com

## Twitter:

twitter.com/oceddi

## GITTIP:

<iframe style="border: 0; margin: 0; padding: 0;"
        src="https://www.gittip.com/oceddi/widget.html"
        width="48pt" height="20pt"></iframe>