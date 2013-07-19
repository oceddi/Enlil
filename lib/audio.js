/********************************************************************/
/* audio.js 
/* 
/* Exported Classes:
/*  Audio
/* 
/********************************************************************/
define(function(require) {
    var context;
    var audioNodes = [];

    /* Midi specific vars */
    var tIndices = [];
    var timeLine = {};
    var deltaPosition = 0;
    var activeNotes = new Array(16); /* 16 posibble channels */
    var bpm = 120; /* Beats Per Minute - Default */
    var ppqn = 0; /* pulses (clocks) per quarter note. */
    var startTime;

    function init() {
        if (context) return;

        window.AudioContext = window.AudioContext || window.webkitAudioContext;

        if (window.AudioContext) {
            context = new window.AudioContext();
        }
        else {
            //console.log('Web Audio not supported in this browser.');
        }
    }

    function playAudio(index, when, loop) {
        audioNodes[index].loop = loop;
        audioNodes[index].connect(context.destination);
        audioNodes[index].noteOn(when);
    }

    function playMidi(index, when, loop) {
        var bufferSize = 4096 * 8;

        startTime = context.currentTime + when;

        audioNodes[index].onaudioprocess = function(event) {
            var dataCh0 = event.outputBuffer.getChannelData(0);
            var dataCh1 = event.outputBuffer.getChannelData(1);

            var data = generate(bufferSize, context.currentTime - startTime);

            if (data) {
                for (var i = 0; i < bufferSize; i++) {
                    dataCh0[i] = data[i * 2];
                    dataCh1[i] = data[i * 2 + 1];
                }
            }

            if (!tIndices.length) {
                audioNodes[index].disconnect();
                //console.log('Done!');
                return;
            }
        };

        audioNodes[index].connect(context.destination);
    }

    function play(index, when, loop) {
        if (audioNodes[index].__proto__.constructor.name == 'JavaScriptAudioNode') {
            playMidi(index, when, loop);
        }
        else {
            playAudio(index, when, loop);
        }
    }

    function readVarLength(buffer, i) {
        var retVal = 0;
        var c;

        if ((retVal = buffer[i++]) & 0x80) {
            retVal &= 0x7F;

            do {
                retVal = (retVal << 7) + ((c = buffer[i++]) & 0x7F);
            } while (c & 0x80);
        }
        return retVal;
    }

    function decodeAudioAsset(data) {
        var source = context.createBufferSource();

        /* Use the blocking api for now, may switch to non-blocking/async later. */
        /* Supports MP3, OGG, WAV */
        source.buffer = context.createBuffer(data, false);

        audioNodes.push(source);
        return audioNodes.length - 1;
    }

    function decodeMidiAsset(data) {
        var bufferSize = 4096 * 8;
        var channelCount = 2;
        var node = context.createJavaScriptNode(bufferSize, 0, channelCount);
        var i = 0;
        var chunkNum = 0;

        while (i < data.length) {
            var chunkID;
            var chunkLen;
            var timeDiv;

            /* Read Chunk ID */
            chunkID = String.fromCharCode(data[i], data[i + 1], data[i + 2], data[i + 3]);

            if (chunkNum === 0 && chunkID != 'MThd') {
                //console.log('Invalid MIDI file.');
                return -1;
            }

            chunkNum++;
            i += 4;

            /* Chunk Length (big endian) */
            chunkLen = (data[i] << 24) + (data[i + 1] << 16) + (data[i + 2] << 8) + data[i + 3];

            i += 4;

            switch (chunkID) {
            case 'MThd':
                //console.log('MThd');
                timeDiv = (data[i + 4] << 8) + data[i + 5];
                if ((timeDiv & 0x8000) === 0) { /* Lower 15 bits -> Pulses Per Quarter Note. */
                    console.log('PPQN: ' + (timeDiv & 0x7FFF));
                    ppqn = (timeDiv & 0x7FFF);
                }
                else { /* Lower 15 bits -> Frames Per Second. */
                    //console.log('Frames Per Second');
                    //console.log(' # SMPTE frames: ' + ((timeDiv >>> 8) & 0x7F));
                    //console.log(' Clock ticks per frame: ' + (timeDiv & 0x00FF));
                }
                break;

            case 'MTrk':
                //console.log('MTrk');
                parseMidiTrack(data.subarray(i, i + chunkLen));
                break;

            default:
                //console.log('Unrecognized MIDI chunk: ' + chunkID + ' at position '+i);
                return -1;
            }

            i += chunkLen;
        }

        audioNodes.push(node);
        return audioNodes.length - 1;
    }

    function parseMidiTrack(data) {
        var i = 0;
        var b;
        
        while (i < data.length) {
            var deltaTime;
            var eventType;
            var midiChannel;

            deltaTime = 0;

            while (true) {
                b = data[i++];
                if (b & 0x80) {
                    deltaTime += (b & 0x7f);
                    deltaTime <<= 7;
                }
                else {
                    deltaTime += b;
                    break;
                }
            }

            //console.log('DT:' + deltaTime);
            midiChannel = (data[i] & 0x0F);

            if (!activeNotes[midiChannel]) activeNotes[midiChannel] = new Array(128);

            eventType = (data[i] >>> 4);

            //console.log('ET: ' + eventType);
            //console.log('MC: ' + midiChannel);
            i++;

            switch (eventType) { /* Channel Events */
            case 0x8:
            case 0x9:
            case 0xA:
            case 0xB:
            case 0xC:
            case 0xD:
            case 0xE:
                i += parseMidiTrackChannelEvent(deltaTime, midiChannel, data.subarray(i, i + 2), eventType);
                break;

            case 0xF:
                switch (midiChannel) {

                    /* System Exclusive Events */
                case 0x0:
                case 0x7:
                    var sysExLen = 0;

                    while (true) {
                        b = data[i++];
                        if (b & 0x80) {
                            sysExLen += (b & 0x7F);
                            sysExLen <<= 7;
                        }
                        else {
                            sysExLen += b;
                            break;
                        }
                    }

                    i += sysExLen;
                    break;

                    /* Meta Events */
                case 0xF:
                    var metaType = data[i++];
                    var metaLen = 0;

                    while (true) {
                        b = data[i++];

                        if (b & 0x80) {
                            metaLen += (b & 0x7F);
                            metaLen <<= 7;
                        }
                        else {
                            metaLen += b;
                            break;
                        }
                    }

                    //console.log('Meta Event: ' + metaType + ' with len: ' + metaLen );
                    switch (metaType) {
                    case 81:
                        /* Set Tempo - The 3 data bytes are time (in microseconds) per quarter note. */
                        /* bpm - number of continuous quarter notes in 1 minute of time. */
                        bpm = 60000000 / ((data[i] << 16) + (data[i + 1] << 8) + (data[i + 2]));
                        console.log('BPM: ' + bpm);
                        break;
                    }

                    i += metaLen;
                    break;
                }
                break;

            default:
                //console.log('Unrecognized Midi Track Event: ' + eventType);
                break;
            }
        }

    }

    function parseMidiTrackChannelEvent(deltaTime, midiChannel, data, eventType) {
        var p1 = data[0];
        var p2 = data[1];

        switch (eventType) {
        case 0x8:
            //console.log('Note Off: ' + p1);
            break;
        case 0x9:
            //console.log('Note On: note #:' + p1 + ' velocity:' + p2);
            noteOn(deltaTime, midiChannel, p1, p2);
            break;
        case 0xA:
            //console.log('Note Aftertouch');
            noteOff(deltaTime, midiChannel, p1, p2);
            break;
        case 0xB:
            //console.log('Controller');
            switch (p1) {

            }
            break;
        case 0xC:
            //console.log('Program Change');
            return 1;
        case 0xD:
            //console.log('Channel Aftertouch');
            return 1;
        case 0xE:
            //console.log('Pitch Blend');
            break;
        }

        return 2;
    }

    function noteToFreq(note) {
        //return 440 * Math.pow(2, (note-69)/12);
        return 8.1758 * Math.pow(2, note / 12);
    }

    function makeNote(entry) {
        var freq = noteToFreq(entry.n);
        var gain = 0.5;

        var sample_rate = 44100;
        var sample_interval = (sample_rate * 60) / bpm; /* sample interval for 1 quarter note. */

        var num_samples = sample_interval * (entry.p / ppqn);

        entry.w = num_samples;

        var osc = new Oscillator(DSP.SINE, freq, gain, num_samples, sample_rate);
        osc.generate();

        /* Envelope the sound so it sounds like a particular instrument */

        /* Piano  */
        var attack_length = 0.0;
        var decay_length = 0.5;
        var sustain_level = 0.0;
        var sustain_length = 0.0;
        var release_length = 0.0;
        var adsr = new ADSR(attack_length, decay_length, sustain_level, sustain_length, release_length, sample_rate);
        entry.pcm = adsr.process(osc.signal);
    }

    function noteOn(deltaTime, channel, note, velocity) {
        deltaPosition += deltaTime;

        if (velocity > 0) { /* Note Starting */

            var entry = {
                n: note,
                v: velocity,
                p: 0,
                dp: deltaPosition,
                w: 0,
                pcm: null
            };

            if (!timeLine[deltaPosition]) {
                timeLine[deltaPosition] = [];
                tIndices.push(deltaPosition);
            }

            timeLine[deltaPosition].push(entry);

            activeNotes[channel][note] = entry;
        }
        else {
            noteOff(0, channel, note, velocity);
        }
    }

    function noteOff(deltaTime, channel, note, velocity) {
        deltaPosition += deltaTime;

        if (activeNotes[channel][note]) {
            activeNotes[channel][note].p = deltaPosition - activeNotes[channel][note].dp;

            makeNote(activeNotes[channel][note]);

            activeNotes[channel][note] = null;
        }
    }

    function generate(samples, timeMarker) {
        var output = new Array(samples * 2);
        var copiedOut = 0;
        var copyCurrent = 0;
        var sampleSeconds = (1 / (bpm / 60)) * 1 / samples;
        var i;
        
        //console.log(sampleSeconds);
        for (i = 0; i < samples * 2; i++) {
            output[i] = 0;
        }


        for (i = 0; i < tIndices.length; i++) {
            var index = tIndices[i];
            //var indexInTime = (index/(bpm/60))/ppqn;
            var indexInTime = (1 / (bpm / 60)) * ((1 / ppqn) * index);

            if (indexInTime <= (timeMarker + sampleSeconds)) {
                for (var j = 0; j < timeLine[index].length; j++) {
                    var source = timeLine[index][0];

                    copyCurrent = 0;

                    for (var k = 0; k < source.pcm.length; k++) {
                        if (copyCurrent < samples * 2) {
                            output[copyCurrent++] += source.pcm[k];
                        }
                        else { /* truncate source. */
                            source.pcm = source.pcm.subarray(k - 1);
                            break;
                        }
                    }

                    if (copyCurrent < samples * 2) {
                        timeLine[index].shift();
                    }
                    copiedOut = (copyCurrent > copiedOut) ? copyCurrent : copiedOut;
                }

                if (timeLine[index].length === 0) {
                    tIndices.shift();
                    i--;
                }
            }
        }

        return output;
    }

    /****************************************************************/
    /* Audio
    /* 
    /* This class is my attempt at trying to do some sort of MIDI
    /* autio player.  It doesn't sound the greatest because I haven't
    /* spent a lot of time on the instruments.  Also the timing may
    /* not be exactly right.  Pretty much alpha quality right now.
    /****************************************************************/
    var Audio = {};

    Audio.init = init;
    Audio.play = play;
    Audio.decodeAudioAsset = decodeAudioAsset;
    Audio.decodeMidiAsset = decodeMidiAsset;

    return Audio;
})