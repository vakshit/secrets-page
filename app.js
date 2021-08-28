//jshint esversion:6
require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.SECRET, // need to refer documentation for all these parameters
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema( {
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);


const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());





app.get('/', function(req, res) {
  res.render('home');
});

app.get('/secrets', function(req, res){
  console.log(req.user);
  if (req.isAuthenticated()) {
    res.render('secrets');
  } else {
    res.redirect('/');
  }
  
})

// ----------------------------- Register Section-------------------------- // 

app.route('/register')
.get(function(req, res) {
  res.render('register');
})

.post(function(req, res) {
  
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err){
      console.log("reached register err block");
      res.send(err);
    } else {
      passport.authenticate('local')(req,res, function(){
        res.redirect('/secrets');
        // console.log(req);
      })
    }
  })
});

// ----------------------------- Register Section-------------------------- // 

// ----------------------------- Login Section-------------------------- // 

app.route('/login')
.get(function(req, res) {
  res.render('login');
})

.post(function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.logIn(user, function(err){
    if (err){
      res.send(err);
    } else {
      passport.authenticate('local')(req, res, function(){
        res.redirect('/secrets');
      });
    }
  })  
});

// ----------------------------- Login Section-------------------------- // 




// ----------------------------- LogOut Section-------------------------- // 

app.route('/logout')
.get(function (req, res) {
  req.logout();
  res.redirect('/');
})

// ----------------------------- LogOut Section-------------------------- // 




app.listen(3000, function(req, res) {
  console.log("Server has started on port 3000");
})

