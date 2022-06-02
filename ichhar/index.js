const express = require('express');
var mysql = require('mysql');
const handlebars = require('express-handlebars');
const app = express();
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
var session = require('express-session');
const cors = require('cors');

const port = 3000
const path = require('path');


const hbs = handlebars.create({
	layoutsDir: __dirname + '/views/layouts/',
	extname: 'hbs'
});


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
	secret: "123456789GHCH",
	resave: true,
	saveUninitialized: true
}));

// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

// cookie parser middleware
app.use(cookieParser());

app.use(express.static('public'));


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
				userChosenInfo: result,
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
	sql = "SELECT * FROM utilisateur, annonce where utilisateur.id = annonce.utilisateur_id and annonce.utilisateur_id = ? and annonce.status = 1"
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
app.get('/add-ads', (request, response) => {
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

	let titre = request.query.titre;
	let description = request.query.description;
	let prix = request.query.prix; 
	let telephone = request.query.telephone; 
	let categorie = request.query.categorie;
	let photo1 = request.query.photo1;
	console.log(titre, description, prix, telephone, categorie, photo1);

	sql = "INSERT INTO `annonce`(`utilisateur_id`,`status`,`titre`,`description`, `photo_url1`, `prix`, `telephone`, `categorie_id`, `date_creation`) VALUES ('"+ request.session.userInfo.id +"','0','" + titre + "','" + description + "', '" + photo1 + "', '" + prix + "', '" + telephone + "', '" + categorie+ "', '" + datefinal + "')";
	if (titre && description && prix && telephone && categorie && photo1) {
		con.query(sql, function (error, results, fields) {
			if (error) throw error;
			console.log("rows affected successfully");
			response.redirect('/add-ads/step1/step2');
		});	
		return response.end();	
	} 
	else {
		return response.redirect('/add-ads?msg=fillfields');
	}	
});

app.get('/add-ads/step1/step2', (request, response) => {

	if (request.query.categorie == '1'){
		return response.render('addADS1', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo,
		});
	}

	if (request.query.categorie == '2'){
		return response.render('addADS2', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo,
		});
	}

	if (request.query.categorie == '3'){
		return response.render('addADS3', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo,
		});
	}

	if (request.query.categorie == '5'){
		return response.render('addADS4', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo,
		});
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

//categories
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

//Afficher la page de contact 
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

//Ajouter un commentaire
app.post('/contact', (request, response) => {
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let datefinal = year + "-" + month + "-" + date;

	sql = "INSERT INTO `contact` (`utilisateur_id`, `status`, `message`, `date_creation`) values ( '"+ request.session.userInfo.id +"', '1', '" + request.body.message + "', '" + datefinal + "')";
	if (request.session.loggedin == true) {
		con.query(sql, function (err, results, fields) {
			if (err) throw err;
		});
		response.redirect('/contact');
		response.end();
	}
	else {
		response.redirect('/signin');
	}
});

//afficher la liste des favoris de chaque utilisateur connecté
app.get('/favoris', function (request, response, next) {
	var sql = 'select * from utilisateur, annonce, favoris where utilisateur.nom_utilisateur = ? and utilisateur.id = favoris.utilisateur_id and annonce.id = favoris.annonce_id';
	con.query(sql, request.session.userInfo.nom_utilisateur ,function (err, data, fields) {
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

//Ajouter une annonce à la liste des favoris 

//Supprimer une annonce de la liste des favoris
app.get('/favoris/delete/:id', (request, response) => {
    itemId = request.params.id;
	sql0 = "DELETE FROM favoris WHERE id = ?"
    sql = `UPDATE categorie SET status = 1 where id = ?`;
    con.query(sql0 , itemId,function (err, result, fields) {
        if (err) throw err;
		response.render('favoris', {
			layout: 'index',
            loggedin: request.session.loggedin,
			catinfo: result
		});
    });
	response.end();
    response.redirect('/favoris'); 
});


app.listen(port, () => {
	console.log(`App listening at http://localhost:${port}`)
});