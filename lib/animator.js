/********************************************************************/
/* animator.js 
/* 
/* Exported Classes:
/*  Animator
/* 
/********************************************************************/
define(function(require) {

    var idCounter = 1;
    var instances = {};
    var anims = {};

    function getNextID() {
        return (idCounter++);
    }

    function add(id, data) {
        anims[id] = data;
    }

    function instantiate(id) {
        var inst = id + '_' + getNextID();

        instances[inst] = {
            id: id,
            timeStart: 0,
            totalTime: 0,
            stopped: false,
            frame: 0,
            stack: []
        };

        return inst;
    }

    /* Push onto stack */
    /* data : ['left', [2, 1, 1, 2]]  */

    function push(inst, data) {
        instances[inst].stack.push(data);
    }

    function pop(inst) {
        return instances[inst].stack.pop();
    }

    /* Run current anim from top of stack. */

    function run(inst) {
        var entry = instances[inst];
        var top;
        var timeNow = (new Date()).getTime();
        var interval;
        var tDelta = 0;

        if (!entry.stack.length) return 0;

        top = entry.stack[entry.stack.length - 1];

        if (entry.timeStart === 0) entry.timeStart = timeNow;
        else tDelta = ((timeNow - entry.timeStart) - entry.totalTime) / 1000;

        interval = top[1][entry.frame];

        if (tDelta > interval) { /* Advance to next frame in animation (if it exists, or loop). */
            if (top[1].length > entry.frame) entry.frame++;
            else entry.frame = 0;
        }

        /* Return the sheet, group, and offset to display now. */
        return {
            'sheet': anims[entry.id].sheet,
            'group': top[0],
            'offset': entry.frame
        };
    }

    /****************************************************************/
    /* Animator
    /* 
    /* I think the purpose of this class was to queue up animations on an
    /* actor from its sheet layer.  I don't really use it right now
    /* and it probably doesn't work.
    /****************************************************************/
    var Animator = {};

    Animator.add = add;
    Animator.instantiate = instantiate;
    Animator.push = push;
    Animator.pop = pop;
    Animator.run = run;

    return Animator;
})();