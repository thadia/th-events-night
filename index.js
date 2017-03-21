var server = require('express');
var request = require('request');
var port = process.env.PORT || 3500;
var app = server();
app.use(server.static(__dirname + '/public'));
app.use('/bower_components', server.static(__dirname + '/bower_components'));
app.use('/client', server.static(__dirname + '/client'));
var path = require('path');
var mongoose = require('mongoose');
var Promise = require('es6-promise').Promise;
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectID;

var user = {

};

var passport = require('passport');
var strategy = require('passport-twitter').Strategy;

passport.use(new strategy({
        consumerKey: "ConsumerKeyHERE",
        consumerSecret: "ConsumerSecretHERE",
        callbackURL: "http://th-events-night.herokuapp.com/auth/twitter/callback"
    },
    function (token, tokenSecret, profile, cb) {
        user.id = profile.id;
        user.name = profile.username;
        console.log("PROFILE: " + profile.username);
        this.redirect('/home'); //+profile.id);

        /* User.findOrCreate({ twitterId: profile.id }, function (err, user) {
           return cb(err, user);
         });*/
    }
));

//app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({
    extended: true
}));
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


var BarsSchema = new Schema({
    bar_name: {
        type: String,
        required: true,
        trim: true
    },
    going_list: {
        type: Array,
        required: false,
        trim: true
    }

});

var Bar = mongoose.model('Bar', BarsSchema);

mongoose.connect('mongodb://pass:user@ds0db:port/th-events-night'); //DB Creds HERE

app.listen(port, function () {
    console.log('Ready: ' + port);
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
        failureRedherkirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/home');
    });

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
    user.id = null;
    user.name = null;
});

var Yelp = require('yelp');
var city;

var yelp = new Yelp({
    consumer_key: 'ConsumerKeyHERE',
    consumer_secret: 'ConsumerSecretHERE',
    token: 'TokenHERE',
    token_secret: 'SecretTokneHERE',
});

// See http://www.yelp.com/developers/documentation/v2/search_api

app.get('/search/:what/:where', function (req, res) {

    yelp.search({
            term: req.params.what,
            location: req.params.where
        })
        .then(function (data) {
            res.json(data);
        });
});

app.get('/city', function (req, res) {
    request("http://ipinfo.io", function (error, response, body) {
        if (error) {
            console.log(error);
        } else {
            city = JSON.parse(body).city;
            res.send(city);
        }
    });

    yelp.search({
            term: 'bar',
            location: city
        })
        .then(function (data) {
            res.json(data);
        })
        .catch(function (err) {
            console.error("ERROR: " + err);
        });

});

app.get('/', function (req, res) {
    var fileName = path.join(__dirname, '/client/viewBars.html');
    res.sendFile(fileName, function (err) {
        if (err) {
            console.log(err);
            res.status(err.status).end();
        } else {
            console.log('Sent:', fileName);
        }
    });
});

app.get('/home', function (req, res) {
    var fileName = path.join(__dirname, '/client/editBars.html');
    if (user.id) {
        console.log(user.id + " User ");
        res.sendFile(fileName, function (err) {
            if (err) {
                console.log(err);
                res.status(err.status).end();
            } else {
                console.log('Sent:', fileName);
            }
        });
    } else {
        res.redirect('/');
    }
});


app.get('/addme/:barName/:username', function (req, res) {

    function toTitleCase(str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
    console.log("BarName: " + req.params.barName + "  UserName: " + req.params.username);
    //  res.redirect('/home');          

    Bar.findOne({
        bar_name: toTitleCase(req.params.barName)
    }, function (err, bar) {
        if (bar) {
            console.log(bar + " Found!");
            bar.going_list.push(req.params.username);
            bar.markModified('going_list');
            bar.save(function (err, bar) {
                if (err) {
                    console.log('error on save_update');
                } else {
                    res.send(bar);
                    console.log('Data is saved: ' + bar);
                }
            });

        } else {
            console.log("Not in Database. Creating New.");
            var new_bar = new Bar({
                bar_name: toTitleCase(req.params.barName),
                going_list: req.params.username
            });

            new_bar.save(function (error, data) {
                if (error) {
                    console.log(error);
                } else {
                    res.send(bar);
                    console.log(data + " is saved.");
                }
            });
        }

        if (err) {
            console.log('error on save_update');
        }

    });


});


app.get('/username', function (req, res) {
    var obj = {
        "userid": user.id,
        "username": user.name
    };
    res.send(obj);
});


app.get('/removeme/:barName/:username', function (req, res) {

    function toTitleCase(str) {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }
    console.log("BarName: " + req.params.barName + "  UserName: " + req.params.username);
    //  res.redirect('/home');          

    Bar.findOne({
        bar_name: toTitleCase(req.params.barName)
    }, function (err, bar) {
        if (bar) {
            console.log(bar + " Found!");
            console.log(bar.going_list.length + " List Length!");

            bar.going_list.splice(bar.going_list.indexOf(req.params.username), 1);
            bar.markModified('going_list');
            bar.save(function (err, bar) {
                if (err) {
                    console.log('error on save_update_removing' + err);
                } else {
                    res.send(bar);
                    console.log('Data is saved: ' + bar);
                }
            });

        }

        if (err) {
            console.log('error on find_save_update_removing');
        }
    });

});


app.get('/bars/all', function (req, res) {

    Bar.find({}, '-_id', {}, function (err, latest_data) {
        if (err) return console.error(err);
        else {
            //console.log("latest_data " + latest_data);
            res.json(latest_data);
        }
    });

});
