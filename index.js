const express = require('express');
const bodyParser = require('body-parser');

const app =  express()
app.use(bodyParser.json());

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  "postgres://postgres:secret@localhost:5432/postgres"
);

const User = sequelize.define("user", {
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  }
});

const Task = sequelize.define("task", {
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  description: {
    type: Sequelize.STRING
  },
  completed: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
});

sequelize
  .sync()
  .then(() => console.log("Tables created successfully"))
  .catch(err => {
    console.error("Unable to create tables, shutting down...", err);
    process.exit(1);
  });

app.post('/echo', (req, res) => {
    res.json(req.body)
}) 
// Create a new user account
const isRegister = (req, res, next) => {
    User.findOne({
        where: {
            email: req.body.email
        }
    }).then(user => {
        if (user) {
            res.send({msg: 'this email is registered'})
            return next('this email exist');
        } 
        next()
    })
}
app.post('/users', isRegister, (req, res, next) => {
    User.create(req.body)
        .then(user => res.json(user))
        .catch(err => next(err))
}) 
app.listen(4000, console.log('server listen on 4000'))