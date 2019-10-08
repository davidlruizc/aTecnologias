const express = require('express');
const app = express();
const router = express.Router();

const path = __dirname + '/views/';
const port = 8080;

router.use(function (req,res,next) {
  console.log('/' + req.method);
  next();
});

router.get('/',function(req,res){
  res.sendFile(path + 'index.html');
});

router.get('/sharks',function(req,res){
  res.sendFile(path + 'sharks.html');
});

router.get('/andresh',function(req,res){
  res.sendFile(path + 'andresh.html');
});

router.get('/betava',function(req,res){
  res.sendFile(path + 'betava.html');
});

router.get('/elkin',function(req,res){
  res.sendFile(path + 'elkin.html');
});

router.get('/juanp',function(req,res){
  res.sendFile(path + 'juanp.html');
});

router.get('/nicolasc',function(req,res){
  res.sendFile(path + 'nicolasc.html');
});

router.get('/oscar',function(req,res){
  res.sendFile(path + 'oscar.html');
});

router.get('/randy',function(req,res){
  res.sendFile(path + 'randy.html');
});

app.use(express.static(path));
app.use('/', router);

app.listen(port, function () {
  console.log('Example app listening on port 8080!')
})
