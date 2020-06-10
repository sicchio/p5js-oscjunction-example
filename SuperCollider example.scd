(
var sound = {|freq=440, amp=0.1| SinOsc.ar(Lag2.kr(freq, 0.05)).dup * Lag2.kr(amp, 0.05)}.play;

OSCdef(\mouse, {|msg|
	msg.postln;
	sound.set(\amp, msg[1].linexp(0, 1, 0.001, 0.5));
	sound.set(\freq, msg[2].linexp(0, 1, 880, 220));
}, '/mouse');

)