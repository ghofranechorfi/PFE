const express = require('express');
var mysql = require('mysql');
const handlebars = require('express-handlebars');
const app = express();
const port = 3000
const path = require('path');

const hbs = handlebars.create({
    layoutsDir: __dirname + '/views/layouts/',
    extname: 'hbs'
});

app.use(express.static('public'));

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './views');

app.get('/ichhar-admin/accueil', (req, res) => {
    res.render('main', {layout : 'index'});
});

app.get('/ichhar-admin/signin', (req, res) => {
    res.render('signin', {layout : 'index'});
});

app.get('/ichhar-admin/signup', (req, res) => {
    res.render('signup', {layout : 'index'});
});

app.get('/ichhar-admin/clients', (req, res) => {
    res.render('clients', {layout : 'index'});
});

app.get('/ichhar-admin/abonnements', (req, res) => {
    res.render('abonnements', {layout : 'index'});
});

app.get('/ichhar-admin/annonces', (req, res) => {
    res.render('annonces', {layout : 'index'});
});

app.get('/ichhar-admin/categories', (req, res) => {
    res.render('categories', {layout : 'index'});
});

app.get('/ichhar-admin/profil', (req, res) => {
    res.render('profil', {layout : 'index'});
});

app.listen(port, () => console.log(`App listening to port ${port}`));