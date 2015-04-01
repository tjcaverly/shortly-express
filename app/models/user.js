var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
	tableName: 'users',
	initialize: function(){
    this.on('creating', this.hashPassword);
    },
    
    hashPassword: function(){
    var cipher = Promise.promisify(bcrypt.hash);
    return cipher(this.get('password'), null, null).bind(this)
      .then(function(hash) {
        this.set('password', hash);
      });
	// hashPassword: function(password){
	// 	bcrypt.hash(password, null, null, function(err, hash){
	// 		this.set('password', hash);
	// 	}.bind(this));
	// 	//return bcrypt.hashSync(password);
	},
  comparePassword: function(attemptedPassword, callback) {
    bcrypt.compare(attemptedPassword, this.get('password'), function(err, isMatch) {
      callback(isMatch);
    });
  }

});

module.exports = User;