const express = require('express');
var mysql = require('mysql');
const handlebars = require('express-handlebars');
const app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
const port = 3000
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

//session
app.use(session({
    secret: "123456789",
    resave: true,
    saveUninitialized: true
}));

//page d'accueil
app.get('/', function (req, res) {
    res.render('main', {layout: 'index'});
});

//sign in
app.get('/signin', (req, res) => {
    res.render('signin', {layout: 'index'});
})

app.post('/signin', function(request, response) {
	// Capture the input fields
	let email = request.body.email;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (email && password) {
		// Execute SQL query that'll select the account from the database based on the specified email and password
		con.query('SELECT * FROM utilisateur WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.email = email;
				console.log(request.session.loggedin);
				// Redirect to home page
				response.redirect('/');
			} else {
				response.redirect('/signin?msg=errorlogin');
			}			
			response.end();
		});
	} else {
		response.redirect('/signin?msg=fillfields');
		response.end();
	}
});

//signup
app.get('/signup', (req, res) => {
    res.render('signup', {layout: 'index'});
})

app.post('/signup', function(request, response){

	var sql = "INSERT INTO `utilisateur`(`cin`,`nom`,`prenom`,`ville`,`telephone`,`email`, `password`) VALUES ('"+request.body.cin+"','"+request.body.nom+"','"+request.body.prenom+"','"+request.body.ville+"','"+request.body.telephone+"','"+request.body.email+"','"+request.body.password+"')";

	if (request.body.cin && request.body.nom && request.body.prenom && request.body.ville && request.body.telephone && request.body.email && request.body.password && request.body.confirmpassword){
		con.query('SELECT * FROM utilisateur WHERE email = ?', [request.body.email], function(error, results) {
			if(error) throw error;
			if (results.length > 0 ) {
				response.redirect('/signup?msg=errorsignup');
			}
			if (results.length < 1) {
				if (request.body.password == request.body.confirmpassword) {
					con.query(sql, function(error, results, fields){
						if (error) throw error;
					});
					response.redirect('/');
				}
				else {
					response.redirect('/signup?msg=passwordsdoesntmatch');
				}
			}
			response.end()
		})
	}
	else {
		response.redirect('/signup?msg=fillfields');
		response.end();
	}
})

//favoris
app.get('/favoris/:id', (req, res) => {
	res.render('favoris', {layout: 'index'});
})

app.get('/favoris', function(req, res, next) {
    var sql='SELECT * FROM annonce';
    con.query(sql, function (err, data, fields) {
    if (err) throw err;
    res.render('favoris', { layout:'index', title: 'favoris', userData: data});
  });
})

//profile
app.get('/profile/:nom/', (req, res) => {
    con.query("SELECT * FROM utilisateur where nom = ?" , req.params.nom, function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        res.render('profile', 
        {layout: 'index',
        userinfo: result});
    });
})

//add an ad
app.get('/add-ads', (req, res) => {
    res.render('addADS', {layout: 'index'});
})

app.post('/add-ads', (request, response) => {
    var sql = "INSERT INTO `annonce`(`titre`,`description`,`photo_url`,`type`,`prix`,`ville`,`telephone`,`categorie`) VALUES ('"+request.body.titre+"','"+request.body.description+"','"+request.body.photo_url+"','"+request.body.type+"','"+request.body.prix+"','"+request.body.ville+"','"+request.body.telephone+"','"+request.body.categorie+"')";

	if (request.body.titre && request.body.description && request.body.photo_url && request.body.type && request.body.prix && request.body.ville && request.body.telephone && request.body.categorie){
		con.query(sql, function(error, results, fields){
			if (error) throw error;
			else{
				response.redirect('/')
			}
		})
		response.end()
	}
	else {
		response.redirect('/add-ads?msg=fillfields');
		response.end();
	}
})

//add an ad
app.get('/categories', (req, res) => {
    res.render('categorie', {layout: 'index'});
})

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})