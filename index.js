const express = require('express')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

app.use('/img', express.static(path.join(__dirname, 'public/img')))

app.get('/', (req, res) => {
  res.json({
    name: 'Habibi API',
    endpoints: ['/img/menu.jpg']
  })
})

app.listen(PORT, () => {
  console.log(`Habibi API running on port ${PORT}`)
})

module.exports = app
