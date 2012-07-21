/* Code for this module borrowed heavily from eloquent javascript book */

/* Every keypress generates 'keydown', 'keyup', and 'keypress' events. */
/* Every click generates 'mousedown', 'mouseup' and 'click' events.    */

define(function(require) {
    var handlers = [];

    function normaliseEvent(event) {
        if (!event.stopPropagation) {
            event.stopPropagation = function() {
                this.cancelBubble = true;
            };
            event.preventDefaultv = function() {
                this.returnValue = false;
            };
        }
        if (!event.stop) {
            event.stop = function() {
                this.stopPropagation();
                this.preventDefault();
            };
        }

        if (event.srcElement && !event.target) event.target = event.srcElement;
        if ((event.toElement || event.fromElement) && !event.relatedTarget) event.relatedTarget = event.toElement || event.fromElement;
        if (event.clientX !== undefined && event.pageX === undefined) {
            event.pageX = event.clientX + document.body.scrollLeft;
            event.pageY = event.clientY + document.body.scrollTop;
        }

        if (event.type == "keypress") {
            if (event.charCode === 0 || event.charCode === undefined) event.character = String.fromCharCode(event.keyCode);
            else event.character = String.fromCharCode(event.charCode);
        }

        return event;
    }

    function registerEventHandler(node, event, handler) {
        if (typeof node.addEventListener == "function") node.addEventListener(event, handler, false);
        else node.attachEvent("on" + event, handler);
    }

    function unregisterEventHandler(node, event, handler) {
        if (typeof node.removeEventListener == "function") node.removeEventListener(event, handler, false);
        else node.detachEvent("on" + event, handler);
    }

    function addHandler(node, type, handler) {
        var newHandler = {
            queue: [],
            func: handler
        };

        function queueEventHandler(event) {
            newHandler.queue.push(normaliseEvent(event || window.event));
        }
        registerEventHandler(node, type, queueEventHandler);

        handlers.push(newHandler);

        return {
            node: node,
            type: type,
            handler: queueEventHandler
        };
    }

    function removeHandler(object) {
        unregisterEventHandler(object.node, object.type, object.handler);
    }

    function processHandlers() {
        for (var i = 0; i < handlers.length; i++) {
            while (handlers[i].queue.length) {
                handlers[i].func(handlers[i].queue.shift());
            }
        }
    }

    var Input = {};

    Input.addHandler      = addHandler;
    Input.removeHandler   = removeHandler;
    Input.processHandlers = processHandlers;
    return Input;
});