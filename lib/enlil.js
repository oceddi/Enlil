define(function(require) {

    var Loader  = require('../lib/loader');
    var Actors  = require('../lib/actor');
    var Input   = require('../lib/input');
    var Sheets  = require('../lib/sheets');
    var Paths   = require('../lib/path');
    var Audio   = require('../lib/audio');
    var Effects = require('../lib/effects');

    var Enlil = {
        version: '0.0.2',
        actors: []
    };

    function delay(seconds) {

    }

    function onLoaderChange(newState) {
        console.log(newState);

        switch (newState) {
        case 'finished':
            break;
        }

        Enlil.loadingDiv.innerHTML = 'STATUS: ' + newState;
    }

    function loadPackage(url, stageDiv, startFunc) {
        Enlil.stageDiv = document.getElementById(stageDiv);
        Enlil.loadingDiv = document.createElement('div');

        Enlil.loadingDiv.style.position = "absolute";
        Enlil.stageDiv.appendChild(Enlil.loadingDiv);

        Loader.addObserver(onLoaderChange);
        Loader.requestPackage(url, startFunc);
    }

    function loadAudio(url, callback) {
        var afterloaded = function(buffer) {
                var typedArray = new Uint8Array(buffer);
                var index;

                Audio.init();

                if ((index = Audio.decodeMidiAsset(typedArray)) == -1) index = Audio.decodeAudioAsset(buffer);

                callback(index);
            };

        Loader.requestBinaryData(url, afterloaded);
    }

    function playAudio(index, when, loop) {
        Audio.play(index, when, loop);
    }


    function startFPS() {
        Enlil.fps = 0;
        Enlil.frameCount = 0;
        Enlil.animCount = 0;
        Enlil.lastTimestamp = new Date();
        Enlil.currTimestamp = new Date();
        Enlil.avgDelay = 0;
    }

    function drawFrame() {
        var i;
        var locations;
        var rollover;

        /* Calculate location and animation frame. */
        locations = Paths.interpolateAll();

        /* Draw the stage background first. */
        Actors.draw(0, 0, 0, 0);

        for (i = 1; i < Actors.getLength(); i++) { /* Draw actor with specified group? */
            if (locations[i - 1].gid) {
                rollover = Sheets.getGroupLength(Actors.getSheet(i), locations[i - 1].gid);
                Actors.drawGroup(i, locations[i - 1].gid, Enlil.animCount % rollover, locations[i - 1].x, locations[i - 1].y);
            }
            else { /* Don't use groups, just raw offset. */
                Actors.draw(i, Enlil.animCount % 4, locations[i - 1].x, locations[i - 1].y);
            }
        }
    }

    function tick() {
        Enlil.frameCount++;
        Enlil.currTimestamp = new Date();
        var delay = Enlil.currTimestamp - Enlil.lastTimestamp;

        Enlil.avgDelay += (delay - Enlil.avgDelay) / 10;
        Enlil.lastTimestamp = Enlil.currTimestamp;
        Enlil.fps = (1000 / Enlil.avgDelay).toFixed(1);

        if (Enlil.frameCount % 5 === 0) Enlil.animCount++;
    }

    function registerRunLoop(func) {
        Enlil.runLoop = func;
    }

    function addEventHandler(node, type, handler) {
        Input.addHandler(node, type, handler);
    }


    var requestAnimFrame = (function() {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    })();

    function animFrame() {
        Input.processHandlers();
        Effects.processEffects();
        Enlil.runLoop();        
        requestAnimFrame(animFrame);
    }

    function start() {
        animFrame();
    }

    Enlil.delay = delay;
    Enlil.loadPackage = loadPackage;
    Enlil.loadAudio = loadAudio;
    Enlil.playAudio = playAudio;
    Enlil.startFPS = startFPS;
    Enlil.drawFrame = drawFrame;
    Enlil.tick = tick;
    Enlil.registerRunLoop = registerRunLoop;
    Enlil.addEventHandler = addEventHandler;
    Enlil.start = start;

    return Enlil;
});