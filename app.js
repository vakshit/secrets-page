//jshint esversion:6
require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20');
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// passport using way //

app.use(session({
  secret: process.env.SECRET, // need to refer documentation for all these parameters
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());
// passport using way//

mongoose.connect('mongodb://localhost:27017/userDB');  // connecting to database

const userSchema = new mongoose.Schema( { // creating a schema
  email: String,
  password: String,
  googleId: String,
  secrets: [String]
});


userSchema.plugin(passportLocalMongoose); // using Passport Local MOngoose plugin
userSchema.plugin(findOrCreate);


const User = mongoose.model('User', userSchema); // created model


// passport usage way //
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
// passport usage way //


// using google OAuth //
passport.use(new GoogleStrategy({   // auth strategy for passport using google OAuth
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  // console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));




app.get('/', function(req, res) {
  res.render('home');
});

app.get('/secrets', function(req, res){

  User.find({secrets: {$ne: null}}, function(err, foundUsers){
    if (err){
      res.send(err);
    } else {
      res.render('secrets', {userSecretsArray: foundUsers}); 
      // res.send(foundUsers[1]);
    }
  })
})

// ----------------------------- Google auth Section-------------------------- //

app.get('/auth/google', // authenticating it with google
  passport.authenticate('google', {scope: ['profile']}) // scope is the data that we will get from google servers
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', {failureRedirect: '/'}), // authenticating locally and saving the session as a cookie
  function(req, res) {
    res.redirect('/secrets');
  }
)

// ----------------------------- Google auth Section-------------------------- //

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



// ----------------------------- Secret Submission Section-------------------------- // 

app.route('/submit')
.get(function(req, res){
  if (req.isAuthenticated()){
    res.render('submit');
  } else {
    res.redirect('/login')
  }
})

.post(function(req, res){
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function(err, foundUser){
    if (err){
      res.send(err);
    } else {
      if (foundUser){
        foundUser.secrets.push(submittedSecret)
        foundUser.save();
        res.redirect('/secrets');
      }
    }
  })
})

// ----------------------------- Secret Submission Section-------------------------- // 




app.listen(3000, function(req, res) {
  console.log("Server has started on port 3000");
})

