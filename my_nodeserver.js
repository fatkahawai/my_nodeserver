/**
 * AJAX_SERVER_TEMPLATE.JS
 * 
 * @version 1.0
 * 
 * DESCRIPTION:
 * Template for a HTTP server with a RESTful API
 * This is server-side JavaScript, intended to be run with NodeJS.
 * Runs an http server on port 8000. (if running on local machine, browse to http://localhost:8000/ to use it).
 * 
 * GET "<domain>/" will return index.html
 * GET "<domain>/js/somefile.js" will return a javascript file - usually means loaded by index.html
 * GET "<domain>/img/somefile.png" will return an image
 * GET "<domain>[/index.html]/?myparam=sometext&callback=?" will return a JSON object in this example
 * anything else will return a 404 error
 * 
 * @throws none
 * @see 
 * 
 * @author Bob Drummond
 * (C) 2012 PINK PELICAN NZ LTD
 */

var http = require('http');  // NodeJS HTTP server API

// Constant Definitions
var _OK = 200;
var _NOTFOUND = 404;
var _PORT = 8000;
var _HOMEPAGE = "index.html";

var contentType = null;


// ************************************************************************************
// a dummy object we will return on an ajax request
var JSONobject = {"key1": "this object is", "key2": "the correct response", "input": null };
// ************************************************************************************

// Create a new HTTP server object, which we will start after setting up our event handler
var server = new http.Server();

/**
 * Set up event handler
 * Whenever the server gets a new request, run this anonymous event handler function
 */
server.on("request", function (request, response) {

  var folder = "";
  var suffix = "";
  var relPathName = "";

  // Parse the requested URL
  var url = require('url').parse(request.url);

  console.log(request.method + " request pathname= " + url.pathname); // the full url string sent by the client
  console.log("href= " + url.href); // the filename without domain or query string e.g. "/" or "/index.html" or "/js/main.js"
  console.log("query= " + url.query); // the argument string after the "?", e.g. "myparam=something&also=blah"
  console.log("search= " + url.search); // same as query but includes the "?"

  // remove the leading "/" from pathname
  if (url.href.length > 1) {
    relPathName = url.href.slice(1);
  }
  console.log("relPathName= " + relPathName);

  var len = relPathName.length;
  console.log("len= " + len);

  // first, if its a valid filename, parse the folder and file suffix
  if (len > 1) {
    // its a valid filename
    // now try to parse the pathname for a file suffix (like ".js")
    var suffixPos = relPathName.indexOf(".") + 1; // the position in string where the suffix starts
    if (suffixPos && (len > suffixPos)) {
      // there is a ".' and theres a suffix after it
      suffix = relPathName.slice(suffixPos, len);
      console.log("suffix= " + suffix);
    }

    // try to parse the patthname for a folder name. it will start at pos 0 and go until a "/"
    // if there are more than one "/"s its a user error
    var folderEndPos = relPathName.indexOf("/"); // the position in string where the folder ends
    if (folderEndPos > 0) {
      // we found a "/" so we have a folder. (we only allow one level folders here)
      folder = relPathName.slice(0, folderEndPos);
      console.log("folder= " + folder);
    }
  }

  // now handle the request - it may be one of:
  // if its an ajax request, send a JSON string
  // else if its a requst to load index.html, read the file and send it
  // else if its a request to load a javascript file, read the file and send it
  // else unrecognised request so send 404
  if (url.query) {
    // if there is a "?..." argument string after the pathname,  its an ajax request 
    // to our RESTful API. it may be a POST or a GET

    if (request.method === "POST") {
      // If the request was a POST, then a client is posting something
      console.log("POST received");

      request.setEncoding("utf8");
      var body = "";
      // When we get a chunk of data, add it to the body
      request.on("data", function (chunk) { body += chunk; });

      // When the request is done, send an empty response 
      request.on("end", function () {
        response.writeHead(_OK);   // Respond to the request
        response.end();
        // now do something with the data the client has posted
        // ...
      });
    } // if POST
    else { // assume request.method must be a GET
      // client wants to GET a JSON object 
      console.log("not a POST so default is assume GET (actual method is" + request.method + ")");

      // Parse the GET request url for REST API arguments and store them in query variable.
      // the arguments will follow the "?", e.g. as "?myname=bob"
      // This function parses the url request and returns object representation.
      var query = require('querystring').parse(url.query);

      // ************************************************************************************
      // in this example of a RESTful API, a user parameter is expected as "?myparam=sometext"
      console.log("myparam=" + query.myparam);
      // copy the user entered text into the 3rd attribute of the JSON response object
      JSONobject["input"] = query.myparam;
      // ************************************************************************************


      // convert the JSON object into a string we can send to client
      var JSONstring = JSON.stringify(JSONobject);

      // Set the content type and send an initial message event 
      response.writeHead(_OK, {
        "Content-Type": "application/json",
        "Content-Length": JSONstring.length.toString()
      });

      // now send the stringified object 
      response.write(JSONstring);
      console.log("sent " + JSONstring);

      // always have to call end() to terminate the send
      response.end();
    } // else GET
  } // if url.query


  else if ((relPathName === "") || (relPathName === _HOMEPAGE)) {
    // Load index.html
    // If the request is just for "/" or "/index.html" with no arguments after it,
    // then its a simple page request for index.html. so read the file and send the content.
    console.log("its an implied or explicit request for index.html with no REST arguments. sending..");

    // try load the text from the HTML file for the homepage.
    try {
      var clientui = require('fs').readFileSync(_HOMEPAGE);

      response.writeHead(_OK, {"Content-Type": "text/html"});
      // send index.html
      response.write(clientui);
    } // try
    catch(error) {
      console.error("failed to load " + _HOMEPAGE + " file. Error " + error.name + ": " + error.message);
      // send a 404 response
      response.writeHead(_NOTFOUND);
    } // catch
    finally {
      response.end();
    } // always
  } // else if / or /index.html

  else {
    if ((suffix === "html") || (suffix === "htm")) {
      contentType = "text/html";
    } // else if request for html file
    else if (suffix === "js") {
      // Load javascript files
      // If the request ends in ".js", then index.html is just loading one of our 
      // javascript files, so send that file
      contentType = "application/javascript";
    } // else if request for javascript file
    else if (suffix === "css") {
      // Load CSS files
      contentType = "text/css";
    } // else if request for css file
    else if ((suffix === "jpg") || (suffix === "jpeg") || (suffix === "png") || (suffix === "gif") || (suffix === "bmp")) {
      // Load image files
      contentType = "image/" + suffix;
    } // else if request for img file 
    else {
      // Send 404 for any other unrecognised request
      console.warn(_NOTFOUND + ": unrecognised request (404):" + url.pathname);
      // send a 404 response
      response.writeHead(_NOTFOUND);
      response.end();
    } // else (404) 

    if (contentType !== null) {
      console.log("its a request for a " + contentType + " file . sending..");

      response.writeHead(_OK, {
        "Content-Type":  contentType
      });
      // try to load the content from the file.
      try {
        var fileContent = require('fs').readFileSync(relPathName);
        response.write(fileContent);
      } // try
      catch(error) {
        console.error("failed to load " + relPathName + " file. Error " + error.name + ": " + error.message);
        // send a 404 response
        response.writeHead(_NOTFOUND);
      } // catch
      finally {
        response.end();
      } // always
    } // if contentype.length
  } // else
}); // server.on

// handle termination of Node using ctl-C elegantly
process.on('SIGINT', function() {
  console.log("\nshutting down from SIGINT (Ctrl+C)");
  process.exit();
});

// start the http server on port defined above. (if running on local machine, browse to http://localhost:8000/ to use it).
server.listen(_PORT);

console.log("started http server on localhost:" + _PORT); // same as query but includes the "?"


