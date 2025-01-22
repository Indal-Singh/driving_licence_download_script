const express = require('express');
const { downloadDLimageAndSignNew, downloadDLimageAndSign } = require('./controller');
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(__dirname));

app.get('/',(req,res)=>{
    res.sendFile('index.html');
})

app.post('/dl/image-sign',downloadDLimageAndSignNew)
app.post('/dl/image-sign/old',downloadDLimageAndSign)

app.listen(PORT);