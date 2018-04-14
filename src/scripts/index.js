import config from './config'
import { getTextWidth } from './helpers'

const setCanvasFontStyle = (context, styles) => {
  Object.keys(styles).forEach(key => {
    context[key] = styles[key]
  })
}

const drawRectOnFace = (face, canvas) => {
  const ctx = canvas.getContext('2d')
  const eyes = face.landmarks.filter(el => el.type === 'eye')
  const rectWidth = face.boundingBox.width
  const rectHeight = Math.round(face.boundingBox.height * config.eyeRatio)

  const rectCenter = {
    x: Math.round(face.boundingBox.left + (rectWidth/2)),
    y: 0
  }

  eyes.forEach(eye => {
    rectCenter.y += eye.location.y
  })
  rectCenter.y /= eyes.length

  ctx.fillStyle = config.rect.fillStyle
  ctx.fillRect(face.boundingBox.left, Math.round(rectCenter.y - rectHeight/2), rectWidth, rectHeight)

  const fontSize = Math.floor(config.textStyle.fontSize * ((rectWidth*0.8) / getTextWidth(config.text, config.textStyle.font)))
  setCanvasFontStyle(ctx, {
    ...config.textStyle,
    font: `${fontSize}px ${config.textStyle.fontFamily}`
  })
  ctx.fillText(
    config.text,
    rectCenter.x,
    rectCenter.y
  )
}

window.onload = () => {
  let streaming = false
  const video = document.getElementById('video')
  const canvas = document.getElementById('canvas')

  const faceDetector = new FaceDetector({
    maxDetectedFaces: 10,
    fastMode: true
  })

  const detectFaces = () => {
    faceDetector.detect(video)
      .then((detectedFaces) => {
        const faces = Object.keys(detectedFaces).map(i => detectedFaces[i])
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        if (faces.length < 1) {
          return
        }

        faces.forEach(face => {
          drawRectOnFace(face, canvas)
        })
      })
      .catch(console.error)
  }

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function(stream) {
      video.srcObject = stream
      video.play()
      video.onloadedmetadata = e => {
        canvas.height = e.target.clientHeight
        canvas.width = e.target.clientWidth
        streaming = true
      }
      video.onprogress = e => {
        if (streaming) {
          detectFaces()
        }
      }
    })
    .catch(function(err) {
      console.log("An error occured on video! " + err)
    })
}