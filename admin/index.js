const express = require('express');
var mysql = require('mysql');
const handlebars = require('express-handlebars');
const app = express();
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
var session = require('express-session');
const port = 3001;
const path = require('path');

const hbs = handlebars.create({
    layoutsDir: __dirname + '/views/layouts/',
    extname: 'hbs'
});
  
app.use(express.static('public'));
  
  //database connection
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "pfe"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});
  
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './views');
  
//app.use(express.bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
  
// cookie parser middleware
app.use(cookieParser());
  
//session
app.use(session({
        secret: "123456789",
        resave: true,
        saveUninitialized: true
    })
);

app.get('/ichhar-admin/home', (request, response) => {
    response.render('main', {
        layout : 'index',
        loggedin: request.session.loggedin
    });
});

app.get('/ichhar-admin/signin', (request, response) => {
    response.render('signin', {
        layout : 'index',
        loggedin: request.session.loggedin
    });
});

app.post('/ichhar-admin/signin', function(request, response) {
	let email = request.body.email;
	let password = request.body.password;
	if (email && password) {
		con.query('SELECT * FROM utilisateur WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.email = email;
				response.redirect('/ichhar-admin/home');
			} 
            else {
				response.redirect('/signin?msg=errorlogin');
			}			
			response.end();
		});
	} 
    else {
		response.redirect('/signin?msg=fillfields');
		response.end();
	}
});

//logout
app.get('/ichhar_admin/logout', function(request,response){
	if (request.session.loggedin) {
        delete request.session.loggedin;
		response.redirect('/ichhar-admin/home');
    } else {
        response.json({result: 'ERROR', message: 'User is not logged in.'});
    }
}); 

app.get('/ichhar-admin/clients', (request, response) => {
    con.query("SELECT * FROM utilisateur WHERE status = 1", function (err, result, fields) {
        if (err) throw err;
			response.render('clients', {
			layout: 'index',
            loggedin: request.session.loggedin,
			userinfo: result
		});
    });
});

app.get('/ichhar-admin/categories', (request, response) => {
    con.query("SELECT * FROM categorie" ,function (err, result, fields) {
        if (err) throw err;
			response.render('categories', {
			layout: 'index',
            loggedin: request.session.loggedin,
			catinfo: result
		});
    });
});

app.get('/ichhar-admin/annonces', (request, response) => {
    con.query("SELECT * FROM annonce" ,function (err, result, fields) {
        if (err) throw err;
			response.render('annonces', {
			layout: 'index',
            loggedin: request.session.loggedin,
			annonceinfo: result
		});
    });
});

app.get('/ichhar-admin/annoncesattentes', (request, response) => {
    con.query("SELECT * FROM annonce WHERE status = 0" ,function (err, result, fields) {
        if (err) throw err;
			response.render('annonceattente', {
			layout: 'index',
            loggedin: request.session.loggedin,
			annonceattenteinfo: result,
		});
    });
});

app.get('/ichhar-admin/profil', (req, res) => {
    res.render('profil', {
        layout : 'index',
        loggedin: request.session.loggedin,
    });
});

app.listen(port, () => console.log(`App listening to port ${port}`));