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
//const session = require('express-session')
var cookieSession = require('cookie-session')


require('dotenv').config()

const PORT = process.env.PORT


const express = require('express')

const app = express()

app.use(helmet())
app.use(cookieSession({
    name: 'session',
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    keys: ['key encrypt the session']
  }));
app.use(passport.initialize());
app.use(passport.session());

// This is the passport function which will work with 
// our sessions and the cookies to store the session data in the cookie

passport.serializeUser((user, done) => {
    // done is funtion to which we can pass the error and the user that we get
    // the user is the actual data that we get from the auth process and we save this 
    // in the cookie and this is where we can make sure to save only part of the user details
    // like for example the user id. 

    // Note is express-session which is server side saving of session we can use this to 
    // to save the user ID and then in deserialize function we can then use this query to the 
    // database to get the saved session. 

    done(null, user.id)
})

// This function will help in getting the session data from the cookie
// each time a request is sent to the server, we can think of this to be 
// like the thing that fetches the cookie data in each call and we access this
// data using req.user in each end point of the server as needed.

passport.deserializeUser((user,done)=> {
    done(null, user)
})


const config = {
    callbackURL: '/auth/google/callback',
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
}

function verificationCallBack(accessToken, refreshToken, profile, done) {
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //     return done(err, user);
    // });
    // console.log('Google Profile', profile)
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
    const isLoggedIn = req.user 
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
    res.send('You hav access to the secret as you are logged in !!! If you logout you will loose access !!')
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
    failureRedirect: '/auth/google/failure',
    session: true
}));

app.get( '/auth/google/failure',
    (req,res) => {
        res.status(400).json({
            error: "Failed to login"
        })
    }
);


app.get('/logout', (req, res) => {
    req.logOut()
    return res.redirect('./')
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

