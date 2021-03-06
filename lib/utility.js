var express = require('express');
var request = require('request');
var db = require('../app/config');
var Bookshelf = require('bookshelf');
var path = require('path');
var User = require('../app/models/user');
var Users = require('../app/collections/users');



exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/

exports.checkSignIn = function(req, res, next){

  //check username has current session
  if (!req.session.loggedIn){
    res.redirect('/login');
  } else {
    next();
  }
};

exports.logOut = function(req, res, next){  
    req.session.loggedIn = false;
    res.redirect('/login');
    next();
  
};

exports.createUser = function(req, res, next) {
  //get username
  //console.log("req from 41:", req, "username:", req.body.username);
  // var tableStuff = db.knex('users').where({
  //   username: req.body.username
  // } ).select('id').then(function(row){
  //   console.log(row)
  //   if (row.length === 0) {
      // console.log("user model ", userModel.User);
   new User({ username: req.body.username }).fetch().then(function(found) {

     if (found) {
       res.redirect('/login');
     } else {
      
       //HASH the passwords (check Usermodel for bcrypt)
         var user = new User({
           username: req.body.username,
           password: req.body.password  //Hashed password will automatically in the table
         });

        // console.log("Password should be hashed: ", user.password);
         req.session.loggedIn = true;
         user.save().then(function(newUser) {
           Users.add(newUser);
          // console.log(newUser);
           res.redirect('/');
         });
       }
     });
    
//May need to throw err if null?

}


