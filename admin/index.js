const express = require('express');
var mysql = require('mysql');
const handlebars = require('express-handlebars');
const app = express();
var bodyParser = require('body-parser');
const cookieParser = require("cookie-parser");
var session = require('express-session');
const port = 3001;
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
        bar: function () {
            return "BAR!";
        }
    }
}));

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

//Home page
app.get('/ichhar-admin/home', (request, response) => {
    sql = "SELECT COUNT(*) as stat FROM utilisateur"
    sql1 = "SELECT COUNT(*) as stat FROM categorie"
    sql2 = "SELECT COUNT(*)-14 as stat FROM annonce where status = 1"
    sql3 = "SELECT COUNT(*) as stat FROM annonce where status = 0"
    sql4 = "SELECT COUNT(*) as stat from abonnement"
    sql5 = "SELECT COUNT(distinct utilisateur_id) as stat FROM abonnement"
    sql6 = "SELECT SUM(montant) as stat from abonnement"
    sql7 = "SELECT SUM(montant)-20 as stat from abonnement"

    con.query(sql, (err, result) => {
        if (err) throw err;
        console.log(result);
        con.query(sql1, (err, result1) => {
            if (err) throw err;
            console.log(result1);
            con.query(sql2, (err, result2) => {
                if (err) throw err;
                console.log(result2);
                con.query(sql3, (err, result3) => {
                    if (err) throw err;
                    console.log(result3);
                    con.query(sql4, (err, result4) => {
                        if (err) throw err;
                        console.log(result4);
                        con.query(sql5, (err, result5) => {
                            if (err) throw err;
                            console.log(result5);
                            con.query(sql6, (err, result6) => {
                                if (err) throw err;
                                console.log(result6);
                                con.query(sql7, (err, result7) => {
                                    if (err) throw err;
                                    console.log(result7);
                                    response.render('main', {
                                        layout: 'index',
                                        loggedin: request.session.loggedin,
                                        abonne: request.session.abonne,
                                        nbr_utilisateurs: result[0].stat,
                                        nbr_annonces: result2[0].stat,
                                        nbr_categories: result1[0].stat,
                                        nbr_annoncesattente: result3[0].stat,
                                        nbr_abonnements: result4[0].stat,
                                        nbr_abonnes: result5[0].stat,
                                        totale: result6[0].stat,
                                        profit: result7[0].stat,
                                        session: request.session
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

//Display sign in page
app.get('/ichhar-admin/signin', (request, response) => {
    response.render('signin', {
        layout: 'index',
        loggedin: request.session.loggedin,
        abonne: request.session.abonne,
    });
});

//Sign in procedure
app.post('/ichhar-admin/signin', function (request, response) {
    let email = request.body.email;
    let password = request.body.password;
    if (email && password) {
        con.query('SELECT * FROM utilisateur WHERE email = ? AND password = ?', [email, password], function (error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.email = email;
                response.redirect('/ichhar-admin/home');
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

//Logout
app.get('/ichhar_admin/logout', function (request, response) {
    if (request.session.loggedin) {
        delete request.session.loggedin;
        response.redirect('/ichhar-admin/home');
    } else {
        response.json({
            result: 'ERROR',
            message: 'User is not logged in.'
        });
    }
});

//CLIENTS
//Display the user's list
app.get('/ichhar-admin/clients', (request, response) => {
    let selected_id = request.query.id || 0
    sql0 = "SELECT * FROM utilisateur WHERE status = 1";
    sql1 = "SELECT DISTINCT(abonnement.cin) FROM utilisateur, abonnement where utilisateur.id = abonnement.utilisateur_id"
    con.query(sql0, function (err, result, fields) {
        if (err) throw err;
        console.log(selected_id);
        con.query(sql1, function (err, results, fields) {
            if (err) throw err;
            if (results.cin === result.cin) {
                request.session.abonne = true;
                response.render('clients', {
                    layout: 'index',
                    loggedin: request.session.loggedin,
                    userinfo: result,
                    selected_id: parseInt(selected_id),
                });
            }
        })
    });
});

//test
app.get('/ichhar-admin/test', (request, response) => {
    let selected_id = request.query.id || 0
    sql0 = "SELECT * FROM utilisateur WHERE status = 1";
    sql1 = "SELECT DISTINCT(abonnement.cin) as ciin FROM utilisateur, abonnement where utilisateur.id = abonnement.utilisateur_id"
    con.query(sql0, function (err, result, fields) {
        if (err) throw err;
        console.log(selected_id);
        con.query(sql1, function (err, results, fields) {
            if (err) throw err;
            for (var i = 0; i < results.length; i++) {
                console.log("hey ", results[i].ciin);
                console.log("reees", result[i].cin);
                if (results[i] == 09723985) {
                    console.log(results, result.cin);
                    request.session.abonne = true;
                    response.render('clients', {
                        layout: 'index',
                        loggedin: request.session.loggedin,
                        userinfo: result,
                        selected_id: parseInt(selected_id),
                    });
                }
            }
        })
    });
});


//Delete a user
app.get('/ichhar-admin/clients/delete/:id', (request, response) => {
    userId = request.params.id;
    sql = `UPDATE utilisateur SET status = 2 where id = ?`;
    con.query(sql, userId, function (err, result, fields) {
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
app.get('/search', (request, response) => {
    var nom = request.query.search;
    var sql = "SELECT * FROM utilisateur where nom LIKE '%" + nom + "' ";
    con.query(sql, function (error, result) {
        if (error) throw error;
        response.render('clients', {
            layout: 'index',
            loggedin: request.session.loggedin,
            userinfo: result
        });
    })
    console.log(nom);
});

//Afficher la liste des clients à restaurer
app.get('/ichhar-admin/clients-restaurer', (request, response) => {
    sql0 = "SELECT * FROM utilisateur WHERE status = 2;"
    con.query(sql0, function (err, result, fields) {
        if (err) throw err;
        response.render('restaurer-inscrit', {
            layout: 'index',
            loggedin: request.session.loggedin,
            userinfo1: result
        });
    });
});

//Restaurer un utilisateur
app.get('/ichhar-admin/clients/restaurer/:id', (request, response) => {
    userId = request.params.id;
    sql = `UPDATE utilisateur SET status = 1 where id = ?`;
    con.query(sql, userId, function (err, result, fields) {
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

//Abonnement 
app.get('/ichhar-admin/abonnements', (request, response) => {
    let selected_id = request.query.id || 0

    sql = "SELECT * FROM abonnement";

    console.log(sql);
    con.query(sql, function (err, result, fields) {
            if (err) throw err;
            request.session.abonne = true;
            response.render('abonnements', {
                layout: 'index',
                loggedin: request.session.loggedin,
                abonnementInfo: result,
                selected_id: parseInt(selected_id),
            });
        })
});

//CATEGORIES
//Display the categories list
app.get('/ichhar-admin/categories', (request, response) => {
    con.query("SELECT * FROM categorie where status = 0", function (err, result, fields) {
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

//Le formulaire de mise à jour d'une catégorie
app.get('/ichhar-admin/categories/update/:id', (request, response) => {
    userId = request.params.id;
    sql0 = "SELECT * FROM categorie WHERE status = 0 and id = ?;"
    con.query(sql0, userId, function (err, result, fields) {
        if (err) throw err;
        response.render('categorie-update', {
            layout: 'index',
            loggedin: request.session.loggedin,
            catinfo: result
        });
    });
});
//Les procédures de mise à jour d'une catégorie 
app.post('/ichhar-admin/categories/update/:id', (request, response) => {
    userId = request.params.id;
    sql = "UPDATE categorie SET nom = '" + request.body.noom + "', description = '" + request.body.desc + "', photo_url = '" + request.body.photo_url + "' where id = ?";
    con.query(sql, userId, function (err, results) {
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

//Supprimer une catégorie
app.get('/ichhar-admin/categories/delete/:id', (request, response) => {
    userId = request.params.id;
    sql = `UPDATE categorie SET status = 1 where id = ?`;
    con.query(sql, userId, function (err, result, fields) {
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

//Afficher la liste des catégories à restaurer
app.get('/ichhar-admin/categories-restaurer', (request, response) => {
    sql0 = "SELECT * FROM categorie WHERE status = 1;"
    con.query(sql0, function (err, result, fields) {
        if (err) throw err;
        response.render('restaurer-categorie', {
            layout: 'index',
            loggedin: request.session.loggedin,
            catinfo2: result
        });
    });
});

//Restaurer une catégorie
app.get('/ichhar-admin/categories/restaurer/:id', (request, response) => {
    userId = request.params.id;
    sql = `UPDATE categorie SET status = 0 where id = ?`;
    con.query(sql, userId, function (err, result, fields) {
        if (err) throw err;
        response.render('clients', {
            layout: 'index',
            loggedin: request.session.loggedin,
            catinfo2: result
        });
        return response.end();
    });
    response.redirect('/ichhar-admin/categories');
});

//ANNONCE
//Afficher la liste des annonces
app.get('/ichhar-admin/annonces', (request, response) => {
    con.query("SELECT * FROM annonce", function (err, result, fields) {
        if (err) throw err;
        response.render('annonces', {
            layout: 'index',
            loggedin: request.session.loggedin,
            annonceinfo: result
        });
    });
});

//ANNONCE EN ATTENTE
//Afficher les annonces dans la liste d'attente
app.get('/ichhar-admin/annoncesattentes', (request, response) => {
    sql0 = "SELECT * FROM annonce WHERE status = 0"
    sql = "SELECT utilisateur.*, utilisateur.id as u_id, annonce.* from utilisateur, annonce WHERE utilisateur.id = annonce.utilisateur_id and annonce.status = 0"
    con.query(sql, request.query.id, function (err, result, fields) {
        if (err) throw err;
        response.render('annonceattente', {
            layout: 'index',
            loggedin: request.session.loggedin,
            annonceattenteinfo: result,
        });
    });
});

//afficher une seule annonce annonce en attente
app.get('/ichhar-admin/annoncesattentes/annonce/:id', (request, response) => {
	sql = `select utilisateur.*, annonce.titre, annonce.description, annonce.prix, annonce.photo_url1 
    from utilisateur, annonce, categorie where annonce.id = ? and categorie.id = annonce.categorie_id 
    and annonce.status = 0 and utilisateur.id = annonce.utilisateur_id`;

    sql1 = `select * from utilisateur, annonce, abonnement where utilisateur.id = annonce.utilisateur_id 
    and utilisateur.id = abonnement.utilisateur_id and annonce.id = abonnement.annonce_id and annonce.id = ?`

	con.query(sql, request.params.id, function (err, result, fields) {
		if (err) throw err;
		con.query(sql1, request.params.id, function (error, results, fields){
            if (error) throw err;
            if (results.length > 0 ) {
                response.render('annonce', {
                    layout: 'index',
                    loggedin: request.session.loggedin,
                    annonceattenteinfo: request.session.annonceattenteinfo,
                    abonnementinfo: request.session.abonnementinfo,
                    annonceattenteinfo: result[0],
                    abonnementinfo: results[0],
                    session: request.session
                });
            }
            console.log(sql);
            console.log('the result is : ',result);
            console.log('-----------------------------------');
            console.log(sql1);
            console.log('the results are : ',result);
        })
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
    response.redirect('/ichhar-admin/annoncesattentes?msg=approved');
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
    });
    response.redirect('/ichhar-admin/annoncesattentes?msg=refused');
});

app.get('/ichhar-admin/profil', (req, res) => {
    res.render('profil', {
        layout: 'index',
        loggedin: request.session.loggedin,
    });
});

app.listen(port, () => console.log(`App listening to port ${port}`));