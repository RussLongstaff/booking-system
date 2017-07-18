// load up models
var User = require("../app/models/user");
var Registered = require("../app/models/user");
var Booking = require("./models/booking");

module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get("/", function(req, res) {
        
        res.render("login.ejs", { message: req.flash("loginMessage") }); // load the login.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get("/login", function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render("login.ejs", { message: req.flash("loginMessage") }); 
    });
    
    // process the login form passing the user id for use on the next page
    app.post('/login',
        passport.authenticate('local-login',
        {failureRedirect: "/login", failureFlash: true}), // allow flash messages
        function(req, res) {
            // If this function gets called, authentication was successful.
            // `req.user` contains the authenticated user.
            res.redirect('/user/' + req.user._id);
        });    

    // =====================================
    // REGISTER ============================
    // =====================================
    // show the register form
    app.get("/register", function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render("register.ejs", { message: req.flash("registerMessage") });
    });
    
    // process the register form passing the user id for use on the next page
    app.post('/register',
        passport.authenticate('local-signup',
        {failureRedirect: "/register", failureFlash: true}), // allow flash messages
        function(req, res) {
            // If this function gets called, authentication was successful.
            // `req.user` contains the authenticated user.
            res.redirect('/user/' + req.user._id);
        });      

    // =====================================
    // USERS SECTION =======================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get("/user", isLoggedIn, function(req, res) {
        res.render("users/user.ejs", {
            user : req.user // get the user out of session and pass to template
        });
       
    });
    
    // Show - shows more info about the currently logged in user
    app.get("/user/:id", isLoggedIn, function(req, res){
        // find the user with provided ID
        User.findById(req.params.id).populate("bookings").exec(function(err, foundUser){
            if(err){
                console.log(err);
            } else {
                console.log(foundUser);
                var unapprovedBooking;                
                var approvedBooking;
                // before we render template we need to prepare for some conditions based on booking requests and approval status
                foundUser.bookings.forEach(function(booking){
                    if(booking.approved === false){
                        unapprovedBooking = true;
                    }                    
                    if(booking.approved === true){
                        approvedBooking = true;    
                    }
                });
                
                // render user template with that user
                res.render("users/user.ejs", {user: foundUser, unapprovedBooking: unapprovedBooking, approvedBooking: approvedBooking});
            }
        });
    });
    
    //======================================
    // REGISTERED ROUTES ===================
    //======================================   
    // Show - shows a list of registered users in the system
    app.get("/user/:id/registered", isLoggedIn, function(req, res){
        
        // find the logged in user with provided ID
        User.findById(req.params.id).populate("info").exec(function(err, foundUser){
            if(err){
                console.log(err);
            } else {
                console.log(foundUser)
                
                Registered.find({}, function(err, allRegisteredUsers){
                    if(err){
                        console.log(err);
                    } else {
                        res.render("users/users.ejs", {
                            registeredUsers: allRegisteredUsers, // get our registered users from the database and pass to template
                            user : foundUser // get the user out of session and pass to template
                        });  
                    }
                });              
            }
        });          
    });
    
    // Show - shows bookings for a particular registered user
    app.get("/user/:user_id/registered/:registered_user_id", isLoggedIn, function(req, res){
    
        // find the logged in user with provided ID
        User.findById(req.params.user_id).populate("bookings").exec(function(err, foundUser){
            if(err){
                console.log(err);
            } else {
                console.log(foundUser)
                
                Registered.findById(req.params.registered_user_id).populate("bookings").exec(function(err, registeredUser){
                    if(err){
                        console.log(err);
                    } else {
                        
                        var unapprovedBooking = false;                
                        var approvedBooking = false;
                        // before we render template we need to prepare for some conditions based on booking requests and approval status
                        registeredUser.bookings.forEach(function(booking){
                            if(booking.approved === false){
                                unapprovedBooking = true;
                            }                    
                            if(booking.approved === true){
                                approvedBooking = true;    
                            }
                        });                        
                        
                        res.render("users/registered.ejs", {
                            user : foundUser, // get the user out of session and pass to template                            
                            registeredUser: registeredUser, // get our registered users from the database and pass to template
                            unapprovedBooking: unapprovedBooking, // pass unapproved booking flag for condition checks
                            approvedBooking: approvedBooking  // pass approved booking flag for condition checks                         
                        });  
                    }
                });                
            }
        });        
    });  
    
    
    //======================================
    // BOOKING ROUTES ======================
    //======================================
    app.get("/user/:id/bookings/new", isLoggedIn, function(req, res){
        // find user by id
        User.findById(req.params.id, function(err, user){
            if(err){
                console.log(err);
            } else {
                res.render("bookings/new.ejs", {user: user});     
            }
        });
    });  
    
    app.post("/user/:id/bookings", isLoggedIn, function(req, res){
        // Get data from create new booking form and add to bookings array
        var fromDate = req.body.fromDate;
        var toDate = req.body.toDate;
        var days = req.body.days;
        var approved = false;
        var requestedBy = req.user;
        var newBooking = {fromDate: fromDate, toDate: toDate, days: days, approved: approved, requestedBy: requestedBy};
        // lookup user using id
        User.findById(req.params.id, function(err, user){
            if(err){
                console.log(err);
                res.redirect("/users");
            } else {
                Booking.create(newBooking, function(err, booking){
                    if(err){
                        console.log(err);
                    } else {
                        user.bookings.push(booking);
                        user.save();
                        res.redirect("/user/" + user._id);
                    }
                });
            }
        });
    });    

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get("/logout", function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect("/");
}