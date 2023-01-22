# `ATIAM - WebAudio`

> Exercises for the ATIAM WebAudio course

## Content

- `exercises` contains the boilerplate code for the exercises
- `correction` contains the complete code of the exercises
- `project` contains the boilerplate code for the final project

## Install

```
cd path/to/exercises
npm install 
npm run dev
```

The application will be accessible at `http://localhost:5000/`

## Available commands

#### `npm run dev`

launch the server and, watch the file system and transpile on save

#### `npm run build`

build the application

#### `npm run start`

launch the server

## StepSequencer Projet - Pierre CHOUTEAU

Following the different steps for the stepSequencer project, I started by setting it up with the 'bascis' instructions (Master volume, effects lines, BufferSource creations, Beat follower track, dbToLinear...).  

Then, I added some personal elements to go further into its functioning: 
- Added the ability to start and stop the system with buttons
- Addition of a controllable reverb, which can be activated with buttons and sliders (the reverb comes in at the end of the chain, on the master)
- Added the ability to modify the BPM from the user interface
- Modification of the user interface to make it more accessible

## Authors

- Benjamin Matuszewski <benjamin.matuszewski@ircam.fr>
- Victor Paredes <victor.paredes@ircam.fr>

## License

BSD-3-Clause
