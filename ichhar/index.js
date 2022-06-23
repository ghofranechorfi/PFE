const express = require('express');
var mysql = require('mysql');
const handlebars = require('express-handlebars');
const app = express();
var multer = require('multer')
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
var expressValidator = require('express-validator');
var sanitizer = require('sanitize')();
var flash = require('express-flash');
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
	multipleStatements: true,
	host: "localhost",
	user: "root",
	password: "",
	database: "pfe"
});
con.connect(function (err) {
	if (err) throw err;
	console.log("Connected!");
});

var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./public/images");
		cb(null, "C:/Users/ghofr/Desktop/PFE/admin/public/images");
	},
	filename: function (req, file, cb) {
		return cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
	}
});

var upload = multer({
	storage: storage
});

app.engine('hbs', handlebars.engine({
	extname: '.hbs',
	helpers: {
		ifeq: function (a, b, options) {
			if (a === b) {
				return options.fn(this);
			}
			return options.inverse(this);
		},
		bar: function () {
			return "BAR!";
		},

		ifsup: function (a, b, options) {
			if (a > b) {
				return options.fn(this);
			}
			return options.inverse(this);
		},
		bar1: function () {
			return "BAR!";
		}
	}
}));

app.set('view engine', 'hbs');
app.set('views', './views');

//session
app.use(session({
	secret: "123456789GHCH",
	resave: true,
	saveUninitialized: true
}));

app.use(flash());
app.use(expressValidator());

// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(cors());

// cookie parser middleware
app.use(cookieParser());


app.use(express.static('public'));
app.use('./public/src/images', express.static('public/src/images'));

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
		con.query('SELECT * FROM utilisateur WHERE email = ? AND password = ? and status = 1', [email, password], function (error, results, fields) {
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {

				let sqlS = `
				SELECT DISTINCT type FROM vehicule;
				SELECT DISTINCT type, type_name FROM immobilier;
				SELECT DISTINCT type FROM habillement;
				SELECT DISTINCT type FROM electronique;
				`;

				con.query(sqlS, function (err, resultType, fields) {
					if (err) throw err;
					// Authenticate the user
					request.session.loggedin = true;
					request.session.email = email;
					request.session.nom_utilisateur = results[0].nom_utilisateur;
					request.session.userInfo = results[0];
					request.session.id = results[0].id;

					request.session.userInfo.vehicule = resultType[0];
					request.session.userInfo.immobilier = resultType[1];
					request.session.userInfo.habillement = resultType[2];
					request.session.userInfo.electronique = resultType[3];

					console.log("user's id is : " + results[0].id);
					// Redirect to home page
					response.redirect('/');
				});


			} else {
				response.redirect('/signin?msg=errorlogin');
			}
			//response.end();
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

app.post('/signup', upload.single('image'), function (request, response) {
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let datefinal = year + "-" + month + "-" + date;

	request.session.datefinal = datefinal;
	let image = request.file.filename;


	var sql = "INSERT INTO `utilisateur`(`cin`,`nom`,`prenom`, `nom_utilisateur`, `ville`,`telephone`,`email`, `password`, `photo_url`, `status`, `date_creation`) VALUES ('" + request.body.cin + "','" + request.body.nom + "','" + request.body.prenom + "','" + request.body.nom_utilisateur + "','" + request.body.ville + "','" + request.body.telephone + "','" + request.body.email + "','" + request.body.password + "', '" + image + "', 1,'" + datefinal + "')";
	var sql0 = "SELECT * FROM utilisateur where cin = ?"
	var sql1 = "SELECT * FROM utilisateur WHERE email = ?"
	var sql2 = "SELECT * FROM utilisateur WHERE nom_utilisateur = ?"
	var sql3 = "SELECT * FROM utilisateur WHERE telephone = ?"

	if (request.body.cin && request.body.nom && request.body.prenom && request.body.nom_utilisateur && request.body.ville && request.body.telephone && request.body.email && request.body.password && request.body.confirmpassword) {
		con.query(sql0, [request.body.cin], function (error, results) {
			if (results.length == 0) {
				if (error) throw error;
				if (request.body.cin.length > 8 || request.body.cin.length < 8) {
					response.redirect('/signup?msg=cinmustbeeight');
				} 
				else {
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
											if (request.body.password === request.body.confirmpassword) {
												con.query(sql, function (error, results, fields) {
													if (error) throw error;
												});
												response.redirect('/signin');
											} else {
												response.redirect('/signup?msg=passwordsdoesntmatch');
											}
										} else {
											response.redirect('/signup?msg=usernamealreadyinuse');
										}
									})
									//response.end();
								}
							})
						}
					})
				}
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
	var sql = "SELECT * FROM annonce WHERE status = 1 and titre LIKE '%" + titre + "'";
	if (titre) {
		con.query(sql, function (error, result) {
			if (error) throw error;
			if (result.length == 0) {
				response.render('notfound', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userChosenInfo: request.session.userChosenInfo,
					userinfo: result
				});
			} else {
				response.render('categorie', {
					layout: 'index',
					loggedin: request.session.loggedin,
					catinfo: result
				});
			}
		})
	} else {
		response.redirect('/')
		console.log('Entrez le nom du produit')
	}
	console.log(titre);
});

///////////teeeeeeeeeeeest
app.get('/profile/gh/:nom_utilisateur', (request, response) => {
	sql0 = "SELECT * FROM utilisateur"
	con.query(sql0, request.params.nom_utilisateur, function (err, result, fields) {
		response.render('test', {
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
		console.log(result);
	});
});


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
	sql0 = "SELECT * FROM utilisateur, annonce where nom_utilisateur = ? and utilisateur.id = annonce.utilisateur_id and annonce.status = 1 "
	sql1 = "SELECT * FROM utilisateur where nom_utilisateur = ? "
	con.query(sql0, request.params.nom_utilisateur, function (err, result, fields) {
		if (err) throw err;
		if (result.length > 0) {
			if ((request.session.userInfo !== undefined) && (request.session.userInfo.cin === result[0].cin)) {
				console.log('Its my profile');
				console.log('Current Profile CIN: ' + result[0].cin);
				console.log('Session CIN: ' + request.session.userInfo.cin);
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
				console.log('Current Profile CIN: ' + result[0].cin);
				response.render('profile_other', {
					layout: 'index',
					loggedin: request.session.loggedin,
					email: request.session.email,
					datefinal: request.session.datefinal,
					nom: request.session.nom,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					userChosenInfo1: request.session.userChosenInfo1,
					userChosenInfo: result[0],
					userChosenInfo1: result,
					session: request.session
				});
				console.log("the nbr of published ads of this user is : ", result.length);
			}
		} else if (result.length == 0) {
			con.query(sql1, request.params.nom_utilisateur, function (err, result, fields) {
				if (err) throw err;
				if ((request.session.userInfo !== undefined) && (request.session.userInfo.cin === result[0].cin) && (result.length > 0)) {
					console.log('Its my profile');
					console.log('Current Profile CIN: ' + result[0].cin);
					console.log('Session CIN: ' + request.session.userInfo.cin);
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
					console.log('Current Profile CIN: ' + result[0].cin);
					response.render('profile_other', {
						layout: 'index',
						loggedin: request.session.loggedin,
						email: request.session.email,
						datefinal: request.session.datefinal,
						nom: request.session.nom,
						userInfo: request.session.userInfo,
						userChosenInfo: request.session.userChosenInfo,
						userChosenInfo1: request.session.userChosenInfo1,
						userChosenInfo: result[0],
						userChosenInfo1: result,
						session: request.session
					});
					console.log("the nbr of published ads of this user is : ", result.length);
				}
			})
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
	} else {
		response.redirect('/profile/:nom_utilisateur/reglages?msg=passwordsfail');
	}
});

app.get('/profile/:nom_utilisateur/annonces', (request, response) => {
	sql = "SELECT * FROM utilisateur, annonce where utilisateur.id = annonce.utilisateur_id and annonce.utilisateur_id = ?"
	con.query(sql, [request.session.userInfo.id], function (err, result, fields) {
		if (err) throw err;
		if (result.length > 0) {
			console.log(result);
			response.render('profile1', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
				info: result,
			});
		} else {
			console.log('aucune annonce');
			response.render('aucune_annonce', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
				info: result,
			});
		}
	});
});

//Supprimer votre compte 
app.get('/profile/delete/:nom_utilisateur', (request, response) => {
	nom_utilisateur = request.params.nom_utilisateur;
	sql0 = "DELETE FROM utilisateur WHERE nom_utilisateur = ?"
	con.query(sql0, nom_utilisateur, function (err, result, fields) {
		if (err) {
			console.log("Error: ", err);
		} else {
			delete request.session.loggedin,
				console.log("The account has been deleted sucessfully and you'll be redirected to HOME page");
			return response.redirect('/');
		}
	});
});

//Supprimer votre annonce 
app.get('/profile/:nom_utilisateur/annonces/delete/:id', (request, response) => {
	nom = request.params.nom;
	itemId = request.params.id;

	sqlAB = "SELECT * from utilisateur, annonce, abonnement where utilisateur.id = annonce.utilisateur_id and utilisateur.id = abonnement.utilisateur_id and annonce.id = abonnement.annonce_id and annonce.id = ?"
	sql0 = "SELECT * FROM annonce WHERE id = ?"
	sql1 = "DELETE FROM annonce WHERE id = ?"
	sql3 = "DELETE FROM vehicule where annonce_id = ? "
	sql4 = "DELETE FROM immobilier where annonce_id = ? "
	sql5 = "DELETE FROM habillement where annonce_id = ? "
	sql6 = "DELETE FROM electronique where annonce_id = ? "
	sql7 = "DELETE FROM abonnement where annonce_id = ? "

	con.query(sqlAB, itemId, function (err, results, fields) {

		if (results.length > 0) {
			con.query(sql0, itemId, function (err, result, fields) {
				console.log(sql0);
				console.log("The categorie's id is : ", result[0].categorie_id);
				if (err) throw err;
				if (result[0].categorie_id == 1) {
					con.query(sql7, itemId, function (err, result1, fields) {
						con.query(sql3, itemId, function (err, result, fields) {
							console.log(sql3);
							if (err) throw err;
							con.query(sql1, itemId, function (err, result, fields) {
								console.log(sql1);
								if (err) throw err;
								console.log("DELETED SUCCESSFULLY");
								return response.redirect('/profile/:nom_utilisateur/annonces?msg=deleted');
							})
						});
					})
				} else if (result[0].categorie_id == 2) {
					con.query(sql7, itemId, function (err, result1, fields) {
						con.query(sql4, itemId, function (err, result1, fields) {
							console.log(sql4);
							if (err) throw err;
							con.query(sql1, itemId, function (err, result, fields) {
								console.log(sql1);
								if (err) throw err;
								console.log("DELETED SUCCESSFULLY");
								return response.redirect('/profile/:nom_utilisateur/annonces?msg=deleted');
							})
						});
					})
				} else if (result[0].categorie_id == 3) {
					con.query(sql7, itemId, function (err, result1, fields) {
						con.query(sql5, itemId, function (err, result1, fields) {
							console.log(sql5);
							if (err) throw err;
							con.query(sql1, itemId, function (err, result, fields) {
								console.log(sql1);
								if (err) throw err;
								console.log("DELETED SUCCESSFULLY");
								return response.redirect('/profile/:nom_utilisateur/annonces?msg=deleted');
							})
						});
					})
				} else if (result[0].categorie_id == 5) {
					con.query(sql7, itemId, function (err, result1, fields) {
						con.query(sql6, itemId, function (err, result, fields) {
							console.log(sql6);
							if (err) throw err;
							con.query(sql1, itemId, function (err, result, fields) {
								console.log(sql1);
								if (err) throw err;
								console.log("DELETED SUCCESSFULLY");
								return response.redirect('/profile/:nom_utilisateur/annonces?msg=deleted');
							})
						});
					})
				}
			})
		} else {
			con.query(sql0, itemId, function (err, result, fields) {
				console.log(sql0);
				console.log("The categorie's id is : ", result[0].categorie_id);
				if (err) throw err;
				if (result[0].categorie_id == 1) {
					con.query(sql3, itemId, function (err, result, fields) {
						console.log(sql3);
						if (err) throw err;
						con.query(sql1, itemId, function (err, result, fields) {
							console.log(sql1);
							if (err) throw err;
							console.log("DELETED SUCCESSFULLY");
							return response.redirect('/profile/:nom_utilisateur/annonces?msg=deleted');
						})
					});
				} else if (result[0].categorie_id == 2) {
					con.query(sql4, itemId, function (err, result, fields) {
						console.log(sql4);
						if (err) throw err;
						con.query(sql1, itemId, function (err, result, fields) {
							console.log(sql1);
							if (err) throw err;
							console.log("DELETED SUCCESSFULLY");
							return response.redirect('/profile/:nom_utilisateur/annonces?msg=deleted');
						})
					});
				} else if (result[0].categorie_id == 3) {
					con.query(sql5, itemId, function (err, result, fields) {
						console.log(sql5);
						if (err) throw err;
						con.query(sql1, itemId, function (err, result, fields) {
							console.log(sql1);
							if (err) throw err;
							console.log("DELETED SUCCESSFULLY");
							return response.redirect('/profile/:nom_utilisateur/annonces?msg=deleted');
						})
					});
				} else if (result[0].categorie_id == 5) {
					con.query(sql6, itemId, function (err, result, fields) {
						console.log(sql6);
						if (err) throw err;
						con.query(sql1, itemId, function (err, result, fields) {
							console.log(sql1);
							if (err) throw err;
							console.log("DELETED SUCCESSFULLY");
							return response.redirect('/profile/:nom_utilisateur/annonces?msg=deleted');
						})
					});
				}
			})
		}

	})

});

//Modifier votre annonce 
app.get('/profile/:nom_utilisateur/annonces/update/:id', (request, response) => {
	let AnnonceId = request.params.id;
	sql = "SELECT * FROM utilisateur, annonce where nom_utilisateur = ? and annonce.id = ? and utilisateur.id = annonce.utilisateur_id"
	con.query(sql, [request.session.userInfo.nom_utilisateur, AnnonceId], (error, results, fields) => {
		if (error) throw error;
		else {
			response.render('modifier_annonce', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
				updateannonce: request.session.updateannonce,
				updateannonce: results
			});
		}
	})
});

app.post('/profile/:nom_utilisateur/annonces/update/:id', upload.single('image'), (request, response) => {
	titre = request.body.titre1;
	description = request.body.description1;
	prix = request.body.prix1;
	telephone = request.body.telephone1;
	categorie = request.body.categorie1;
	annonceId = request.params.id;

	console.log(titre, description, prix, telephone, categorie, annonceId);

	sql = "SELECT * FROM utilisateur, annonce where nom_utilisateur = ? and annonce.id = ? and utilisateur.id = annonce.utilisateur_id"
	con.query(sql, [request.session.userInfo.nom_utilisateur, annonceId], (errors, results, fields)=>{
	sql0 = "UPDATE annonce SET titre = '" + titre + "', description = '" + description + "', prix = '" + prix + "', telephone = '" + telephone + "', categorie_id = '" + categorie + "' WHERE id = '" + annonceId + "' ";	
		if (errors) throw errors;
		else {
			con.query(sql0, [titre, description, prix, telephone, categorie, annonceId], (errors, results, fields) => {
				if (errors) throw errors;
				else {
					console.log("Annonce numéro " + annonceId + " est mise à jour.");
					response.redirect('/profile/:nom_utilisateur/annonces')
				}
			})
		}
	})
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

app.post('/add-ads/step1', upload.single('image'), (request, response) => {
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let datefinal = year + "-" + month + "-" + date;

	let titre = request.body.titre;
	let description = request.body.description;
	let prix = request.body.prix;
	let telephone = request.body.telephone;
	let categorie = request.body.categorie;
	let image = request.file.filename;
	console.log(titre, description, prix, telephone, categorie, image);

	sql = "INSERT INTO `annonce`(`utilisateur_id`,`status`,`titre`,`description`, `photo_url1`, `prix`, `telephone`, `categorie_id`, `date_creation`) VALUES ('" + request.session.userInfo.id + "','0','" + titre + "','" + description + "', '" + image + "', '" + prix + "', '" + telephone + "', '" + categorie + "', '" + datefinal + "')";
	if (titre && description && prix && telephone && categorie && image) {
		con.query(sql, function (error, results, next) {
			if (error) {
				console.log(error);
			} else {
				var x = results.insertId;
				console.log(x);
				request.session.categorie = categorie;
				request.session.x = x;
				console.log("rows affected successfully 0 ");

				return response.redirect('/add-ads/step1/step2');

			}
			next();
		});

	} else {
		return response.redirect('/add-ads?msg=fillfields');
	}
});

app.get('/add-ads/step1/step2', (request, response) => {
	if (request.session.loggedin == true) {

		if (request.session.categorie == '1') {
			return response.render('addADS1', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
			});
		}

		if (request.session.categorie == '2') {
			return response.render('addADS2', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
			});
		}

		if (request.session.categorie == '3') {
			return response.render('addADS3', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
			});
		}

		if (request.session.categorie == '5') {
			return response.render('addADS4', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
			});
		}
	} else {
		response.redirect('/signin');
	}
});

app.post('/add-ads/step1/step2', (request, response) => {
	let marque1 = request.body.marque1;
	let marque2 = request.body.marque2;
	let modele1 = request.body.modele1;
	let type = request.body.type;
	let etat1 = request.body.etat1;
	let etat2 = request.body.etat2;
	let type1 = request.body.type1;
	let etat3 = request.body.etat3;
	let couleur1 = request.body.couleur1;
	let couleur2 = request.body.couleur2;
	let couleur3 = request.body.couleur3;
	let type2 = request.body.type2;
	let superficie = request.body.superficie;
	let nbrch = request.body.nbrch;
	let genre = request.body.genre;
	let taille = request.body.taille;
	let type3 = request.body.type3;

	sql1 = "INSERT INTO `vehicule`(`categorie_id`, `annonce_id`, `type`, `marque`, `etat`, `modele`, `couleur`) VALUES ('" + request.session.categorie + "', '" + request.session.x + "','" + type + "', '" + marque1 + "','" + etat1 + "', '" + modele1 + "', '" + couleur1 + "')";
	sql2 = "INSERT INTO `immobilier`(`categorie_id`, `annonce_id` ,`type`, `superficie`,`chambres`) VALUES ('" + request.session.categorie + "', '" + request.session.x + "', '" + type1 + "' ,'" + superficie + "', '" + nbrch + "')";
	sql3 = "INSERT INTO `habillement`(`taille`,`genre`,`etat`, `couleur`, `categorie_id`, `annonce_id`, `type`) VALUES ('" + taille + "', '" + genre + "', '" + etat2 + "', '" + couleur2 + "', '" + request.session.categorie + "', '" + request.session.x + "', '" + type2 + "' )";
	sql4 = "INSERT INTO `electronique`(`marque`,`etat`, `couleur`, `categorie_id`, `annonce_id`, `type`) VALUES ('" + marque2 + "', '" + etat3 + "', '" + couleur3 + "', '" + request.session.categorie + "', '" + request.session.x + "' ,'" + type3 + "' )";

	if (request.session.categorie == '1') {
		if (type && (marque1 || etat1 || modele1 || couleur1)) {
			con.query(sql1, function (error, results, fields) {
				if (error) throw error;
				else {
					console.log("rows affected successfully 1 ");
				}
				return response.redirect('/add-ads/step1/step2/payement');
				//return response.end();
			});
		} else {
			response.redirect('/add-ads/step1/step2?msg=oneinput');
		}
	}

	if (request.session.categorie == '2') {
		if (type1 && (superficie || nbrch)) {
			con.query(sql2, function (error, results, fields) {
				if (error) throw error;
				else {
					console.log("rows affected successfully 1 ");
				}
				return response.redirect('/add-ads/step1/step2/payement');
			});
		} else {
			response.redirect('/add-ads/step1/step2?msg=oneinput');
		}
	}

	if (request.session.categorie == '3') {
		if (type2 && (taille || genre || etat2 || couleur2)) {
			con.query(sql3, function (error, results, fields) {
				if (error) throw error;
				else {
					console.log("rows affected successfully 1 ");
				}
				return response.redirect('/add-ads/step1/step2/payement');
				//return response.end();
			});
		} else {
			response.redirect('/add-ads/step1/step2?msg=oneinput');
		}
	}

	if (request.session.categorie == '5') {
		if (type3 && (marque2 || etat3 || couleur3)) {
			con.query(sql4, function (error, results, fields) {
				if (error) throw error;
				else {
					console.log("rows affected successfully 1 ");
				}
				return response.redirect('/add-ads/step1/step2/payement');
				//return response.end();
			});
		} else {
			response.redirect('/add-ads/step1/step2?msg=oneinput');
		}
	}
});

app.get('/add-ads/step1/step2/payement', (request, response) => {
	if (request.session.loggedin == true) {
		response.render('payement', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo
		});
	} else {
		return response.redirect('/signin');
	}
});

app.post('/add-ads/step1/step2/payement', (request, response) => {
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();

	let datefinal = year + "-" + month + "-" + date;
	let cin = request.body.cin;
	let np = request.body.np;
	let nbrcarte = request.body.nbrcarte;
	let code = request.body.code;

	console.log(cin, np, nbrcarte, code);
	if (cin && np && nbrcarte && code) {
		sql = "INSERT INTO `abonnement`(`cin`,`nomprenom`,`nbrcarte`, `code`, `utilisateur_id`, `annonce_id`, `date_creation`) VALUES ('" + cin + "', '" + np + "','" + nbrcarte + "', '" + code + "', '" + request.session.userInfo.id + "', '" + request.session.x + "' ,'" + datefinal + "')";
		con.query(sql, function (error, results, fields) {
			if (error) {
				console.log(error);
			} else {
				console.log("rows affected successfully");
			}
			response.redirect('/');
		});

	} else {
		return response.redirect('/add-ads?msg=fillfields');
	}
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

app.get('/categories/:nom/prixdesc', (request, response) => {
	var sql = "SELECT * FROM categorie, annonce where nom = ? and categorie.id = annonce.categorie_id and annonce.status = 1 order by annonce.prix desc"
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

app.get('/categories/:nom/prixasc', (request, response) => {
	var sql = "SELECT * FROM categorie, annonce where nom = ? and categorie.id = annonce.categorie_id and annonce.status = 1 order by annonce.prix asc"
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

app.get('/categories/:nom/timerecent', (request, response) => {
	var sql = "SELECT * FROM categorie, annonce where nom = ? and categorie.id = annonce.categorie_id and annonce.status = 1 order by annonce.date_creation asc"
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

//filtrer les catégories par le type des annonces choisi 
app.get('/categories/:nom/:type', (request, response) => {
	var sql = "SELECT * FROM categorie, annonce, " + request.params.nom + " where categorie.nom =  ?  and categorie.id = annonce.categorie_id and categorie.id = " + request.params.nom + ".categorie_id and " + request.params.nom + ".annonce_id = annonce.id and " + request.params.nom + ".type = ? and annonce.status = 1 "
	console.log(sql);
	
	con.query(sql, [request.params.nom, request.params.type], function (err, result, fields) {
		if (err) throw err;
		if (request.params.nom == 'vehicule') {
			if (request.params.type == 'motos') {
				response.render('categorie', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					nomm: request.session.nom,
					catinfo: result
				});
			}
			if (request.params.type == 'voitures') {
				response.render('categorie', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					nomm: request.session.nom,
					catinfo: result
				});
			}
			if (request.params.type == 'camions') {
				response.render('categorie', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					nomm: request.session.nom,
					catinfo: result
				});
			}
		}
		if (request.params.nom == 'immobilier') {
			if (request.params.type == 'villa_maisons') {
				response.render('categorie', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					nomm: request.session.nom,
					catinfo: result
				});
			}
			if (request.params.type == 'appartements') {
				response.render('categorie', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					nomm: request.session.nom,
					catinfo: result
				});
			}
		}
		if (request.params.nom == 'habillement') {
			if (request.params.type == 'vetements') {
				response.render('categorie', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					nomm: request.session.nom,
					catinfo: result
				});
			}
			if (request.params.type == 'chaussures') {
				response.render('categorie', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					nomm: request.session.nom,
					catinfo: result
				});
			}
			if (request.params.type == 'sacsaccessoires') {
				response.render('categorie', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					nomm: request.session.nom,
					catinfo: result
				});
			}
		}
		if (request.params.nom == 'electronique') {
			if (request.params.type == 'telephones') {
				response.render('categorie', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					nomm: request.session.nom,
					catinfo: result
				});
			}
			if (request.params.type == 'televisions') {
				response.render('categorie', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					nomm: request.session.nom,
					catinfo: result
				});
			}
			if (request.params.type == 'ordinateurs') {
				response.render('categorie', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					nomm: request.session.nom,
					catinfo: result
				});
			}
		}
	});
});

//ANNONCE
//afficher l'annonce aves l id demandé et afficher 3 autres annonces "randomly"
app.get('/annonce/:id', (request, response) => {
	sql = "select utilisateur.photo_url, utilisateur.nom_utilisateur, utilisateur.nom, utilisateur.prenom, utilisateur.telephone, utilisateur.ville, annonce.id, annonce.titre, annonce.description, annonce.prix, annonce.photo_url1 from utilisateur, annonce, categorie where annonce.id = ? and categorie.id = annonce.categorie_id and annonce.status = 1 and utilisateur.id = annonce.utilisateur_id"
	sql1 = "SELECT * FROM annonce where status = 1  ORDER BY RAND ( ) limit 3"
	//sql1 = "SELECT * FROM categorie, annonce where annonce.id = ? and categorie.id = annonce.categorie_id and annonce.status = 1"
	con.query(sql, request.params.id, function (err, result, fields) {
		if (err) throw err;
		con.query(sql1, function(err, result1, fields){
			if (err) throw err;
			response.render('annonce', {
				layout: 'index',
				annonceinfo: result,
				annoncerandominfo: result1,
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
			});
		})
	});
});

//Supprimer une annonce
app.get('/annonce/delete/:id', (request, response) => {
	itemId = request.params.id;
	sql0 = "DELETE FROM annonce WHERE id = ?"
	//sql = `UPDATE categorie SET status = 1 where id = ?`;
	con.query(sql0, itemId, function (err, result, fields) {
		if (err) {
			console.log(err);
		} else {
			return response.redirect('/profile/:nom_utilisateur/annonces');
		}
	});
});

// action j'aime
app.post('/like', (request, response) => {
	let annonceId = request.body.id;
	sqlInc = "UPDATE annonce SET likes = likes + 1 where id = ?";
	con.query(sqlInc, annonceId, function (err, result, fields) {
		if (err) {
			response.json({
				"status": 'error'
			});
		} else {
			let sqlCount = "SELECT likes FROM annonce WHERE id = ?";
			con.query(sqlCount, annonceId, function (err, result, fields) {
				if (err) {
					response.json({
						"status": 'error'
					});
				} else {
					response.json({
						"status": 'success',
						"newCount": result[0].likes
					});
				}
			});
		}
	});
});

// action je n'aime pas
app.post('/dislike', (request, response) => {
	let annonceId = request.body.id;
	sqlInc = "UPDATE annonce SET dislikes = dislikes + 1 where id = ?";
	con.query(sqlInc, annonceId, function (err, result, fields) {
		if (err) {
			response.json({
				"status": 'error'
			});
		} else {
			let sqlCount = "SELECT dislikes FROM annonce WHERE id = ?";
			con.query(sqlCount, annonceId, function (err, result, fields) {
				if (err) {
					response.json({
						"status": 'error'
					});
				} else {
					response.json({
						"status": 'success',
						"newCount": result[0].dislikes
					});
				}
			});
		}
	});
});

//Afficher la page de contact et le commentaire du personne connecté en ce moment
app.get('/contact', (request, response) => {

	sql0 = "SELECT * FROM contact, utilisateur where contact.utilisateur_id = utilisateur.id and utilisateur_id = ?"
	sql = "SELECT * FROM contact, utilisateur where contact.utilisateur_id = utilisateur.id"

	if ((request.session.loggedin == true) || (request.session.userInfo.id != undefined)) {
		con.query(sql, function (err, results1, fields) {
			if (err) throw err;
			else {
				con.query(sql0, request.session.userInfo.id, function (err, results, fields) {
					if (err) throw err;
					else {
						response.render('contact', {
							layout: 'index',
							loggedin: request.session.loggedin,
							userInfo: request.session.userInfo,
							userChosenInfo: request.session.userChosenInfo,
							contactinfo: results1,
							connectedcontactinfo: results,
							len: results.length
						});
					}
				});
			}
		});
	} else if ((request.session.loggedin == false) || (request.session.userInfo.id == undefined)) {
		con.query(sql, function (err, results1, fields) {
			if (err) throw err;
			response.render('contact', {
				layout: 'index',
				loggedin: request.session.loggedin,
				userInfo: request.session.userInfo,
				userChosenInfo: request.session.userChosenInfo,
				contactinfo: results1,
			});
		});
	}

});

//Ajouter un commentaire
app.post('/contact', (request, response) => {
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let datefinal = year + "-" + month + "-" + date;

	if (request.session.loggedin == undefined) {
		response.redirect('/contact?msg=signinfirst');
	} else if (request.session.loggedin == true) {
		console.log(request.session.loggedin);
		sql = "INSERT INTO `contact` (`utilisateur_id`, `status`, `message`, `date_message`) values ( '" + request.session.userInfo.id + "', '1', '" + request.body.message + "', '" + datefinal + "')";
		con.query(sql, function (err, results, fields) {
			if (err) throw err;
			response.redirect('/contact?msg=commentposted');
			response.end();
		});
	}
		
});

//text area de modification du commentaire
app.get('/contact/update/:id', (request, response) => {
	sql="select * from contact where utilisateur_id = ?" 
	con.query(sql, request.session.userInfo.id, function (err, results, fields) {
		if (err) throw err;
		response.render('contact', {
			layout: 'index',
			loggedin: request.session.loggedin,
			userInfo: request.session.userInfo,
			userChosenInfo: request.session.userChosenInfo,
			contactinfo: results1,
			connectedcontactinfo: results,
		});
	});
	response.end;
});
//modifier un commentaire
app.get('/contact/update/:id', (request, response) => {
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let datefinal = year + "-" + month + "-" + date;

	console.log("I hope it's not undefined :) : ", request.body.message);
	console.log("Current connected user's ID : ", request.session.userInfo.id);
	sql0 = "UPDATE contact set message = '" + request.body.message + "', date_message = '" + datefinal + "' where utilisateur_id = ?";

	con.query(sql0, request.session.userInfo.id, function (err, results, fields) {
		if (err) throw err;
		return response.redirect('/contact?msg=commentedited');
	});
	response.end;
});

//supprimer un commentaire
app.get('/contact/delete/:id', (request, response) => {
	CurrentUserId = request.params.id;
	sql0 = "DELETE FROM contact WHERE utilisateur_id = '" + CurrentUserId + "'";
	con.query(sql0, CurrentUserId, function (err, results, fields) {
		if (err) throw err;
	});
	response.redirect('/contact?msg=commentdeleted');
});

//afficher la liste des favoris de chaque utilisateur connecté
app.get('/favoris', function (request, response, next) {
	if (request.session.loggedin == true) {
		var sql = 'select * from utilisateur, annonce, favoris where utilisateur.nom_utilisateur = ? and utilisateur.id = favoris.utilisateur_id and annonce.id = favoris.annonce_id';
		con.query(sql, request.session.userInfo.nom_utilisateur, function (err, data, fields) {
			if (err) {
				console.log(err);
			}
			if (data.length > 0) {
				response.render('favoris', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					userData: data,
				});
			} else {
				console.log("no favorite items found");
				response.render('nofavoris', {
					layout: 'index',
					loggedin: request.session.loggedin,
					userInfo: request.session.userInfo,
					userChosenInfo: request.session.userChosenInfo,
					userData: data,
				});
			}
		});
	} else {
		response.redirect('/signin')
	}
});

//Ajouter une annonce à la liste des favoris 
app.get('/favoris/add/:id', (request, response) => {
	let date_ob = new Date();
	let date = ("0" + date_ob.getDate()).slice(-2);
	let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
	let year = date_ob.getFullYear();
	let datefinal = year + "-" + month + "-" + date;

	itemId = request.params.id;

	if (request.session.loggedin == undefined || request.session.loggedin == false) {
		response.redirect('/categories/:nom?msg=mustconnect');
	} else if (request.session.loggedin == true) {

		var sql = "SELECT utilisateur.id as u_id, favoris.annonce_id as fav FROM favoris, utilisateur where utilisateur.id = ? and utilisateur.id = favoris.utilisateur_id "
		con.query(sql, request.session.userInfo.id, function (error, results, fields) {
			if (error) throw err;
			else if (results.length == 0) {
				sql0 = "INSERT INTO `favoris`   (`utilisateur_id`, `annonce_id`, `date_creation`) VALUES ('" + request.session.userInfo.id + "', '" + itemId + "', '" + datefinal + "')";
				con.query(sql0, function (err, result, fields) {
					if (err) {
						console.log(err);
					} else {
						console.log("inserted into favorites successfully");
						return response.redirect('/favoris?msg=added');
					}
					response.end();

				});
			}

			console.log("Number of results is : ", results.length);
			console.log("selected item id : ", itemId);

			for (var i = 0; i < results.length; i++) {
				console.log("Result [", i, "] : ", JSON.stringify(results[i].fav));
				if (results.length > 0 && JSON.stringify(results[i].fav) === itemId) {
					console.log("Item already added to the favs");
					response.redirect('/');
					return;
				}
			}

			for (var i = 0; i < results.length; i++) {
				console.log("Result [", i, "] : ", JSON.stringify(results[i].fav));
				if (results.length > 0 && JSON.stringify(results[i].fav) != itemId) {
					console.log("That item isnt in the favs");
					sql0 = "INSERT INTO `favoris`   (`utilisateur_id`, `annonce_id`, `date_creation`) VALUES ('" + request.session.userInfo.id + "', '" + itemId + "', '" + datefinal + "')";
					con.query(sql0, function (err, result, fields) {
						console.log("inserted into favorites successfully");
						return response.redirect('/favoris?=added');
					});
					break;
				}
			}
		});
	}
});

//Supprimer une annonce de la liste des favoris
app.get('/favoris/delete/:id', (request, response) => {
	itemId = request.params.id;
	sql0 = "DELETE FROM favoris WHERE id = ?"
	sql = `UPDATE categorie SET status = 1 where id = ?`;
	con.query(sql0, itemId, function (err, result, fields) {
		if (err) {
			console.log(err);
		} else {
			return response.redirect('/favoris');
		}
	});
});

app.listen(port, () => {
	console.log(`App listening at http://localhost:${port}`)
});