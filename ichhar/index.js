const express = require('express');
var mysql = require('mysql');
const handlebars = require('express-handlebars');
const app = express();
let alert = require('alert'); 
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
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

// cookie parser middleware
app.use(cookieParser());

//session
app.use(session({
    secret: "123456789",
    resave: true,
    saveUninitialized: true
}));

//page d'accueil
app.get('/', function (request, response) {
    response.render('main', {
		layout: 'index',
		loggedin: request.session.loggedin
	});
});

//sign in
app.get('/signin', (request, response) => {
    response.render('signin', {
		layout: 'index'
	})
});

app.post('/signin', function(request, response) {
	// Capture the input fields
	let email = request.body.email;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (email && password) {
		// Execute SQL query that'll select the account from the database based on the specified email and password
		con.query('SELECT nom FROM utilisateur WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.email = email;
				request.session.nom = results[0].nom;
				request.session.userInfo = results[0];
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
app.get('/signup', (request, response) => {
    response.render('signup', {layout: 'index'});
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

///////////teeeeeeeeeeeest
app.get('/test/:nom', (request, response) => {
    con.query("SELECT * FROM utilisateur where nom = ?" , request.params.nom, function (err, result, fields) {
        if (err) throw err;
			console.log(result);
			response.render('test', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userinfo: result
		});
    });
})

///////////teeeeeeeeeeeest
app.get('/checkusername/:nom', (request, response) => {
    con.query("SELECT * FROM utilisateur where nom = ?" , request.params.nom, function (err, result, fields) {
        if (err) throw err;
			console.log(result);
			if (result.length == 0) {
				response.json({
					"status": "ok"
				});
			} else {
				response.json({
					"status": "existe"
				});
			}
    });
})

//profile
app.get('/profile/:nom/', (request, response) => {
    con.query("SELECT * FROM utilisateur where nom = ?" , request.params.nom, function (err, result, fields) {
        if (err) throw err;
			console.log(result);
			response.render('profile', {
			layout: 'index',
			loggedin: request.session.loggedin,
			nom: request.session.nom,
			userinfo: result,
			session: request.session
		});
    });
})

app.get('/profile/:nom/annonces', (request, response) => {
	con.query("SELECT * FROM utilisateur where nom = ?" , request.params.nom, function (err, result, fields) {
        if (err) throw err;
			console.log(result);
			response.render('profile1', {
			layout: 'index',
			loggedin: request.session.loggedin,
			nom: request.params.nom,
			userinfo: result
		});
    });
})

app.get('/profile/:nom/reglages', (request, response) => {
	con.query("SELECT * FROM utilisateur where nom = ?" , request.params.nom, function (err, result, fields) {
        if (err) throw err;
			console.log(result);
			response.render('profile', {
			layout: 'index',
			loggedin: request.session.loggedin,
			nom: request.params.nom,
			userinfo: result
		});
    });
})

app.post('/profile/:nom/reglages', (request, response) =>{
	var nom = request.params.nom;
	var sql = "UPDATE utilisateur set cin = '"+request.body.cin+"' , nom = '"+request.body.nom+"' , prenom = '"+request.body.prenom+"' , email = '"+request.body.email+"' , password = '"+request.body.password+"', telephone = '"+request.body.telephone+"' WHERE nom = ?";
	con.query(sql, [nom], function (err, result) {
		if (err) throw err;
		else {
			if (request.body.password != request.body.c_password) {
				response.redirect('/profile/:nom/reglages?msg=passwordsdonotmatch');
			} else {
				console.log(result.affectedRows + " Record(s) updated.");
				console.log(result);
			}
		}
		response.end();
	 });
	
})

//add an adv
app.get('/add-ads/step1', (request, response) => {
    if(request.session.loggedin == true) {
		response.render('addADS', {
			layout: 'index',
			loggedin: request.session.loggedin
		});
	}
	else {
		return response.redirect('/signin');
	}			
})

app.get('/add-ads/step1/step2', (request, response) => {
	response.render('addADS1', {
		layout: 'index',
		loggedin: request.session.loggedin
	});	
});

app.get('/add-ads/step1/step2/payement', (request, response) => {
	response.render('payement', {
		layout: 'index',
		loggedin: request.session.loggedin,
	});
});

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

//categorie
app.get('/categories/:nom/', (request, response) => {
	var cat = request.params.nom;

	// if (cat == "vehicule") {
	// 	con.query("SELECT * FROM vehicule where nom = ?" , request.params.nom, function (err, result, fields) {
	// 		if (err) throw err;
	// 		console.log(result);
	// 		response.render('profile', 
	// 		{layout: 'index',
	// 		userinfo: result});
	// 	});
	// } else if (cat == "immobilier") {
	// 	con.query("SELECT * FROM vehicule where nom = ?" , request.params.nom, function (err, result, fields) {
	// 		if (err) throw err;
	// 		console.log(result);
	// 		response.render('profile', 
	// 		{layout: 'index',
	// 		userinfo: result});
	// 	});
	// }




	con.query("SELECT * FROM categorie, annonce where nom = ? and categorie.nom = annonce.categorie" , request.params.nom, function (err, result, fields) {
        if (err) throw err;
        response.render('categorie', 
        {layout: 'index',
		loggedin: request.session.loggedin,
        catinfo: result});
    });
})

//favoris
app.get('/favoris', function(request, response, next) {
    var sql='SELECT * FROM annonce';
    con.query(sql, function (err, data, fields) {
    if (err) throw err;
    response.render('favoris', { 
		layout:'index', 		
		loggedin: request.session.loggedin,
		userData: data});
  });
})

//app.post('/favoris', function(request, response, next) {
    //var sql='SELECT * FROM annonce';
    //con.query(sql, function (err, data, fields) {
   // if (err) throw err;
   // response.render('favoris', { layout:'index', title: 'favoris', userData: data});
 // });
//})

//annonce
app.get('/annonce/:titre/:id', (request, response) => {
	con.query("SELECT * FROM categorie, annonce where annonce.id = ? and categorie.nom = annonce.categorie" , request.params.id, function (err, result, fields) {
        if (err) throw err;
        response.render('annonce', 
        {layout: 'index',
        annonceinfo: result,
		loggedin: request.session.loggedin
		});
    });
})


app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})