const express = require('express');
var mysql = require('mysql');
const handlebars = require('express-handlebars');
const app = express();
var multer = require('multer');
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

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/images");
        cb(null, "C:/Users/ghofr/Desktop/PFE/ichhar/public/images");

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

//Page d'accueil
app.get('/ichhar-admin/home', (request, response) => {
    console.log(request.session.loggedin);
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
        sql = "SELECT COUNT(*) as stat FROM utilisateur"
        sql1 = "SELECT COUNT(*) as stat FROM categorie"
        sql2 = "SELECT COUNT(*) as stat FROM annonce where status = 1"
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
    }
});

//Page d'authentification
app.get('/ichhar-admin/signin', (request, response) => {
    response.render('signin', {
        layout: 'index',
        loggedin: request.session.loggedin,
        abonne: request.session.abonne,
    });
});

//L'envoi des données d'authentification
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

//Se déconnecter
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


//Gestion des clients

//Afficher la liste des utilisateurs
app.get('/ichhar-admin/clients', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
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
    }
});

//Archivé ou désactiver un utilisateur
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

//Afficher la liste des utilisateurs à restaurer
app.get('/ichhar-admin/clients-restaurer', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
        sql0 = "SELECT * FROM utilisateur WHERE status = 2;"
        con.query(sql0, function (err, result, fields) {
            if (err) throw err;
            response.render('restaurer-inscrit', {
                layout: 'index',
                loggedin: request.session.loggedin,
                userinfo1: result
            });
        });
    }
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

//Rechercher un utilisateur par son nom
app.get('/search', (request, response) => {
    var nom = request.query.search;
    var sql = "SELECT * FROM utilisateur where nom LIKE '%" + nom + "' or prenom LIKE '%" + nom + "' ";
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

//Consulter les abonnements
app.get('/ichhar-admin/abonnements', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
        sql = "SELECT * FROM abonnement";
        console.log(sql);
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            request.session.abonne = true;
            response.render('abonnements', {
                layout: 'index',
                loggedin: request.session.loggedin,
                abonnementInfo: result,
            });
        })
    }
});


//Gestion des catégories

//Afficher la liste des catégories
app.get('/ichhar-admin/categories', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
        con.query("SELECT * FROM categorie where status = 0", function (err, result, fields) {
            if (err) throw err;
            response.render('categories', {
                layout: 'index',
                loggedin: request.session.loggedin,
                catinfo1: result
            });
        });
    }
});

//Formulaire d'ajout d'une catégorie
app.get('/ichhar-admin/ajout-categorie', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
        response.render('ajout-categorie', {
            layout: 'index',
            loggedin: request.session.loggedin,
        });
    }
});

//L'envoie du formulaire d'ajout
app.post('/ichhar-admin/ajout-categorie/add', upload.single('image'), (request, response) => {
    nom = request.body.nom;
    desc = request.body.desc;
    image = request.file.filename;
    n1 = request.body.n1;
    t1 = request.body.t1;
    n2 = request.body.n2;
    t2 = request.body.t2;
    n3 = request.body.n3;
    t3 = request.body.t3;
    n4 = request.body.n4;
    t4 = request.body.t4;
    n5 = request.body.n5;
    t5 = request.body.t5;

    sql = "INSERT INTO categorie (`nom`, `status`, `description`, `photo_url`) VALUES('" + nom + "', 0, '" + desc + "', '" + image + "')"

    sql0 = " CREATE TABLE " + nom + " ( ID int NOT NULL, " + n1 + " " + t1 + " NOT NULL, " + n2 + " " + t2 + ", " + n3 + " " + t3 + ", " + n4 + " " + t4 + ", " + n5 + " " + t5 + ", type text, categorie_id int, annonce_id int, PRIMARY KEY (ID), FOREIGN KEY (categorie_id) REFERENCES " + nom + "(id), FOREIGN KEY (annonce_id) REFERENCES annonce(id) )";

    con.query(sql, function (err, results, fields) {
        if (err) {
            console.log("seems like an error occured :) ");
            console.log(err);
        } else {
            console.log("Rows inserted successfully in categorie table");
            con.query(sql0, function (err, result, fields) {
                if (err) {
                    console.log('Query of creating a new Table "CATEGORY" : ', sql0);
                    console.log("i'll cut my hand if this code works from 1st try lmao");
                    console.log(err);
                } else {
                    console.log("A new table is created");
                }
            })
        }
        response.redirect('/ichhar-admin/categories?msg=addedsuccessfully');
    });

});

//Le formulaire de mise à jour d'une catégorie
app.get('/ichhar-admin/categories/update/:id', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
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
    }
});

//L'envoie des mises à jour d'une catégorie 
app.post('/ichhar-admin/categories/update/:id', upload.single('image'), (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
        nom = request.body.noom;
        desc = request.body.desc;
        image = request.file.filename;
        catId = request.params.id;

        sql = "UPDATE categorie SET nom = '" + nom + "', status = 0 , description = '" + desc + "', photo_url = '" + image + "' where id = '" + catId + "' ";
        console.log(sql);
        console.log("The selected categorie's ID is : ", +catId);

        con.query(sql, function (err, results, fields) {
            if (err) throw err;
            response.redirect('/ichhar-admin/categories?msg=updatedsuccessfully');
        });
    }
});

//Supprimer une catégorie
app.get('/ichhar-admin/categories/delete/:id', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
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
        response.redirect('/ichhar-admin/categories?msg=deleted');
    }

});

//Afficher la liste des catégories à restaurer
app.get('/ichhar-admin/categories-restaurer', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
        sql0 = "SELECT * FROM categorie WHERE status = 1;"
        con.query(sql0, function (err, result, fields) {
            if (err) throw err;
            response.render('restaurer-categorie', {
                layout: 'index',
                loggedin: request.session.loggedin,
                catinfo2: result
            });
        });
    }
});

//Restaurer une catégorie
app.get('/ichhar-admin/categories/restaurer/:id', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
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
    }
});


//Gestion des annonces

//Afficher la liste des annonces
app.get('/ichhar-admin/annonces', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
        con.query("SELECT * FROM annonce", function (err, result, fields) {
            if (err) throw err;
            response.render('annonces', {
                layout: 'index',
                loggedin: request.session.loggedin,
                annonceinfo: result
            });
        });
    }
});

//Supprimer une annonce de la liste
app.get('/ichhar-admin/annonces/delete/:id', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
        annonceId = request.params.id;
        nom = request.query.id;
        sql = "SELECT * FROM annonce where id = ?"
        sql0 = "DELETE FROM annonce WHERE id = ?"
        sql1 = "select * from annonce, vehicule, categorie where annonce.id = vehicule.annonce_id and annonce.categorie_id = categorie.id and annonce.id = ?"
        sql2 = "select * from annonce, immobilier, categorie where annonce.id = immobilier.annonce_id and annonce.categorie_id = categorie.id and annonce.id = ?"
        sql3 = "select * from annonce, habillement, categorie where annonce.id = habillement.annonce_id and annonce.categorie_id = categorie.id and annonce.id = ?"
        sql5 = "select * from annonce, electronique, categorie where annonce.id = electronique.annonce_id and annonce.categorie_id = categorie.id and annonce.id = ?"
        sql4 = "DELETE FROM vehicule where annonce_id = ? "
        sql6 = "DELETE FROM immobilier where annonce_id = ? "
        sql7 = "DELETE FROM habillement where annonce_id = ? "
        sql8 = "DELETE FROM electronique where annonce_id = ? "

        con.query(sql, annonceId, function (err, result, fields) {
            console.log("The categorie's id is : ", result[0].categorie_id);
            if (err) throw err;
            if (result[0].categorie_id == 1) {
                con.query(sql4, annonceId, function (err, result, fields) {
                    if (err) throw err;
                    con.query(sql0, annonceId, function (err, result, fields) {
                        if (err) throw err;
                        return response.redirect('/ichhar-admin/annonces?msg=deleted');
                    })
                });
            } else if (result[0].categorie_id == 2) {
                con.query(sql6, annonceId, function (err, result, fields) {
                    if (err) throw err;
                    con.query(sql0, annonceId, function (err, result, fields) {
                        if (err) throw err;
                        return response.redirect('/ichhar-admin/annonces?msg=deleted');
                    })
                });
            } else if (result[0].categorie_id == 3) {
                con.query(sql7, annonceId, function (err, result, fields) {
                    if (err) throw err;
                    con.query(sql0, annonceId, function (err, result, fields) {
                        if (err) throw err;
                        return response.redirect('/ichhar-admin/annonces?msg=deleted');
                    })
                });
            } else if (result[0].categorie_id == 5) {
                con.query(sql8, annonceId, function (err, result, fields) {
                    if (err) throw err;
                    con.query(sql0, annonceId, function (err, result, fields) {
                        if (err) throw err;
                        return response.redirect('/ichhar-admin/annonces?msg=deleted');
                    })
                });
            }
        })
    }
});

//Afficher les annonces dans la liste d'attente
app.get('/ichhar-admin/annoncesattentes', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
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
    }
});

//afficher une seule annonce annonce en attente
app.get('/ichhar-admin/annoncesattentes/annonce/:id', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
        sql = `select utilisateur.*, annonce.titre, annonce.description, annonce.prix, annonce.photo_url1 
    from utilisateur, annonce, categorie where annonce.id = ? and categorie.id = annonce.categorie_id 
    and annonce.status = 0 and utilisateur.id = annonce.utilisateur_id`;

        sql1 = `select * from utilisateur, annonce, abonnement where utilisateur.id = annonce.utilisateur_id 
    and utilisateur.id = abonnement.utilisateur_id and annonce.id = abonnement.annonce_id and annonce.id = ?`

        con.query(sql, request.params.id, function (err, result, fields) {
            if (err) throw err;
            con.query(sql1, request.params.id, function (error, results, fields) {
                if (error) throw err;
                if (results.length == 1) {
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
                if (results.length < 1) {
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
                console.log('the result is : ', result);
                console.log('-----------------------------------');
                console.log(sql1);
                console.log('the results are : ', result);
            })
        });
    }
});

//Approuver une annonce
app.get('/ichhar-admin/annoncesattentes/approuver/:id', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
        AnnonceID = request.params.id;
        sql = "UPDATE annonce SET status = 1 where id = ?"
        con.query(sql, AnnonceID, function (err, result, fields) {
            if (err) throw err;
            response.render('annonceattente', {
                layout: 'index',
                loggedin: request.session.loggedin,
                annonceattenteinfo: result,
            });
            return response.end();
        });
        response.redirect('/ichhar-admin/annoncesattentes?msg=approved');
    }
});

//Refuser une annonce
app.get('/ichhar-admin/annoncesattentes/refuser/:id', (request, response) => {
    if (request.session.loggedin === undefined) {
        return response.redirect('/ichhar-admin/signin');
    } else {
        AnnonceID = request.params.id;
        sql = "UPDATE annonce SET status = 2 where id = ?"
        con.query(sql, AnnonceID, function (err, result, fields) {
            if (err) throw err;
            response.render('annonceattente', {
                layout: 'index',
                loggedin: request.session.loggedin,
                annonceattenteinfo: result,
            });
        });
        response.redirect('/ichhar-admin/annoncesattentes?msg=refused');
    }
});


app.listen(port, () => console.log(`App listening to port ${port}`));