var choo = require('choo')
var html = require('choo/html')
var getUserMedia = require('getusermedia')
var getRecorderStream = require('media-recorder-stream')
var io = require('socket.io-client')
var ss = require('socket.io-stream')
var shortid = require('shortid')

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
    emit('startRecording')
  }
  function stop () {
    emit('stopRecording')
  }
}

function store (state, emitter) {
  var socket = io.connect('http://localhost:3000/recording')
  var microphoneMediaStream = null

  emitter.on('bodyLoaded', function () {
    getUserMedia({ video: false, audio: true }, function (err, stream) {
      if (err !== null) {
        throw err;
      }
      // Save the MediaStream so that we can use it when we click on record
      microphoneMediaStream = stream
    })
  })

  emitter.on('startRecording', function () {
    var microphoneStream = getRecorderStream(microphoneMediaStream)
    var filename = shortid() + '.ogg'
    var socketStream = ss.createStream()
    ss(socket).emit('new', socketStream, { name: filename })
    microphoneStream.pipe(socketStream)
    emitter.once('stopRecording', function () {
      microphoneStream.unpipe(socketStream)
      microphoneStream.destroy()
      console.log("Saved new recording: " + filename);
    })
  })
}
