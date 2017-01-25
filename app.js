'use strict';

/*
 * Express Dependencies
 */
var express = require('express'),
    app = express(),
    port = 3000,
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    compression = require('compression');

/*
 * Use Handlebars for templating
 */
var exphbs = require('express-handlebars');
var hbs;

// MongoClient.connect('mongodb://localhost:27017/video', function (err, db) {

    // assert.equal(null, err);
    // console.log("Successfully connected to MongoDB.");

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


    /*
     * Start it up
     */
    app.listen(process.env.PORT || port);
    console.log('Express started on port ' + port);

//});
