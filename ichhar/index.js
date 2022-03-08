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

//databaseconnection here

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './views');

app.get('/', function (req, res) {
    res.render('main', {layout: 'index'});
});

app.get('/signin', (req, res) => {
    res.render('signin', {layout: 'index'});
})

app.get('/signup', (req, res) => {
    res.render('signup', {layout: 'index'});
})

app.get('/favoris', (req, res) => {
    res.render('favoris', {layout: 'index'});
})

app.get('/add-ads', (req, res) => {
    res.render('addADS', {layout: 'index'});
})

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})