
require(["../lib/enlil"], function(Enlil) {
    var advance = function() {
       Enlil.drawFrame();
       Enlil.tick();
       fps.innerHTML = 'FPS: ' + Enlil.fps;
    };

    var run = function () {
       Enlil.startFPS();
       Enlil.registerRunLoop(advance);
       Enlil.start(30);
    };

	require(['domReady'], function (domReady) {
	  domReady(function () {
          /* package is defined in testpackage.json file. */
          Enlil.loadPackage("testpackage.json", 'stage', run);
       });
    });
});