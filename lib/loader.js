define(function(require) {
    var Paths = require('../lib/path');
    var Actors = require('../lib/actor');
    var Sheets = require('../lib/sheets');

    function setState(newState) {
        Loader.state = newState;

        /* Notify any observers. */
        for (var i = 0; i < Loader.stateObservers.length; i++) {
            Loader.stateObservers[i](newState);
        }
    }

    function addObserver(onChange) {
        Loader.stateObservers.push(onChange);
    }

    function makeHttpObject() {
        try {
            return new XMLHttpRequest();
        }
        catch (error) {}
        try {
            return new ActiveXObject("Msxml12.XMLHTTP");
        }
        catch (error) {}
        try {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
        catch (error) {}

        throw new Error("Could not create HTTP request object.");
    }

    function simpleHTTPRequest(url, success, successParams, failure, responseType) {
        var request = makeHttpObject();

        if (responseType === undefined) responseType = 'text';

        request.onreadystatechange = function() {
            if (request.readyState == 3) {
                setState('receiving');
            }
            else if (request.readyState == 4) {
                if (request.status == 200) {
                    setState('received');
                    if (responseType == 'text') success(request.responseText, successParams);
                    else success(request.response, successParams);
                }
                else if (failure) {
                    setState('request failed');
                    failure(request.status, request.statusText);
                }
            }
        };

        request.open("GET", url, true);
        request.responseType = responseType;
        request.send(null);
    }

    function convertJSONAndLoadPackage(jsonString, startFunc) {
        console.log(jsonString);
        var pkg = JSON.parse(jsonString);

        loadPackage(pkg, startFunc);
    }

    function requestPackage(url, startFunc) {
        setState('requesting');
        simpleHTTPRequest(url, convertJSONAndLoadPackage, startFunc);
    }


    function loadTileProps(jsonString, callback) {
        var tileprops = JSON.parse(jsonString);

        callback(tileprops);
    }

    function requestTileProps(url, callback) {
        simpleHTTPRequest(url, loadTileProps, callback);
    }

    function requestBinaryData(url, callback) {
        simpleHTTPRequest(url, callback, null, null, 'arraybuffer');
    }

    function getNextDivId() {
        return 'div_' + Loader.nextDivId++;
    }

    function loadPackage(pkg, startFunc) {
        var i;
        var j;
        var firstState = pkg.states[pkg.first];
        var anchor = document.getElementById(pkg.anchor);

        console.log("Loading: " + firstState.name);

        /* Backdrop - For now just use a Sheet and Actor (that doesn't move) */
        for (i = 0; i < pkg.assets.backdrops.length; i++) {
            if (firstState.backdrop == pkg.assets.backdrops[i].id) {
                console.log("Loading backdrop: " + firstState.backdrop);

                Sheets.add(pkg.assets.backdrops[i].id, pkg.assets.backdrops[i].data);

                Actors.add({
                    name: 'stage',
                    sheetid: firstState.backdrop,
                    div: anchor.id,
                    relative: pkg.assets.backdrops[i].relative
                });
                break;
            }
        }

        /* Sprite Sheets */
        for (i = 0; i < pkg.assets.spritesheets.length; i++) {
            Sheets.add(pkg.assets.spritesheets[i].id, pkg.assets.spritesheets[i].data);
        }

        /* Paths */
        for (i = 0; i < firstState.paths.length; i++) {
            var path = firstState.paths[i];

            Paths.add(path.id, {
                waypoints: path.waypoints
            });
        }


        /* Actors */
        for (i = 0; i < firstState.actors.length; i++) {
            var actor = firstState.actors[i];
            var newdiv = document.createElement('div');

            newdiv.id = getNextDivId();

            anchor.appendChild(newdiv);

            console.log("Creating " + actor.name + "\n");

            Actors.add({
                name: actor.name,
                sheetid: actor.sheetid,
                div: newdiv.id
            });

            for (j = 0; j < actor.paths.length; j++) {
                var pinst = actor.paths[j];

                Paths.instantiate(pinst.id, pinst);
            }
        }

        setState('finished');

        startFunc();
    }

    var Loader = {
        state: 'initial',
        stateObservers: [],
        j: 0,
        nextDivId: 1
    };

    Loader.addObserver = addObserver;
    Loader.requestPackage = requestPackage;
    Loader.requestTileProps = requestTileProps;
    Loader.requestBinaryData = requestBinaryData;

    return Loader;
});