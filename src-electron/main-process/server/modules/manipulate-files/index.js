const fs = require('fs')

const createDir = (directory) => {
  fs.mkdir(directory, function (err) {
    if (err) {
      console.log(err)
    }
  })
}

module.exports = {
  createDir
}
