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
MongoClient.connect('mongodb://localhost:27017/URLshort', function (err, db) {

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
        console.log('Requested path is: ', reqPath);
        function showResult() {
            shortURL = JSON.stringify(shortURL);
            console.log(shortURL)
            response.render('result', {
                result: shortURL
            });
        }

        //check is it a short link
        URLcollection.findOne({ "shortURL": Number(reqPath) }, function (err, doc) {
            if (doc) {
                console.log('doc.CompleteURL', doc.CompleteURL);
                // window.open(doc.CompleteURL, "_self");
                // window.location.href = "doc.CompleteURL";
                let redirect = (doc.CompleteURL.includes('http')) ? doc.CompleteURL : 'http://' + doc.CompleteURL;
                response.redirect(redirect);
            } else {
                if (validURL(reqPath)) {
                    console.log("Valid URL format");
                    // checking is URL already in DB
                    URLcollection.find({ "CompleteURL": reqPath }).toArray(function (err, inDB) {
                        console.log('inDB', inDB + ' ' + inDB.length);
                        if (inDB.length != 0) {
                            // if URL is already in DB
                            console.log("Already in DB", inDB);
                            shortURL = inDB;
                            showResult();
                        } else {
                            // Creating short URL based on collection length
                            URLcollection.find({}).toArray(function (err, docs) {
                                if (err) throw err
                                shortURL = {
                                    CompleteURL: reqPath,
                                    shortURL: docs.length
                                }
                                console.log('bla');

                                // Saving short URL in base
                                URLcollection.insertOne(shortURL, function (err, data) {
                                    if (err) throw err
                                    showResult();
                                });
                            });
                        }
                    });
                } else {
                    console.log("Not a valid URL format!");
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

}); // MongoClient.connect('mongodb://localhost:27017/URLshort', function (err, db) {
