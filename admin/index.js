const express = require('express');
var mysql = require('mysql');
const handlebars = require('express-handlebars');
const app = express();
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
var session = require('express-session');
const port = 3001;
const path = require('path');
const { request } = require('http');
const { response } = require('express');

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

//Home page
app.get('/ichhar-admin/home', (request, response) => {
    response.render('main', {
        layout : 'index',
        loggedin: request.session.loggedin
    });
});

//Display sign in page
app.get('/ichhar-admin/signin', (request, response) => {
    response.render('signin', {
        layout : 'index',
        loggedin: request.session.loggedin
    });
});

//Sign in procedure
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

//Logout
app.get('/ichhar_admin/logout', function(request,response){
	if (request.session.loggedin) {
        delete request.session.loggedin;
		response.redirect('/ichhar-admin/home');
    } 
    else {
        response.json({
            result: 'ERROR', 
            message: 'User is not logged in.'
        });
    }
}); 

//Search
app.get('/search', (request, response) => {
    var nom = request.query.search;
    var sql = "SELECT * FROM utilisateur where nom LIKE '%"+nom+"' ";
    con.query(sql, function(error, result){
        if (error) throw error;
        response.render('clients', {
			layout: 'index',
            loggedin: request.session.loggedin,
			userinfo: result
		});
    })
    console.log(nom);
});

//CLIENTS
    //Display the user's list
app.get('/ichhar-admin/clients', (request, response) => {
    sql0 = "SELECT * FROM utilisateur WHERE status = 1;"
    sql1 = "SELECT COUNT(*) FROM utilisateur WHERE status = 1;"
    con.query(sql0, function (err, result, fields) {
        if (err) throw err;
		response.render('clients', {
			layout: 'index',
            loggedin: request.session.loggedin,
			userinfo: result
		});
    });
});
    //Delete a user
app.get('/ichhar-admin/clients/delete/:id', (request, response) => {
    userId = request.params.id;
    sql = `UPDATE utilisateur SET status = 2 where id = ?`;
    con.query(sql , userId,function (err, result, fields) {
        if (err) throw err;
		response.render('clients', {
			layout: 'index',
            loggedin: request.session.loggedin,
			userinfo: result
		});
        return response.end();
    });
    response.redirect('/ichhar-admin/clients'); 
});
    //Search a user by name

//CATEGORIES
    //Display the categories list
app.get('/ichhar-admin/categories', (request, response) => {
    con.query("SELECT * FROM categorie where status = 0" ,function (err, result, fields) {
        if (err) throw err;
			response.render('categories', {
			layout: 'index',
            loggedin: request.session.loggedin,
			catinfo1: result
		});
    });
});
    //Add a category form
    //Add a category procedure

    //Update a category form
app.get('/ichhar-admin/categories/update/:id', (request, response) => {
    userId = request.params.id;
    sql0 = "SELECT * FROM categorie WHERE status = 0 and id = ?;"
    con.query(sql0, userId, function (err, result, fields) {
        if(err) throw err;
        response.render('categorie-update', {
            layout: 'index',
            loggedin: request.session.loggedin,
            catinfo : result
        });
    });
});
    //Update a category procedures
app.post('/ichhar-admin/categories/update/:id', (request, response) => {
    userId = request.params.id;
    sql = "UPDATE categorie SET nom = '" + request.body.noom + "', description = '" + request.body.desc + "', photo_url = '" + request.body.photo_url + "' where id = ?";
    con.query(sql , userId, function (err, results) {
        if (err) throw err;
        response.render('categorie-update', {
			layout: 'index',
            loggedin: request.session.loggedin,
			catinfo: results
		});
        return response.end();   
    });  
    response.redirect('/ichhar-admin/categories');
});

    //Delete a category
app.get('/ichhar-admin/categories/delete/:id', (request, response) => {
    userId = request.params.id;
    sql = `UPDATE categorie SET status = 1 where id = ?`;
    con.query(sql , userId,function (err, result, fields) {
        if (err) throw err;
		response.render('categories', {
			layout: 'index',
            loggedin: request.session.loggedin,
			catinfo: result
		});
        return response.end();
    });
    response.redirect('/ichhar-admin/categories'); 
});

//ADVERTISMENTS
    //Display the advertisments list
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

//ADVERTISMENTS in wait
    //Display the advertisments in wait list
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

    //Approuver une annonce
app.get('/ichhar-admin/annoncesattentes/approuver/:id', (request, response) => {
    userId = request.params.id;
    sql = "UPDATE annonce SET status = 1 where id = ?"
    con.query(sql, userId, function (err, result, fields) {
        if (err) throw err;
            response.render('annonceattente', {
            layout: 'index',
            loggedin: request.session.loggedin,
            annonceattenteinfo: result,
        });
        return response.end();
    });
    response.redirect('/ichhar-admin/annoncesattentes'); 
});

    //Refuser une annonce
app.get('/ichhar-admin/annoncesattentes/refuser/:id', (request, response) => {
    userId = request.params.id;
    sql = "UPDATE annonce SET status = 2 where id = ?"
    con.query(sql, userId, function (err, result, fields) {
        if (err) throw err;
            response.render('annonceattente', {
            layout: 'index',
            loggedin: request.session.loggedin,
            annonceattenteinfo: result,
        });
        return response.end();
    });
    response.redirect('/ichhar-admin/annoncesattentes'); 
});


app.get('/ichhar-admin/profil', (req, res) => {
    res.render('profil', {
        layout : 'index',
        loggedin: request.session.loggedin,
    });
});

app.listen(port, () => console.log(`App listening to port ${port}`));