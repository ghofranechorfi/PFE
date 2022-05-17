const express = require('express');
var mysql = require('mysql');
const handlebars = require('express-handlebars');
const app = express();
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
var session = require('express-session');
const port = 3000
const path = require('path');
const {
	request
} = require('http');
const {
	response
} = require('express');

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
con.connect(function (err) {
	if (err) throw err;
	console.log("Connected!");
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './views');

//app.use(express.bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

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
	console.log(request.session.userInfo);
	response.render('main', {
		layout: 'index',
		loggedin: request.session.loggedin,
		userInfo: request.session.userInfo
	});
});

//sign in
app.get('/signin', (request, response) => {
	response.render('signin', {
		layout: 'index',
		userInfo: request.session.userInfo
	})
});

app.post('/signin', function (request, response) {
	// Capture the input fields
	let email = request.body.email;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (email && password) {
		// Execute SQL query that'll select the account from the database based on the specified email and password
		con.query('SELECT * FROM utilisateur WHERE email = ? AND password = ?', [email, password], function (error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.email = email;
				request.session.nom_utilisateur = results[0].nom_utilisateur;
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
	response.render('signup', {
		layout: 'index',
		userInfo: request.session.userInfo
	});
});

app.post('/signup', function (request, response) {
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let datefinal = year + "-" + month + "-" + date;

	request.session.datefinal = datefinal;

	var sql = "INSERT INTO `utilisateur`(`cin`,`nom`,`prenom`, `nom_utilisateur`, `ville`,`telephone`,`email`, `password`, `status`, `date_creation`) VALUES ('" + request.body.cin + "','" + request.body.nom + "','" + request.body.prenom + "','" + request.body.nom_utilisateur + "','" + request.body.ville + "','" + request.body.telephone + "','" + request.body.email + "','" + request.body.password + "', 1,'" + datefinal + "')";
	var sql0 = "SELECT * FROM utilisateur where cin = ?"
	var sql1 = "SELECT * FROM utilisateur WHERE email = ?"
	var sql2 = "SELECT * FROM utilisateur WHERE nom_utilisateur = ?"
	var sql3 = "SELECT * FROM utilisateur WHERE telephone = ?"

	if (request.body.cin && request.body.nom && request.body.prenom && request.body.nom_utilisateur && request.body.ville && request.body.telephone && request.body.email && request.body.password && request.body.confirmpassword) {
		con.query(sql0, [request.body.cin], function (error, results) {
			if ((request.body.cin.length == 8) && (results.length == 0)) {
				con.query(sql3, [request.body.telephone], function (error, results) {
					if (error) throw error;
					if (results.length > 0) {
						response.redirect('/signup?msg=numberinuse');
					}
					if (results.length == 0) {
						con.query(sql1, [request.body.email], function (error, results) {
							if (error) throw error;
							if (results.length > 0) {
								response.redirect('/signup?msg=errorsignup');
							}
							if (results.length == 0) {
								con.query(sql2, [request.body.nom_utilisateur], function (error, results, fields) {
									if (error) throw error;
									if (results.length == 0) {
										if (request.body.password == request.body.confirmpassword) {
											con.query(sql, function (error, results, fields) {
												if (error) throw error;
											});
											response.redirect('/signin');
										} else {
											response.redirect('/signup?msg=passwordsdoesntmatch');
										}
									} else {
										res = results.length;
										response.redirect('/signup?msg=usernamealreadyinuse');
									}
								})
								//response.end();
							}
						})
					}
				})
			} else {
				response.redirect('/signup?msg=invalidcinnumber');
			}
		})
	} else {
		response.redirect('/signup?msg=fillfields');
		response.end();
	}
});

//logout
app.get('/logout', function (request, response) {
	if (request.session.loggedin) {
		delete request.session.loggedin,
			response.redirect('/');
	} else {
		response.json({
			result: 'ERROR',
			message: 'User is not logged in.'
		});
	}
});

///////////teeeeeeeeeeeest
app.get('/test/:nom_utilisateur', (request, response) => {
	con.query("SELECT nom_utilisateur FROM utilisateur where email = ?", [request.session.email], function (err, result, fields) {
		if (err) throw err;
		if (result == 1) {
			console.log(result);
			response.render('profile', {
				layout: 'index',
				loggedin: request.session.loggedin,
				email1: request.session.email,
				datefinal: request.session.datefinal,
				nom_utilisateur: request.session.nom_utilisateur,
				userinfo: result,
				session: request.session,
			})
		}
	});
})

///////////teeeeeeeeeeeest
app.get('/checkusername/:nom', (request, response) => {
	con.query("SELECT * FROM utilisateur where nom = ?", request.params.nom, function (err, result, fields) {
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
});

//profile
app.get('/profile/:nom', (request, response) => {
	con.query("SELECT * FROM utilisateur where nom_utilisateur = ?", request.params.nom, function (err, result, fields) {
		if (err) throw err;
		console.log('Current Profile CIN: ' + result[0].cin);
		if ((request.session.userInfo !== undefined) && (request.session.userInfo.cin === result[0].cin)) {
			console.log('Session CIN: ' + request.session.userInfo.cin);
			console.log('Its my profile');
			response.render('profile_me', {
				layout: 'index',
				loggedin: request.session.loggedin,
				email: request.session.email,
				datefinal: request.session.datefinal,
				nom: request.session.nom,
				userInfo: request.session.userInfo,
				userChosenInfo: result[0],
				session: request.session
			});
		} else {
			console.log('Its someone elses profile');

			response.render('profile_other', {
				layout: 'index',
				loggedin: request.session.loggedin,
				email: request.session.email,
				datefinal: request.session.datefinal,
				nom: request.session.nom,
				userInfo: request.session.userInfo,
				userChosenInfo: result[0],
				
			});
		}	
	});
});

app.get('/profile/:nom/annonces', (request, response) => {
	sql = "SELECT * FROM utilisateur where nom = ?"
	sql1 = "SELECT titre, description, prix, annonce.photo_url FROM utilisateur, annonce where utilisateur.id = annonce.utilisateur_id"
	con.query(sql1, function (err, result, fields) {
		if (err) throw err;
		else {
			console.log(result);
			response.render('profile1', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				nom: request.params.nom,
				info: result,
			});
		}
	});


	//con.query(sql1 , request.params.nom, function (err, result, fields) {
	// if (err) throw err;
	//console.log(result);
	//response.render('profile1', {
	//		layout: 'index',
	//		loggedin: request.session.loggedin,
	//		nom: request.params.nom,
	//		userinfo1: result
	//	});
	//});

});

app.get('/profile/:nom/reglages', (request, response) => {
	con.query("SELECT * FROM utilisateur where nom = ?", request.params.nom, function (err, result, fields) {
		if (err) throw err;
		console.log(result);
		response.render('profile', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			nom: request.params.nom,
			userinfo: result
		});
	});
});

app.post('/profile/:nom/reglages', (request, response) => {
	var sql = "UPDATE utilisateur set cin = '" + request.body.cin + "' , nom = '" + request.body.nom + "' , prenom = '" + request.body.prenom + "' , email = '" + request.body.email + "' , password = '" + request.body.password + "', telephone = '" + request.body.telephone + "' WHERE nom = ?";

	con.query(sql, [request.body.nom], function (err, result) {
		if (err) throw err;
		else {
			//if (request.body.password != request.body.c_password) {
			//response.redirect('/profile/reglages?msg=passwordsdonotmatch');
			//} 
			//else {
			var sql1 = "SELECT * FROM utilisateur WHERE cin = ?"
			con.query(sql1, [request.body.cin], function (err, result) {
				request.session.cin = result[0].cin;
				request.session.userInfo = result[0];
				console.log(result.affectedRows + " Record(s) updated.");
				console.log(result);
			})
			// SELECT * FROM UTILISATEUR WHERE CIN = ?
			// request.body.cin
			//}
		}
		response.end();
	});

});

//add an adv
app.get('/add-ads/step1', (request, response) => {
	if (request.session.loggedin == true) {
		response.render('addADS', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
		});
	} else {
		return response.redirect('/signin');
	}
});

app.post('/add-ads/step1', (request, response) => {
	var sql0 = "SELECT id FROM utilisateur";
	var sql = "INSERT INTO `annonce`(`utilisateur_id`,`titre`,`description`,`photo_url`,`prix`,`ville`,`telephone`) VALUES ('" + utilisateur_id + "'," + request.body.titre + "','" + request.body.description + "','" + request.body.photo_url + "','" + request.body.prix + "','" + request.body.ville + "','" + request.body.telephone + "')";
	if (request.body.titre && request.body.description && request.body.photo_url && request.body.prix && request.body.ville && request.body.telephone) {
		con.query(sql, function (error, results, fields) {
			if (error) throw error;
			else {
				response.redirect('/add-ads/step1/step2')
			}
		})
		response.end()
	} else {
		response.redirect('/add-ads?msg=fillfields');
		response.end();
	}
});

app.get('/add-ads/step1/step2', (request, response) => {
	
	if (request.query.categorie == 'vehicule'){
		response.render('addADS1', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
		})
	}
	if (request.query.categorie == 'immobilier'){
		response.render('addADS2', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,

		})
	}
	if (request.query.categorie == 'habillement'){
		response.render('addADS3', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,

		})
	}
	if (request.query.categorie == 'electronique'){
		response.render('addADS4', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,

		})
	}

});

app.get('/add-ads/step1/step2/payement', (request, response) => {
	response.render('payement', {
		layout: 'index',
		loggedin: request.session.loggedin,
		userInfo: request.session.userInfo
	});
});

app.post('/add-ads', (request, response) => {
	var sql = "INSERT INTO `annonce`(`titre`,`description`,`photo_url`,`type`,`prix`,`ville`,`telephone`,`categorie`) VALUES ('" + request.body.titre + "','" + request.body.description + "','" + request.body.photo_url + "','" + request.body.type + "','" + request.body.prix + "','" + request.body.ville + "','" + request.body.telephone + "','" + request.body.categorie + "')";

	if (request.body.titre && request.body.description && request.body.photo_url && request.body.type && request.body.prix && request.body.ville && request.body.telephone && request.body.categorie) {
		con.query(sql, function (error, results, fields) {
			if (error) throw error;
			else {
				response.redirect('/')
			}
		})
		response.end()
	} else {
		response.redirect('/add-ads?msg=fillfields');
		response.end();
	}
});

//contact 
app.get('/contact', (request, response) => {

	response.render('contact', {
		layout: 'index',
		userInfo: request.session.userInfo,

	});
});

//categorie
app.get('/categories/:nom', (request, response) => {

	var sql = "SELECT * FROM categorie, annonce where nom = ? and categorie.id = annonce.categorie_id"
	con.query(sql, request.params.nom, function (err, result, fields) {
		if (err) throw err;
		if (request.params.nom == 'vehicule') {
			response.render('categorie', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				nomm: request.session.nom,
				catinfo: result
			});
		}
		if (request.params.nom == 'immobilier') {
			response.render('categorie', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				nomm: request.session.nom,
				catinfo: result
			});
		}
		if (request.params.nom == 'habillement') {
			response.render('categorie', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				nomm: request.session.nom,
				catinfo: result
			});
		}
		if (request.params.nom == 'electronique') {
			response.render('categorie', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				nomm: request.session.nom,
				catinfo: result
			});
		}

	});
});

//annonce
app.get('/annonce/:id', (request, response) => {
	con.query("SELECT * FROM categorie, annonce where annonce.id = ? and categorie.id = annonce.categorie_id", request.params.id, function (err, result, fields) {
		if (err) throw err;
		console.log(result[0].id);
		response.render('annonce', {
			layout: 'index',
			annonceinfo: result,
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
		});
	});
});

//favoris
app.get('/favoris', function (request, response, next) {
	var sql = 'SELECT * FROM annonce';
	con.query(sql, function (err, data, fields) {
		if (err) throw err;
		response.render('favoris', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userData: data
		});
	});
});

app.listen(port, () => {
	console.log(`App listening at http://localhost:${port}`)
});