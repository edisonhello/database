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

app.use('/static', express.static(__dirname+'/static'));

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req,res){
	res.sendFile(__dirname+'/index.html', function(){res.end();})
})

io.sockets.on('connection', function(socket){
	console.log("asd");
	socket.on('reqall', function(){
		MongoClient.connect('mongodb://localhost:27017/datbs',function(err, db){
			db.collection('datbs').find({},function(a,b){
				b.toArray(function(err, callback){
					console.log(callback);
					socket.emit('allisthis', callback);
				});
			})
		})
	})
})




server.listen(7122);