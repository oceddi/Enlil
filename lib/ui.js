define(function(require) {

    var windows = [];

    var UI = function(type, params) {
        this.type               = type;
        this.div                = document.createElement('div');
        this.div.style.position = "absolute";
        this.div.style.left     = (params.x) + "px";
        this.div.style.top      = (params.y) + "px";

        this.canvas = document.createElement('canvas');
        this.div.appendChild(this.canvas);


        if (params.colors === undefined) { /* Default colors. */
            params.colors = {
                     fill : 'rgba(255, 255, 0, 0.5)',
                  outline : 'rgba(255,   0, 0, 1.0)',
                textInner : 'rgba(  0,   0, 0, 1.0)',
                textOuter : 'rgba(  0,   0, 0, 1.0)'
            };
        }

        if (params.fontSize === undefined) { /* Default font size. */
            params.fontSize = 30;
        }

        if(type === UI.TYPE_SPEECHBUBBLE) {

            if(params.text === undefined)
                params.text = "     ";

            var ctx = this.canvas.getContext('2d');
            var canvas2;
            var context2;
            var padSize = Math.floor(params.fontSize * .15);
            padSize *= 2;

            /* Figure out the dimensions by looking at text */
            ctx.font = params.fontSize + 'px arial';
            var textSize = ctx.measureText(params.text);

            var x2 = 1;
            var y2 = 18;
            var radius = (params.fontSize + padSize + 25) / 2;
            var width  = textSize.width + 50;
            var height = (params.fontSize + padSize) + y2;
            var r = x2 + width;
            var b = y2 + height;

            this.canvas.width  = parseInt(textSize.width) + (55);
            this.canvas.height = (params.fontSize + padSize) + (40);
            ctx = this.canvas.getContext('2d');
            
            /* Speech Bubble Shape */
            ctx.save();
            ctx.fillStyle   = params.colors.fill;
            ctx.strokeStyle = params.colors.outline;
            ctx.lineWidth   = '2';

            ctx.beginPath();
            ctx.moveTo(x2 + radius, y2);
            ctx.lineTo(x2 + radius / 2, y2 - 10);
            ctx.lineTo(x2 + radius * 2, y2);
            ctx.lineTo(r - radius, y2);
            ctx.quadraticCurveTo(r, y2, r, y2 + radius);
            ctx.lineTo(r, y2 + height - radius);
            ctx.quadraticCurveTo(r, b, r - radius, b);
            ctx.lineTo(x2 + radius, b);
            ctx.quadraticCurveTo(x2, b, x2, b - radius);
            ctx.lineTo(x2, y2 + radius);
            ctx.quadraticCurveTo(x2, y2, x2 + radius, y2);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            ctx.restore();

            /* Text */
            ctx.save();
            ctx.strokeStyle  = params.colors.textOuter;
            ctx.fillStyle    = params.colors.textInner;
            ctx.textBaseline = 'middle';
            ctx.lineWidth    = '1';
            ctx.fillText(params.text, this.canvas.width / 2 - textSize.width / 2, this.canvas.height / 2 + y2 / 2);
            ctx.strokeText(params.text, this.canvas.width / 2 - textSize.width / 2, this.canvas.height / 2 + y2 / 2);
            ctx.restore();
        }
    }

    function createSpeechBubble(text, fontSize, x, y, colors) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var canvas2;
        var context2;
        var padSize = Math.floor(fontSize * .15);
        var padSize2 = padSize * 2;

        /* Figure out the dimensions by looking at text */
        context.font = fontSize + 'px arial';
        var textSize = context.measureText(text);

        var x2 = 1;
        var y2 = 18;
        var radius = (fontSize + padSize2 + 25) / 2;
        var width  = textSize.width + 50;
        var height = (fontSize + padSize2) + y2;
        var r = x2 + width;
        var b = y2 + height;

        canvas2 = document.createElement('canvas');
        canvas2.width = parseInt(textSize.width) + (55);
        canvas2.height = (fontSize + padSize2) + (40);
        context2 = canvas2.getContext('2d');

        if (colors == undefined) { /* Default colors. */
            colors = {
                     fill : 'rgba(255, 255, 0, 0.5)',
                  outline : 'rgba(255,   0, 0, 1.0)',
                textInner : 'rgba(  0,   0, 0, 1.0)',
                textOuter : 'rgba(  0,   0, 0, 1.0)'
            };
        }


        /* Speech Bubble Shape */
        context2.save();
        context2.fillStyle = colors.fill;
        context2.strokeStyle = colors.outline;
        context2.lineWidth = '2';

        context2.beginPath();
        context2.moveTo(x2 + radius, y2);
        context2.lineTo(x2 + radius / 2, y2 - 10);
        context2.lineTo(x2 + radius * 2, y2);
        context2.lineTo(r - radius, y2);
        context2.quadraticCurveTo(r, y2, r, y2 + radius);
        context2.lineTo(r, y2 + height - radius);
        context2.quadraticCurveTo(r, b, r - radius, b);
        context2.lineTo(x2 + radius, b);
        context2.quadraticCurveTo(x2, b, x2, b - radius);
        context2.lineTo(x2, y2 + radius);
        context2.quadraticCurveTo(x2, y2, x2 + radius, y2);
        context2.closePath();
        context2.stroke();
        context2.fill();
        context2.restore();

        /* Text */
        context2.save();
        context2.font = context.font;
        context2.strokeStyle = colors.textOuter;
        context2.fillStyle = colors.textInner;
        context2.textBaseline = 'middle';
        context2.lineWidth = '1';
        context2.fillText(text, canvas2.width / 2 - textSize.width / 2, canvas2.height / 2 + y2 / 2);
        context2.strokeText(text, canvas2.width / 2 - textSize.width / 2, canvas2.height / 2 + y2 / 2);
        context2.restore();

        var newWindow = {
            div : document.createElement('div'),
            context: context2,
            canvas: canvas2,
            x: x,
            y: y
        };

        newWindow.div.style.position = "absolute";
        newWindow.div.style.left = (newWindow.x) + "px";
        newWindow.div.style.top  = (newWindow.y) + "px";

        document.body.appendChild(newWindow.div);

        windows.push(newWindow);

        return windows.length - 1;
    };

    function showWindow(index) {
        windows[index].div.appendChild(windows[index].canvas);
    };

    function hideWindow(index) {
        windows[index].div.removeChild(windows[index].canvas);
    };


    UI.createSpeechBubble = createSpeechBubble;
    UI.showWindow         = showWindow;
    UI.hideWindow         = hideWindow;

    UI.TYPE_SPEECHBUBBLE = 0;

    return UI;
});