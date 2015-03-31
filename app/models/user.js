var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
	tableName: 'users',
	hashPassword: function(password){
		return bcrypt.hashSync(password);
	}

});

module.exports = User;