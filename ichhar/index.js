const express = require('express');
var mysql = require('mysql');
const handlebars = require('express-handlebars');
const app = express();
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
var session = require('express-session');
const port = 3000
const path = require('path');
const { userInfo } = require('os');


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

//session
app.use(session({
	secret: "123456789",
	resave: true,
	saveUninitialized: true
}));

//app.use(express.bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

// cookie parser middleware
app.use(cookieParser());


//page d'accueil
app.get('/', function (request, response) {
	response.render('main', {
		layout: 'index',
		loggedin: request.session.loggedin,
		userInfo: request.session.userInfo,
		userChosenInfo: request.session.userChosenInfo
	});
	
});

//sign in
app.get('/signin', (request, response) => {
	response.render('signin', {
		layout: 'index',
		userInfo: request.session.userInfo,
		userChosenInfo: request.session.userChosenInfo
	})
});

app.post('/signin', function (request, response) {
	// Capture the input fields
	let email = request.body.email;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (email && password) {
		con.query('SELECT * FROM utilisateur WHERE email = ? AND password = ?', [email, password], function (error, results, fields) {
			if (error) throw error;
			// If the account exists
			if (results.length > 0 ) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.email = email;
				request.session.nom_utilisateur = results[0].nom_utilisateur;
				request.session.userInfo = results[0];
				request.session.id = results[0].id;
				console.log("user's id is : " + results[0].id);
				// Redirect to home page
				response.redirect('/');
			} 
			else {			
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
		userInfo: request.session.userInfo,
		userChosenInfo: request.session.userChosenInfo
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

//Search
app.get('/search', (request, response) => {
    var titre = request.query.search;
    var sql = "SELECT * FROM annonce WHERE status = 1 and titre LIKE '%"+titre+"'";
    if (titre) {
	con.query(sql, function(error, result){
        if (error) throw error;
		if (result.length == 0) {
            response.render('notfound', {
                layout: 'index',
                loggedin: request.session.loggedin,
				userChosenInfo: request.session.userChosenInfo,
                userinfo: result
            });
        }
		else{
			response.render('categorie', {
				layout: 'index',
				loggedin: request.session.loggedin,
				catinfo: result
			});
		}
    })
	} else {
		response.redirect('/')
		console.log ('Entrez le nom du produit')
	}
    console.log(titre);
});

///////////teeeeeeeeeeeest
app.get('/test/id', (request, response) => {
	var sql0 = "SELECT * FROM utilisateur"
	con.query(sql0, function (error, results, fields) {
		console.log(results[2].nom);
		if (request.session.userInfo.id === results[0].id) {
			response.render('contact', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
			});
		}
	})
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
app.get('/profile/:nom_utilisateur', (request, response) => {
	sql0="SELECT * FROM utilisateur, annonce where nom_utilisateur = ? and utilisateur.id = annonce.utilisateur_id and annonce.status = 1 "
	//sql = "SELECT * FROM utilisateur, annonce where nom_utilisateur = ?"
	con.query(sql0, request.params.nom_utilisateur, function (err, result, fields) {
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
				session: request.session,
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
				userChosenInfo: request.session.userChosenInfo,
				userChosenInfo: result[0],
				session: request.session
			});

			console.log("the nbr of results is " , result.length );
		}	
	});
});

app.get('/profile/:nom_utilisateur/reglages', (request, response) => {
	response.render('profile_me', {
		layout: 'index',
		loggedin: request.session.loggedin,
		email: request.session.email,
		datefinal: request.session.datefinal,
		nom: request.session.nom,
		userInfo: request.session.userInfo,
		userChosenInfo: request.session.userChosenInfo,
		session: request.session
	});
});

app.post('/profile/:nom_utilisateur/reglages', (request, response) => {
	cin = request.body.cin;
	nom = request.body.nom;
	prenom = request.body.prenom;
	nom_utilisateur = request.body.nom_utilisateur;
	telephone = request.body.telephone;
	email = request.body.email;
	password = request.body.password;
	c_password = request.body.c_password;

	let sql0 = `UPDATE utilisateur SET nom = ?, prenom = ?, cin = ?, nom_utilisateur = ?, telephone = ?, email = ?, password = ? WHERE cin LIKE ?`;
	if (password == c_password) {
		con.query(sql0, [nom, prenom, cin, nom_utilisateur, telephone, email, password, cin], function (err, result, next) {
			if (err) throw err;
		});
		response.redirect('/profile/:nom_utilisateur/reglages?msg=done');
	} 
	else {
		response.redirect('/profile/:nom_utilisateur/reglages?msg=passwordsfail');
	}
});

app.get('/profile/:nom_utilisateur/annonces', (request, response) => {
	sql = "SELECT * FROM utilisateur, annonce where utilisateur.id = annonce.utilisateur_id and annonce.utilisateur_id = ?"
	con.query(sql, [request.session.userInfo.id], function (err, result, fields) {
		if (err) throw err;
		if (result.length > 0 ) {
		console.log(result);
		response.render('profile1', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo,
			info: result,
		});	
		} else {
			console.log('aucune annonce')
		}
	});
});


//Ajouter une annonce
app.get('/add-ads/step1', (request, response) => {
	if (request.session.loggedin == true) {
		response.render('addADS', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo,
		});
	} else {
		return response.redirect('/signin');
	}
});

app.get('/add-ads/step1', (request, response) => {
	
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let datefinal = year + "-" + month + "-" + date;

	sql = "INSERT INTO `annonce`(`utilisateur_id`,`status`,`titre`,`description`,`photo_url`,`prix`,`telephone`, `categorie_id`, `date_creation`) VALUES ('"+ request.session.userInfo.id +"','0','" + request.body.titre + "','" + request.body.description + "','" + request.body.photo_url + "','" + request.body.prix + "','" + request.body.telephone + "', '3', '" + datefinal + "')";
	if (request.body.titre && request.body.description && request.body.photo_url && request.body.prix && request.body.telephone) {
		con.query(sql, function (error, results, fields) {
			if (error) throw error;
		})
		response.end();
		response.redirect('/add-ads/step1/step2')
	} 
	else {
		response.redirect('/add-ads/step1?msg=fillfields');
	}	
});

app.get('/add-ads/step1/step2', (request, response) => {
	
	if (request.query.categorie == 'vehicule'){
		response.render('addADS1', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo,
		})
	}
	if (request.query.categorie == 'immobilier'){
		response.render('addADS2', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo,

		})
	}
	if (request.query.categorie == 'habillement'){
		response.render('addADS3', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo,

		})
	}
	if (request.query.categorie == 'electronique'){
		response.render('addADS4', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo,

		})
	}

});

app.get('/add-ads/step1/step2/payement', (request, response) => {
	response.render('payement', {
		layout: 'index',
		loggedin: request.session.loggedin,
		userInfo: request.session.userInfo,
		userChosenInfo: request.session.userChosenInfo
	});
});

//categorie
app.get('/categories/:nom', (request, response) => {

	var sql = "SELECT * FROM categorie, annonce where nom = ? and categorie.id = annonce.categorie_id and annonce.status = 1"
	con.query(sql, request.params.nom, function (err, result, fields) {
		if (err) throw err;
		if (request.params.nom == 'vehicule') {
			response.render('categorie', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
				nomm: request.session.nom,
				catinfo: result
			});
		}
		if (request.params.nom == 'immobilier') {
			response.render('categorie', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
				nomm: request.session.nom,
				catinfo: result
			});
		}
		if (request.params.nom == 'habillement') {
			response.render('categorie', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
				nomm: request.session.nom,
				catinfo: result
			});
		}
		if (request.params.nom == 'electronique') {
			response.render('categorie', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
				nomm: request.session.nom,
				catinfo: result
			});
		}
	});
});

//annonce
app.get('/annonce/:id', (request, response) => {
	sql ="select utilisateur.photo_url, utilisateur.nom_utilisateur, utilisateur.nom, utilisateur.prenom, utilisateur.telephone, utilisateur.ville, annonce.titre, annonce.description, annonce.prix, annonce.photo_url1 from utilisateur, annonce, categorie where annonce.id = ? and categorie.id = annonce.categorie_id and annonce.status = 1 and utilisateur.id = annonce.utilisateur_id"
	//sql1 = "SELECT * FROM categorie, annonce where annonce.id = ? and categorie.id = annonce.categorie_id and annonce.status = 1"
	con.query(sql, request.params.id, function (err, result, fields) {
		if (err) throw err;
		response.render('annonce', {
			layout: 'index',
			annonceinfo: result,
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo,
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
			userChosenInfo: request.session.userChosenInfo,
			userData: data
		});
	});
});

//contact 
app.get('/contact', (request, response) => {
	sql = "SELECT * FROM contact, utilisateur where contact.utilisateur_id = utilisateur.id"
	con.query(sql, function (err, results, fields) {
		if (err) throw err;
		else {
			response.render('contact', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
				contactinfo: results
			});
		}
	})
});

app.post('/contact/add', (request, response) => {
	sql = "INSERT INTO `contact` (`utilisateur_id`, `status`, `message`) values ( '"+ request.session.userInfo.id +"', '1', '" + request.body.message + "')";
	if (request.session.loggedin == true) {
		con.query(sql, function (err, results, fields) {
			if (err) throw err;
			else{
				response.redirect('/contact');
			}
		})
		response.end();
	}
	else {
		response.redirect('/signin');
	}
});

app.listen(port, () => {
	console.log(`App listening at http://localhost:${port}`)
});