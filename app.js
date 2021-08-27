//jshint esversion:6
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema( {
  email: String,
  password: String
});

const secret = "ThisIsOurLittleSecret"; // encryption key
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']}) // for encrypting password field


const User = mongoose.model('User', userSchema);


app.get('/', function(req, res) {
  res.render('home');
});

app.route('/login')
.get(function(req, res) {
  res.render('login');
})

.post(function(req, res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username}, function(err, foundUser){
    if (err){
      res.send(err);
    } else {
      if (foundUser){
        if (foundUser.password === password) {
          res.render('secrets');
        }else {

        }
      }
    }
  })
});




app.route('/register')
.get(function(req, res) {
  res.render('register');
})

.post(function(req, res) {
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });
  newUser.save(function(err){
    if (err){
      res.send(err);
    } else {
      res.render('secrets');
    }
  });
});





app.listen(3000, function(req, res) {
  console.log("Server has started on port 3000");
})

