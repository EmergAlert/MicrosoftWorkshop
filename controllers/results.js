require('dotenv').load()
const request = require('request-promise-native')
const express = require('express')
const router = express.Router()

router.post('/', function (req, res, next) {
  const url = req.body.url

  Promise.all([
    // MAKE CALL TO CUSTOM VISION API
    callAPI(url)
  ]).then(([response]) => {
    var results = response

    // PARSE THE RESPONSE TO FIND THE HIGHEST PREDICTION
    const top = parseResponse(results.Predictions)

    // GET THE DATA FOR THE TOP SCORED TAG
     const data = getTagData(top)

    // RENDER RESULTS
    res.render('results', {
      title: 'Results',
      description: data.description,
      probability: data.probability,
      photo: data.photo
    })
  }).catch(reason => {
    console.log(`Promise was rejected becasue ${reason}`)

    // RENDER AN ERROR MESSAGE
    res.render('results',
      { title: 'Error',
        description: 'Oops something went wrong! Submit another link to try again!',
        probability: 100,
        photo: '/images/Error.jpg'
      })
  })
})

module.exports = router

// =========================================================
// HELPER FUNCTIONS HERE
// =========================================================
// This funtion goes in the controllers/results.js file under the "helper functions" comment

function callAPI (url) {
  const options = {
    uri: process.env.PREDICTION_URL,
    headers: {
      'Prediction-Key': process.env.PREDICTION_KEY,
      'Content-Type': 'application/json'
    },
    body: `{"Url": "${url}"}`
  }

  return request.post(options)
    .then((result) => {
      return JSON.parse(result)
    })
}
function parseResponse (predictions) {
  // Loop through the array to find the top score
  var top = predictions[0]
  predictions.forEach(p => {
    if (p.Probability > top.Probability) {
      top = p
    }
  })

  return top
}
// This funtion goes in the controllers/results.js file under the "helper functions" comment

function getTagData (top) {
  var link = ''
  var description = ''

  // Decide which image and description to use based on the tag passed in
  switch (top.Tag.toLowerCase()) {
    case 'guns':
      link = '/images/gun.jpg'
      description = 'Hey I found a gun.'
      break
    case '':
      link = '/images/Error.jpg'
      description = 'Oops something went wrong! Submit another link to try again!'
      break
    default:
      link = '/images/Error.jpg'
      description = 'This is not a gun'
      break
   
  }

  if (top.Probability * 100 > 70) {
    console.log("It's a gun.");
    link = '/images/gun.jpg'
  } else {
    console.log("It's not a gun.");
    link = '/images/Error.jpg'
  }

  // Store suggestion
  const data = {
    photo: link,
    description: description,
    probability: top.Probability * 100
  }

  return data
}