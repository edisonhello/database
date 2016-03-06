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
app.get('/edit.html', function(req,res){
	res.sendFile(__dirname+'/edit.html', function(){res.end();})
})
app.get('/reg.html', function(req,res){
	res.sendFile(__dirname+'/reg.html', function(){res.end();})
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
//	console.log(now)
}, 1000)

var count;
MongoClient.connect('mongodb://188.166.216.86:27017/datbs', function(err, db){
	db.collection('counting').find({}).count(function(err,cnt){
		count = cnt;
	})
})

io.sockets.on('connection', function(socket){
	socket.on('reqall', function(){
		MongoClient.connect('mongodb://188.166.216.86:27017/datbs', function(err, db){
			db.collection('datbs').find({},{_id: 0, creater: 0}, function(err,result){
				result.toArray(function(err, callback){
					var str = JSON.stringify(callback);
					str = str.split("},{");
					str[0] = str[0].slice(2);
					str[str.length-1] = str[str.length-1].slice(0,str[str.length-1].length-2);
					str = str.toString();
					str = str.replace(/],"i/g,']<br>"i');
//					console.log(str);
					socket.emit('allisthis', str);
				})
			})
		})
	})

	socket.on('additem', function(title, descr, tag, creater){
		MongoClient.connect('mongodb://188.166.216.86:27017/datbs',function(err,db){
			count++;
			db.collection('datbs').insert({"id": count.toString(), "time": now, "title": title, "descr": descr, "tag": tag, "creater": creater});
			db.collection('counting').insert({});
		})
	})

	socket.on('findreq', function(findType, findThing){
		MongoClient.connect('mongodb://188.166.216.86:27017/datbs', function(err,db){
			if(findType == "title"){
				db.collection('datbs').find({"title":findThing},{_id: 0, creater: 0}, function(err,result){
					result.toArray(function(err, callback){
						var str = JSON.stringify(callback)
						str = str.split("},{");
						str[0] = str[0].slice(2);
						str[str.length-1] = str[str.length-1].slice(0,str[str.length-1].length-2);
						str = str.toString();
						str = str.replace(/],"i/g,']<br>"i');
						socket.emit('allisthis', str);
					})
				})
			}
			if(findType == "tag"){
				db.collection('datbs').find({"tag": findThing},{_id: 0, creater: 0}, function(err,result){
					result.toArray(function(err, callback){
						var str = JSON.stringify(callback);
						str = str.split("},{");
						str[0] = str[0].slice(2);
						str[str.length-1] = str[str.length-1].slice(0,str[str.length-1].length-2);
						str = str.toString();
						str = str.replace(/],"i/g,']<br>"');
						socket.emit('allisthis', str);
					})
				})
			}
			if(findType == "creater"){
				db.collection('datbs').find({"creater": findThing},{_id: 0, creater: 0}, function(err,result){
					result.toArray(function(err, callback){
						var str = JSON.stringify(callback);
						str = str.split("},{");
						str[0] = str[0].slice(2);
						str[str.length-1] = str[str.length-1].slice(0,str[str.length-1].length-2);
						str = str.toString();
						str = str.replace(/],"i/g,']<br>"');
						socket.emit('allisthis', str);
					})
				})
			}
		})
	})

	socket.on('thisiddetail?', function(id){
		MongoClient.connect('mongodb://188.166.216.86:27017/datbs', function(err, db){
			db.collection('datbs').find({"id": id}, function(err, result){
				db.collection('datbs').find({"id": id}).count(function(err, cnt){
					if(cnt){
						result.toArray(function(err, callback){
							socket.emit('thisisdetail', callback[0].title, callback[0].descr, callback[0].tag, callback[0].creater);
						})
					}
					else{
						socket.emit('thisidnull');
					}
				})
			})
		})
	})

	socket.on('updateitem', function(title, descr, tag, thisid, thispw){
		MongoClient.connect('mongodb://188.166.216.86:27017/datbs',function(err,db){
			db.collection('users').find("username":thisid , "pass":thispw).count(function(err, cnt){
				if(cnt == 0){
					socket.emit('noperedit');
				}
				else{
					db.collection('datbs').update({"id":thisid}, {"id": thisid, "time": now, "title": title, "descr": descr, "tag": tag});
				}
			})
		})
	})

	socket.on('deletethis', function(thisid, thisid, thispw){
		MongoClient.connect('mongodb://188.166.216.86:27017/datbs',function(err,db){
			db.collection('users').find("username":thisid , "pass":thispw).count(function(err, cnt){
				if(cnt == 0){
					socket.emit('noperedit');
				}
				else{
					db.collection('datbs').remove({"id": thisid.toString()});
				}
			})
		})
	})

	socket.on('regreq', function(username, pass){
		MongoClient.connect('mongodb://188.166.216.86:27017/datbs', function(err,db){
			db.collection('users').find({"username": username}).count(function(err, cnt){
				if(cnt){
					socket.emit('username2');
				}
				else{
					db.collection('users').insert({"username": username, "pass": pass});
					socket.emit('regdone');
				}
			})
		})
	})

	socket.on('loginreq', function(username, pass){
		MongoClient.connect('mongodb://188.166.216.86:27017/datbs', function(err,db){
			db.collection('users').find({"username": username, "pass": pass}).count(function(err, cnt){
				if(cnt){
					socket.emit('logindone', username, pass);
				}
				else{
					socket.emit('loginfail');
				}
			})
		})
	})
})




server.listen(7122);