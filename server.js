// Can follow this for https server and openSSL certificate: 
// To structure the code look at this link 
// https://dev.to/josuebustos/https-localhost-for-node-js-1p1k
// For the certificate installation you can look at my notes in the node.js course 
// or google and see 

const https = require('https')
const fs = require('fs')
const path = require('path')
const helmet = require('helmet')
const passport = require('passport')
const {Strategy} = require('passport-google-oauth20')
const session = require('express-session')


require('dotenv').config()

const PORT = process.env.PORT


const express = require('express')

const app = express()

app.use(helmet())
app.use(session({
    secret: `Adnan`,
    resave: true,
    saveUninitialized: true
  }));
app.use(passport.initialize());
app.use(passport.session());

const config = {
    callbackURL: '/auth/google/callback',
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
}

function verificationCallBack(accessToken, refreshToken, profile, done) {
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //     return done(err, user);
    // });
    console.log('Google Profile', profile)
    done(null, profile)
}

passport.use(new Strategy(config,verificationCallBack));

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
  

app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, "index.html"))
})


function checkLoggedIn(req,res, next) {
    const isLoggedIn = false 
    if (!isLoggedIn) {
        return res.status(401).json({
            error: "You Must log in"
        })
    }
    next()
}


// So we will hit a middleware to check the login status before making sure that 
// that user is authneticated to use the endpoint.
app.get('/secret', checkLoggedIn,(req,res) => {
    res.send('Hello there from HTTPS')
})


app.get('/auth/google', 
    passport.authenticate('google', { scope:
        [ 'email'] }),
    (req, res) => {
        console.log('Google called by backend')
    }
)


app.get( '/auth/google/callback',
    passport.authenticate( 'google', {
    successRedirect: '/',
    failureRedirect: '/auth/google/failure'
}));

app.get( '/auth/google/failure',
    (req,res) => {
        res.status(400).json({
            error: "Failed to login"
        })
    }
);


app.get('/auth/logout', (req, res) => {

})


https.createServer(
    {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    },
    app
)
.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`)
})

