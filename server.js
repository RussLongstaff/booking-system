// setup =======================================================================
// all tools needed
var express = require("express");
var app = express();
var port = process.env.PORT || 8080;
var mongoose = require("mongoose");
var passport = require("passport");
var flash = require("connect-flash");

var morgan = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session =  require("express-session");

var configDB = require("./config/database.js");


// configuration ===============================================================
mongoose.connect(configDB.url); // connect to database

require("./config/passport")(passport); // pass passport for configuration

// setup our express application
app.use(morgan("dev")); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms
app.use(express.static(__dirname + "/public")); // setup the public directory to serve static files

app.set("view-engine", "ejs"); // setup ejs for templating

// required for passport
app.use(session({secret: "iwanttobeatruejedi"})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// this creates a variable we can use in our header partial to determine if a user is logged on or not
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

// routes =======================================================================
require("./app/routes.js")(app, passport); // load our routes and pass in our app and fully configured passport





// launch =======================================================================
app.listen(port);
console.log("The magic happens on port " + port);