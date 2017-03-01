'use strict';

/*
 * Express Dependencies
 */
let express = require('express'),
    app = express(),
    port = 3000,
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    compression = require('compression');

/*
 * Use Handlebars for templating
 */
let exphbs = require('express-handlebars');
let hbs;

// mongodb://localhost:27017/URLshort
MongoClient.connect('mongodb://NinoMaj:bosswarmLab1@ds135069.mlab.com:35069/ninodb', function (err, db) {

    assert.equal(null, err);
    console.log("Successfully connected to MongoDB.");
    let URLcollection = db.collection('URL');

    // For gzip compression
    app.use(compression());

    /*
     * Config for Production and Development
     */
    if (process.env.NODE_ENV === 'production') {
        // Set the default layout and locate layouts and partials
        app.engine('handlebars', exphbs({
            defaultLayout: 'main',
            layoutsDir: 'dist/views/layouts/',
            partialsDir: 'dist/views/partials/'
        }));

        // Locate the views
        app.set('views', __dirname + '/dist/views');

        // Locate the assets
        app.use(express.static(__dirname + '/dist/assets'));

    } else {
        app.engine('handlebars', exphbs({
            // Default Layout and locate layouts and partials
            defaultLayout: 'main',
            layoutsDir: 'views/layouts/',
            partialsDir: 'views/partials/'
        }));

        // Locate the views
        app.set('views', __dirname + '/views');

        // Locate the assets
        app.use(express.static(__dirname + '/assets'));
    }

    // Set Handlebars
    app.set('view engine', 'handlebars');


    /*
     * Routes
     */
    // Index Page
    app.get('/', function (request, response, next) {
        response.render('index');
    });

    function validURL(textval) {
        let urlregex = new RegExp(
            /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/
        );
        return urlregex.test(textval);
    }

    // URL handler route
    app.get('/:url*', function (request, response, next) {
        let reqPath = request.path.slice(1),
            shortURL = {};
        function showResult() {
            if (shortURL._id) {
                shortURL._id = undefined
                };
            shortURL = JSON.stringify(shortURL);
            response.render('result', {
                result: shortURL
            });
        }

        //check is it a short link
        URLcollection.findOne({ "ShortURL": Number(reqPath)}, {_id: 0}, function (err, doc) {
            if (doc) {
                response.redirect(redirectLink);
            } else {
                if (validURL(reqPath)) {
                    // checking is URL already in DB
                    URLcollection.find({ "CompleteURL": reqPath }, {_id: 0}).toArray(function (err, inDB) {
                        console.log('inDB', inDB + ' ' + inDB.length);
                        if (inDB.length != 0) {
                            // if URL is already in DB
                            shortURL = inDB[0];
                            showResult();
                        } else {
                            // Creating short URL based on collection length
                            URLcollection.find({}, {_id: 0}).toArray(function (err, doc) {
                                if (err) throw err
                                shortURL = {
                                    CompleteURL: reqPath,
                                    ShortURL: doc.length
                                }
                                let document = shortURL;

                                // Saving short URL in base
                                URLcollection.insertOne(document, function (err, data) {
                                    if (err) throw err
                                    showResult();
                                });
                            });
                        }
                    });
                } else {
                    shortURL = "Not a valid URL format";
                    showResult();
                }
            }
        });
    });

    /*
     * Start it up
     */
    app.listen(process.env.PORT || port);
    console.log('Express started on port ' + port);

});
