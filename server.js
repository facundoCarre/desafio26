const express = require('express');
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const advancedOptions = { useNewUrlParser: true, useUnifiedTopology: true }
const passport = require('passport');
const bCrypt = require('bCrypt');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models');

require('./database/connection');

//const instacncia = new productos();
// creo una app de tipo express
const app = express();
const handlebars = require("express-handlebars")
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('express-session')({
    secret: 'keyboard cat',
    cookie: {
      httpOnly: false,
      secure: false,
      maxAge: 20000
    },
    rolling: true,
    resave: true,
    saveUninitialized: false
  }));

  app.use(passport.initialize());
  app.use(passport.session());
app.engine('hbs', handlebars({
    extname: '.hbs',
    defaultLayout: 'index.hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials/'
}));
app.set('view engine', 'hbs');
app.set('views', './views');
app.use(express.static('public'));

app.get('/',(req,res)=>{
    res.render('main');

  });

  app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (!err) res.render('main');
        else res.send({ status: 'Logout ERROR', body: err })
    })
}) 

/*app.get('/login', (req, res) => {
  let {usuario} =  req.query
  req.session.usuario = usuario
  res.render('list', { usuario: usuario});
})*/

passport.use('login', new LocalStrategy({
    passReqToCallback: true
  },
    function (req, username, password, done) {
      // check in mongo if a user with username exists or not
      User.findOne({ 'username': username },
        function (err, user) {
          // In case of any error, return using the done method
          if (err)
            return done(err);
          // Username does not exist, log error & redirect back
          if (!user) {
            console.log('User Not Found with username ' + username);
            return done(null, false,
              //req.flash('message', 'User Not found.'));                 
              console.log('message', 'User Not found.'));
          }
          // User exists but wrong password, log the error 
          console.log('llego aca ?¡')
          if (!isValidPassword(user, password)) {
            console.log('Invalid Password');
            return done(null, false,
              //req.flash('message', 'Invalid Password'));
              console.log('message', 'Invalid Password'));
          }
          // User and password both match, return user from 
          // done method which will be treated like success
          return done(null, user);
        }
      );
    })
  );

  passport.use('signup', new LocalStrategy({
    passReqToCallback: true
  },
    function (req, username, password, done) {
      findOrCreateUser = function () {
        // find a user in Mongo with provided username
        User.findOne({ 'username': username }, function (err, user) {
          // In case of any error return
          if (err) {
            console.log('Error in SignUp: ' + err);
            return done(err);
          }
          // already exists
          if (user) {
            console.log('User already exists');
            return done(null, false,
              //req.flash('message','User Already Exists'));
              console.log('message', 'User Already Exists'));
          } else {
            // if there is no user with that email
            // create the user
            var newUser = new User();
            // set the user's local credentials
            newUser.username = username;
            newUser.password = createHash(password);
            newUser.email = req.body.email;
            newUser.firstName = req.body.firstName;
            newUser.lastName = req.body.lastName;
  
            // save the user
            newUser.save(function (err) {
              if (err) {
                console.log('Error in Saving user: ' + err);
                throw err;
              }
              console.log('User Registration succesful');
              return done(null, newUser);
            });
          }
        });
      }
      // Delay the execution of findOrCreateUser and execute 
      // the method in the next tick of the event loop
      process.nextTick(findOrCreateUser);
    })
  )

  const isValidPassword = (user, password) => {
    return bCrypt.compareSync(password, user.password);
}

const createHash = (password) => {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

passport.serializeUser(function (user, done) {
    done(null, user._id);
  });
  
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });
app.post('/login', passport.authenticate('login', { failureRedirect: '/faillogin' }), (req, res) => {
    res.render('list');
});

app.get('/faillogin', (req, res) => {
    res.render('error');
});

app.post('/signup', passport.authenticate('signup', { failureRedirect: '/failsignup' }), (req, res) => {
    res.render('back');
});
app.get('/failsignup', (req, res) => {
    res.render('errorRegistro');
});

app.get('/registro', (req, res) => {
 res.render('registro');
}) 
app.get('/main', (req, res) => {
res.render('main');
}) 
const puerto = 8080;

const server = app.listen(puerto, () => {
    console.log(`servidor escuchando en http://localhost:${puerto}`);
});

// en caso de error, avisar
server.on('error', error => {
    console.log('error en el servidor:', error);
});
