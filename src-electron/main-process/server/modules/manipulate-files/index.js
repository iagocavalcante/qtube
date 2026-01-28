import fs from 'fs'

export const createDir = (directory) => {
  fs.mkdir(directory, { recursive: true }, function (err) {
    if (err) {
      console.log(err)
    }
  })
}
