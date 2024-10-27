const express = require('express');
const { downloadDLimageAndSign } = require('./controller');
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(__dirname));

app.get('/',(req,res)=>{
    res.sendFile('index.html');
})

app.post('/dl/image-sign',downloadDLimageAndSign)

app.listen(PORT);