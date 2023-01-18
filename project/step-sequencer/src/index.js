import "core-js/stable";
import "regenerator-runtime/runtime";
import { html, render } from 'lit/html.js';
import { resumeAudioContext } from '@ircam/resume-audio-context';
import { Scheduler } from 'waves-masters';
import { AudioBufferLoader } from 'waves-loaders';
import '@ircam/simple-components/sc-text.js';
import '@ircam/simple-components/sc-slider.js';
import '@ircam/simple-components/sc-matrix.js';

const audioContext = new AudioContext();

// Global variable definition
const numSteps = 16;
const bpm = 280;
const score = []; // the beats that should be played
const stepDisplayScore = [new Array(numSteps).fill(0)]; // to follow the current beat
let master = null;
const effects = [];
const $guiContainer = document.querySelector('#main');
let convolver = null
let duration = 1;
let decay = 4;


class StepSequencer {
  constructor(audioContext, score, bpm, soundfiles, effects) {
    this.audioContext = audioContext;
    this.score = score;
    this.bpm = bpm;
    this.soundfiles = soundfiles;
    this.effects = effects;

    this.stepIndex = 0;
    this.numSteps = this.score[0].length;
  }

  advanceTime(currentTime) {
    // Q3 --------------------------------------------------------->
    const startTime = currentTime
    const bpm_sec = 1e-3 * 60000 / this.bpm;
    const buffers = [];
    for (let i = 0; i < this.soundfiles.length; i++) {
      buffers[i] = this.soundfiles[i];
    }
    console.log(buffers);

    for (let i = 0; i < this.soundfiles.length; i++) {
      if (this.score[i][this.stepIndex] == 1) {
        const src = this.audioContext.createBufferSource();
        
        // Connection pour connecter la source aux effets
        src.connect(effects[i].gain);
        effects[i].gain.connect(effects[i].lowpass);
        effects[i].lowpass.connect(master);
        
        // Puis on configure la sortie
        src.buffer = buffers[i];
        src.start(startTime);

        // Console log pour faire des vérifications
        // console.log('source', src);
        // console.log('bpm par sec', bpm_sec);
        // console.log('lowpass', effects[i].lowpass)
      }

    }

    // Q4 --------------------------------------------------------->
    if (this.stepIndex >= 15) {
      this.stepIndex = 0;
    }
    else {
      this.stepIndex += 1; 
    }
    // Console log pour faire des vérifications
    // console.log(this.stepIndex)

    return currentTime + bpm_sec;
  }
}

class DisplaySteps {
  constructor(stepDisplayScore, bpm) {
    this.stepDisplayScore = stepDisplayScore;
    this.bpm = bpm;
    // this.callback = callback;

    this.stepIndex = 0;
    this.numSteps = this.stepDisplayScore[0].length;
  }

  advanceTime(currentTime, _, dt) {
    // be carefull this.stepDisplayScore has only one track
    this.stepDisplayScore[0].fill(0);
    this.stepDisplayScore[0][this.stepIndex] = 1;
    
    // Q5 --------------------------------------------------------->
    const bpm_sec = 1e-3 * 60000 / this.bpm;

    if (this.stepIndex >= 15) {
      this.stepIndex = 0;
    }
    else {
      this.stepIndex += 1;
    }
    
    renderGUI();

    return currentTime + bpm_sec;
  }
}


function impulseResponse(duration, decay) {
  const length = audioContext.sampleRate * duration
  const impulse = audioContext.createBuffer(1, length, audioContext.sampleRate)
  const IR = impulse.getChannelData(0)
  for (var i = 0; i < length; i++) {
    IR[i] = (2 * Math.random() - 1) * Math.pow(1 - i / length, decay)
  }
  return impulse
}

(async function main() {
  // resume audio context
  await resumeAudioContext(audioContext);

  const loader = new AudioBufferLoader();

  const soundfiles = [
    await loader.load('./assets/909-BD-low.wav'),
    await loader.load('./assets/909-SD-low.wav'),
    await loader.load('./assets/909-HH-closed.wav'),
    await loader.load('./assets/909-PC-clap.wav'),
    await loader.load('./assets/909-LT-high.wav'),
    await loader.load('./assets/909-MT-low.wav'),
    await loader.load('./assets/909-HT-high.wav'),
  ];

  // Q1 --------------------------------------------------------->
  master = audioContext.createGain();
  // master.gain.value = 0; // Juste un test pour vérifier que le master fonctionne
  // master.connect(audioContext.destination);
  // console.log(master.gain.value);

  const amplitude = audioContext.createGain();
  amplitude.gain.setValueAtTime(1, audioContext.currentTime + 0.1);

  const impulse = impulseResponse(duration, decay);
  // const convolver = new ConvolverNode(audioContext, {buffer: impulse});
  convolver = audioContext.createConvolver();
  convolver.buffer = impulse;

  // Connection
  master.connect(amplitude);
  amplitude.connect(convolver);
  convolver.connect(audioContext.destination);

  for (let i = 0; i < soundfiles.length; i++) {
    // populate score as score[track][beat]
    score[i] = new Array(numSteps).fill(0);

    // Q2 --------------------------------------------------------->
    const gain = audioContext.createGain();
    // Juste un test pour vérifier que les effets sont correctement créés
    // if (i != 0){
    //   gain.gain.value = 0;
    // }

    const lowpass = audioContext.createBiquadFilter();
    lowpass.type = "lowpass";
    // lowpass.frequency.setValueAtTime(400, audioContext.currentTime);
    // lowpass.gain.setValueAtTime(2, audioContext.currentTime);

    effects[i] = {
      input: gain, // alias gain to input so that the synth doesn't have to know the object names
      gain,
      lowpass,
    };
  }

  const scheduler = new Scheduler(() => audioContext.currentTime);
  const stepSequencer = new StepSequencer(audioContext, score, bpm, soundfiles, effects);
  const displaySteps = new DisplaySteps(stepDisplayScore, bpm);

  const startTime = audioContext.currentTime + 0.1;
  scheduler.add(stepSequencer, startTime);
  scheduler.add(displaySteps, startTime);

  renderGUI();
}());

function dbToLinear(db) {
  // Q6 --------------------------------------------------------->
  const linear = 10.0 ** (db / 20.0);
  return linear;
}

// GUI
function renderGUI() {
  render(html`
    <div style="margin-bottom: 10px; padding: 20px; border: 1px solid #565656">
      <h3>reverb controls</h3>
      <div style="padding-bottom: 4px;">
        <sc-text
          value="duration_reverb"
          readonly
          width="150"
        ></sc-text>
        <sc-slider
          min="0"
          max="3"
          value="${duration}"
          @input="${e => {
            duration = e.detail.value;
            convolver.buffer = impulseResponse(duration, decay);
            console.log(duration);
          }}"
        ></sc-slider>
      </div>
      <div style="padding-bottom: 4px;">
        <sc-text
          value="decay_reverb"
          readonly
          width="150"
        ></sc-text>
        <sc-slider
          min="0"
          max="2"
          value="${decay}"
          @input="${e => {
            decay = e.detail.value;
            convolver.buffer = impulseResponse(duration, decay);
            console.log(decay);
          }}"
        ></sc-slider>
      </div>
    </div>
    <div style="margin-bottom: 10px;">
      <sc-text
        readonly
        value="master volume"
        width="120"
      ></sc-text>
      <sc-slider
        min="-80"
        max="6"
        value="0"
        @input="${e => {
          const gain = dbToLinear(e.detail.value);
          master.gain.setTargetAtTime(gain, audioContext.currentTime, 0.01);
          console.log(gain);
        }}"
      ></sc-slider>
    </div>
    <div>
      <sc-matrix
        width="${30 * numSteps}"
        height="${10}"
        .value="${stepDisplayScore}"
        @change="${e => console.log(e.detail.value)}"
      ></sc-matrix>
    </div>
    <div>
      <sc-matrix
        style="float: left"
        width="${30 * numSteps}"
        height="${30 * score.length}"
        .value="${score}"
        @change="${e => console.log(e.detail.value)}"
      ></sc-matrix>
      <div style="float: left">
        ${score.map((track, index) => {
          return html`
            <div>
              <sc-text
                readonly
                value="volume"
                width="160"
              ></sc-text>
              <sc-slider
                min="-80"
                max="6"
                value="0"
                @input="${e => {
                  const gainNode = effects[index].gain;
                  const gain = dbToLinear(e.detail.value);
                  gainNode.gain.setTargetAtTime(gain, audioContext.currentTime, 0.01);
                  console.log(gain);
                  console.log(gainNode);
                }}"
              ></sc-slider>
              <sc-text
                readonly
                value="lowpass frequency"
                width="160"
              ></sc-text>
              <sc-slider
                min="50"
                max="18000"
                value="${effects[index].lowpass.frequency.value}"
                @input="${e => {
                  const lowpass = effects[index].lowpass;
                  lowpass.frequency.setTargetAtTime(e.detail.value, audioContext.currentTime, 0.01);
                  console.log(lowpass)
                  console.log(e.detail.value);
                }}"
              ></sc-slider>
            </div>
          `;
        })}
      </div>
    <div>
  `, $guiContainer);
}