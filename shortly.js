var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());

app.use(session({secret:'somesecrettokenhere'}));
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));



authenicateUser = function(req, res, next){
  console.log("Authentication in progress @ 108");
  //check if user exists in the table users
  var tempUserName = req.body.username; //from submission
  new User({username: tempUserName}).fetch().then(function(found){
    console.log("FOUND from 34: ", found);
    if(!found){
      console.log("Username not found @ 36")
      res.redirect('/signup');
    }else{
      //trying to get pwd from client
      console.log("Unhashed password attempt: ", req.body.password);

      //the hang-up is calling the hashPassword function on this client password

      // var tempClientPwd = tempUserName.hashPassword(req.body.password); //password from client website, then hashed
      
      var tempTableHashPwd = found.attributes.password;   //password from existing hashed table
      //console.log("Table-hashed pwd@42: ", tempTableHashPwd, "Client-hashed: ", tempClientPwd);

      bcrypt.compareSync(req.body.password, tempTableHashPwd) ? next() : res.redirect('/login');

      }
  
  })
};





app.get('/', util.checkSignIn,
function(req, res) {

    res.render('index');
});

app.get('/login', 
function(req, res) {
  res.render('login');
});

app.post('/login',  authenicateUser, //TODO: createSession middleware authentication!!! in progress
  function(req, res) {
    req.session.loggedIn = true;
    // console.log('session ', req.session);
    res.redirect('/');
});

app.get('/logout', util.logOut, 
function(req, res) {
  res.render('login');
});

app.get('/signup', 
function(req, res) {
  res.render('signup');
});

app.post('/signup', util.createUser,
  function(req, res) {
    
    req.session.loggedIn = true;
    // console.log('session ', req.session);
    res.redirect('/');
});


app.get('/links', util.checkSignIn,
function(req, res) {

  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

// exports.authenicateUser = function(req, res, next){
//   console.log("Authentication in progress @ 108");
//   //check if user exists in the table users
//   new User({username: req.body.username}).fetch().then(function(found){
//     console.log("FOUND from 117: ", found);
//     if(!found){
//       res.redirect('/signup');
//     }else{
//     //get their hashed password
//     //get table hashed password
//     var tempTableHash = db.get('password');

//     //check their hashed password = table hashed password
//     }
//     next();
//   })
// };



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
