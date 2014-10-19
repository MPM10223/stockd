
/*
 * GET home page.
 */
var http = require('http');
var url = require('url');
var cheerio = require('cheerio');
var jsdom = require('jsdom').jsdom;
var mongo = require('mongojs');
var fs = require('fs');
var Browser = require('zombie');

exports.processURL = function(req, res){
    scrapeURLZombie(req.param('productURL'), res);
};

function scrapeURLZombie(productURL, res) {

    var parsedURL = url.parse(productURL);
	
	var browser = new Browser();

	browser.visit(productURL, function() {

		fs.writeFile('gap2.html', browser.html());

		var db = mongo.connect('stokd', ['retailers']);
		db.retailers.findOne({hostnames: parsedURL.hostname}, function(err, retailerDoc) {
		
			console.log(retailerDoc.queryStrings.brandName);
			console.log(browser.query(retailerDoc.queryStrings.brandName));
		
			//var brand = browser.query(retailerDoc.queryStrings.brandName).text();
			
			var response = {
				success: true
				, brand: brand
			};
					
			res.write(JSON.stringify(response));
					
			console.log(JSON.stringify(response));
					
			res.end();
		});
	});
};

function scrapeURLjsDom(productURL, res) {

	jsdom.env({
		url: productURL
		, scripts: ['http://code.jquery.com/jquery.js']
		, features: {
			FetchExternalResources: ["script"],
			ProcessExternalResources: true
		}
		, done: function(err, window) {
			console.log(window.$('#productNameText').html());
			
			//fs.writeFile('gap.html', window.$('html').html());
		}
	});
};

function scrapeURL(productURL, res) {

	console.log('Scraping ' + productURL);

    var parsedURL = url.parse(productURL);
    
    //console.log(parsedURL);
    
    var options = {
        host: parsedURL.hostname
        , path: parsedURL.path
        , headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.71 Safari/534.24'
        }
    };
    
    http.get(options, function(urlres) {
        if(urlres.statusCode == 200) {
            var body = [];
            urlres.setEncoding('utf8');
            
            urlres.on('data', function(chunk) {
                body.push(chunk);
            });
            
            urlres.on('end', function() {
                body = body.join('');
                //console.log("BODY: " + body);
                
                var retailer = '', productnumber = -1
                    , brand = '', productname = '', imageURL = null
                    , saleprice = null, regprice = null, onsale = false
                    , allSizes = [], sizesAvailable = [], colors = [];
                
                //var q = cheerio.load(body);
									  
				var db = mongo.connect('stokd', ['retailers']);
				db.retailers.findOne({hostnames: parsedURL.hostname}, function(err, retailerDoc) {

					retailer = retailerDoc.name;
					//console.log(retailerDoc.queryStrings);

					// product number
					productnumber = q(retailerDoc.queryStrings.productNumber).text();
					 
					// brand name
					brand = q(retailerDoc.queryStrings.brandName).text();
					 
					// product name
					productname = q(retailerDoc.queryStrings.productName).text();
					 
					// image URL
					imageURL = q(retailerDoc.queryStrings.imageURL).attr('src');
					 
					// regular price
					regprice = q(retailerDoc.queryStrings.regprice).text();
					 
					// sale price
					q(retailerDoc.queryStrings.saleprice).each(function(i, el) {
						saleprice = q(this).text();
						onsale = true;
					});
					
					// colors
					q(retailerDoc.queryStrings.colors.option).each(function(i, el) {
						var colorValue = q(this).attr('value');
						if(!(colorValue === "-1")) {
							var colorName = q(this).text().trim();
							var colorImg = q(retailerDoc.queryStrings.colors.img.replace('#value#', colorValue)).attr('src');
							colors.push( { name: colorName, value: colorValue, imgURL: colorImg } );
						}
					});
					 
					// sizes
					q(retailerDoc.queryStrings.sizes.instock).each(function(i, el) {
						sizesAvailable.push(q(this).text());
					});

					q(retailerDoc.queryStrings.sizes.available).each(function(i, el) {
						allSizes.push(q(this).text());
					});
										 
					var response = {
						success: true
						, retailer: retailer
						, regprice: regprice
						, saleprice: saleprice
						, onsale: onsale
						, productnumber: productnumber
						, imageURL: imageURL
						, brand: brand
						, productname: productname
						, sizesAvailable: sizesAvailable
						, colors: colors
						, allSizes: allSizes
					};
					
					res.write(JSON.stringify(response));
					
					console.log(JSON.stringify(response));
					
					res.end();
									 
				});
            });
        } else {
            console.log('Received non-ok response: ' + urlres.statusCode);
			if(urlres.statusCode == 302) {
				console.log('Got 302, retrying on new location...' + urlres.headers.location);
				scrapeURL(urlres.headers.location, res);
			} else {
				res.write(JSON.stringify( { success: false } ));
			}
        }
    }).on('error', function(e) {
        console.log('error hitting url: ' + e.message);
        res.write(JSON.stringify( { success: false } ));
    });
	
};

exports.submitTrackingRequest = function(req, res) {
    
    var db = mongo.connect('stokd', ['sizeNotificationRequests','retailers']);
	
	db.retailers.findOne({name: req.body.retailer}, function(err, retailerDoc) {
		 db.sizeNotificationRequests.insert({
			productURL: req.body.productURL
			, productName: req.body.productName
			, retailer: retailerDoc._id
			, size: req.body.size
			, email: req.body.email
			, price: req.body.price
		}, function(err, inserted) {
			if(err || !inserted) {
			res.redirect('/error');
		} else {
			//success
			res.redirect('/confirm?id='+inserted._id);
		}
		});
	});
};