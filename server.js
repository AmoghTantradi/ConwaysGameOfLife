//importing packages
const express = require('express')
const path = require('path')



//initializing important middleware
const app = express()
const PORT = process.env.PORT || 5000

app.use( express.static(path.join(__dirname,'/public')))

app.listen(PORT, () => {
	console.log('server started and running on port', PORT)
}
)
