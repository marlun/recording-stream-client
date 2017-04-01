var choo = require('choo')
var html = require('choo/html')
var getUserMedia = require('getusermedia')

var app = choo()
app.use(store)
app.route('/', mainView)
app.mount('body')

function mainView (state, emit) {
  return html`
    <body onload=${onLoad}>
      <button class="record" onclick=${start}>Record</button>
      <button class="stop" onclick=${stop}>Stop</button>
    </body>
  `
  function onLoad () {
    emit('bodyLoaded')
  }
  function start (event) {
    console.log(event)
    emit('startRecording')
  }
  function stop () {
    emit('stopRecording')
  }
}

function store (state, emitter) {
  var recorder = null
  var chunks = []

  emitter.on('startRecording', function () {
    recorder.start(1000);
    console.log(recorder.state);
    console.log("recorder started");
  })

  emitter.on('stopRecording', function () {
    recorder.stop();
    console.log(recorder.state);
    console.log("recorder stopped");
  })

  emitter.on('bodyLoaded', function () {
    getUserMedia({ video: false, audio: true }, function (err, stream) {
      if (err !== null) {
        throw err;
      }
      recorder = new MediaRecorder(stream)
      recorder.onstop = onRecordingDone
      recorder.ondataavailable = onRecordingDataAvailable
    })
  })

  function onRecordingDone (event) {
    console.log("Recording stopped. Uploading...")

    var blob = new Blob(chunks, { 'type' : 'audio/webm' })
    var xhr = new XMLHttpRequest()
    xhr.open('POST', 'http://localhost:3000', true)
    xhr.onload = onRecordingUploadDone
    xhr.send(blob)

    // Empty chunks array to make it ready for a new recording
    chunks = []
  }

  function onRecordingUploadDone (event) {
    console.log("Upload of recording done.")
  }

  function onRecordingDataAvailable (event) {
    console.log(event)
    if (event.data.size > 0) {
      chunks.push(event.data)
    }
  }
}
