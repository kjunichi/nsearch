var express = require('express')
, partials = require("express-partials")
, passport = require('passport')
, querystring = require("querystring")
, TwitterStrategy = require('passport-twitter').Strategy;
 
var TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY||(require("./secret.json")).TWITTER_CONSUMER_KEY;
var TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET||(require("./secret.json")).TWITTER_CONSUMER_SECRET;


// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing. However, since this example does not
// have a database of user records, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function(user, done) {
done(null, user);
});
 
passport.deserializeUser(function(obj, done) {
done(null, obj);
});
 
 
// Use the TwitterStrategy within Passport.
// Strategies in passport require a `verify` function, which accept
// credentials (in this case, a token, tokenSecret, and Twitter profile), and
// invoke a callback with a user object.
var ts = new TwitterStrategy(
    {
        consumerKey: TWITTER_CONSUMER_KEY,
        consumerSecret: TWITTER_CONSUMER_SECRET,
        callbackURL: process.env.TWITTER_OAUTH_CALLBACK_URL||(require("./secret.json")).TWITTER_OAUTH_CALLBACK_URL
    },
    function(token, tokenSecret, profile, done) {
        // トークンとトークンシークレットをユーザ情報の中に入れて、API叩く際にこれを参照する。
        profile.twitter_token = token;
        profile.twitter_token_secret = tokenSecret;
 
        //console.dir(ts._oauth);
        //console.log(ts.options);
 console.dir(profile);
        // asynchronous verification, for effect...
        process.nextTick(function () {
            // To keep the example simple, the user's Twitter profile is returned to
            // represent the logged-in user. In a typical application, you would want
            // to associate the Twitter account with a user record in your database,
            // and return that user instead.
            return done(null, profile);
        });
    }
);
passport.use(ts);

var app = express();
app.use(partials());  
// configure Express
app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    //app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({ secret: 'keyboard cat' }));
    // Initialize Passport! Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});


app.get('/', function(req, res){
    
    var timeline={};
    if (req.isAuthenticated()) {
        //passport._strategies._oauth.getProtectedResource(
        ts._oauth.getProtectedResource(
            'https://api.twitter.com/1.1/statuses/home_timeline.json',
            'GET',
            req.user.twitter_token,
            req.user.twitter_token_secret,
            function (err, data, response) {
                if(err) {
                   res.send(err, 500);
                    return;
                }
        
                var jsonObj = JSON.parse(data);
                res.render('index.ejs', {
                    user: req.user,
                    result: jsonObj
                });
            }
        );
    } else {
        res.render('index.ejs', { user: req.user,result:null });
    }
});
 
app.get('/account', ensureAuthenticated, function(req, res){
    res.render('account', { user: req.user });
});

app.get('/test.appcache', function(req, res){
    // Application Cache Test
    res.send("test",200);
});
 
app.get('/login', function(req, res){
    res.render('login', { user: req.user });
});

// GET /auth/twitter
// Use passport.authenticate() as route middleware to authenticate the
// request. The first step in Twitter authentication will involve redirecting
// the user to twitter.com. After authorization, the Twitter will redirect
// the user back to this application at /auth/twitter/callback
app.get('/auth/twitter',
    passport.authenticate('twitter'),
    function(req, res){
        // The request will be redirected to Twitter for authentication, so this
        // function will not be called.
    }
);
 
// GET /auth/twitter/callback
// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page. Otherwise, the primary route function function will be called,
// which, in this example, will redirect the user to the home page.
app.get('/auth/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/search');
    }
);
 
app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.get('/listlist', ensureAuthenticated, function (req, res) {
    ts._oauth.getProtectedResource(
        'https://api.twitter.com/1.1/lists/list.json',
        'GET',
        req.user.twitter_token,
        req.user.twitter_token_secret,
        function (err, data, response) {
            
            if(err) {
                res.send(err, 500);
                return;
            }
        
            var jsonObj = JSON.parse(data);
            res.render('listlist', {
                user: req.user,
                result: jsonObj
            });
        }
    );
}); 

app.get('/list', ensureAuthenticated, function (req, res) {
    console.dir(req.user);
    var listid = req.query["listid"];
    if(!listid||listid === "") {
        listid = "78331407";
    }
   
    res.render('list', {
        user: req.user,
        listid: listid
    });
}); 

app.get('/search', ensureAuthenticated, function (req, res) {
    //console.dir(req.user);
    
    var keyword = req.query["keyword"];
    if(!keyword||keyword === "") {
        keyword = "kjunichi -from:kjunichi";
    }
       
    res.render('search', {
        user: req.user,
        keyword: keyword
    });
}); 


// Ajaxで呼ばれる系
app.get('/list.json', ensureAuthenticated, function (req, res) {
    //console.dir(req.user);
    
    // パラメータの取得
    var listid = req.param('listid');
    if(!listid||listid === "") {
        listid = "78331407";
    }
   
    // Twitter APIの利用
    ts._oauth.getProtectedResource(
        'https://api.twitter.com/1.1/lists/statuses.json?list_id='+listid+"&count=100",
        'GET',
        req.user.twitter_token,
        req.user.twitter_token_secret,
        function (err, data, response) {
            res.set('Content-Type', 'application/json');
            if(err) {
                console.log(err);
                res.json({result:"NG"});
                return;
            }
            //console.log(data);
            var jsonObj = JSON.parse(data);
            res.json(jsonObj);
        }
    );
});

app.get('/search.json', ensureAuthenticated, function (req, res) {
    //console.log(req.body.keyword);
    var keyword = req.param('keyword');
    if(!keyword||keyword === "") {
        keyword = "kjunichi -from:kjunichi";
    }
    var twApiUrl = 'https://api.twitter.com/1.1/search/tweets.json?'+querystring.stringify({q:keyword})+"&count=100";
    var sinceYmd= req.body.sinceYmd;
    if(sinceYmd&&sinceYmd!="") {
        twApiUrl=twApiUrl+"&"+querystring.stringify({since:sinceYmd});
    }
    var untilYmd = req.body.untilYmd;
    if(untilYmd&&untilYmd!="") {
        twApiUrl=twApiUrl+"&"+querystring.stringify({until:untilYmd});
    }
    console.log("twApiUrl = "+twApiUrl);
    ts._oauth.getProtectedResource(
        twApiUrl,
        'GET',
        req.user.twitter_token,
        req.user.twitter_token_secret,
        function (err, data, response) {
            //console.dir(req.user);
            if(err) {
                console.log(err);
                res.send(err, 500);
                return;
            }
            //console.dir(data);
            var jsonObj = JSON.parse(data);
            res.set('Content-Type', 'application/json');
            res.json(jsonObj);
        }
    );
    
});
 
// Simple route middleware to ensure user is authenticated.
// Use this route middleware on any resource that needs to be protected. If
// the request is authenticated (typically via a persistent login session),
// the request will proceed. Otherwise, the user will be redirected to the
// login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); 
    }
    res.redirect('/');
}

app.listen(process.env.PORT||5000);
