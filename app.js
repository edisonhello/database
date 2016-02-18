'use strict'

var path = require('path');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var bodyParser = require('body-parser');

var express = require('express')
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var http =  require('http');

var now;

app.use('/static', express.static(__dirname+'/static'));

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req,res){
	res.sendFile(__dirname+'/index.html', function(){res.end();})
})
app.get('/add.html', function(req,res){
	res.sendFile(__dirname+'/add.html', function(){res.end();})
})

setInterval(function(){
	var month = new Date().getMonth()+1;
	now = new Date().getFullYear().toString()+"-"+month.toString()+"-"+new Date().getDate().toString()+" ";
	if(new Date().getHours()<10){
		now=now+"0"+new Date().getHours().toString()+":";
	}
	else{
		now=now+new Date().getHours().toString()+":";
	}
	if(new Date().getMinutes()<10){
		now=now+"0"+new Date().getMinutes().toString()+":";
	}
	else{
		now=now+new Date().getMinutes().toString()+":";
	}
	if(new Date().getSeconds()<10){
		now=now+"0"+new Date().getSeconds().toString();
	}
	else{
		now=now+new Date().getSeconds().toString();
	}
	console.log(now)
}, 1000)

io.sockets.on('connection', function(socket){
	socket.on('reqall', function(){
		MongoClient.connect('mongodb://localhost:27017/datbs',function(err, db){
			db.collection('datbs').find({}/*,{_id: 0}*/,function(err,result){
				result.toArray(function(err, callback){
					var str = JSON.stringify(callback);
					str = str.split("},{");
					str[0] = str[0].slice(2);
					str[str.length-1] = str[str.length-1].slice(0,str[str.length-1].length-2);
					str = str.toString();
					str = str.replace(/","_/g,'"<br>"_');
					str = str.replace(/],"_/g,']<br>"_');
					console.log(str);
					socket.emit('allisthis', str);
				})
			})
		})
	})

	socket.on('additem', function(title, descr, tag){
		MongoClient.connect('mongodb://localhost:27017/datbs',function(err,db){
			db.collection('datbs').insert({"time": now, "title": title, "descr": descr, "tag": tag});
		})
	})
})




server.listen(7122);