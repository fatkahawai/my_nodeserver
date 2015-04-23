README.md

my_nodeserver

an example of a web server.
uses Node & Express that serve files from the current directory, and can also provide middleware API responding to an ajax request, returning a JSON object which can be directly referenced in the client.

to start, download the source files into a new directory, and run node from command line with the my_nodeserver.js file as argument
    > node my_nodeserver.js

this starts the http server on localthost using port 8000

When a user now browses to http://localhost:8000, an index.html file in the directory will be loaded ad displayed 

