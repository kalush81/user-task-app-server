require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

const Sequelize = require("sequelize");
const password = process.env.DBPASSWORD;
const sequelize = new Sequelize(
  `postgres://postgres:${password}@localhost:5432/postgres`
);

//User and Task Schema
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

//test
app.post("/echo", (req, res) => {
  res.json(req.body);
});

// Create a new user account
const isRegister = (req, res, next) => {
  User.findOne({
    where: {
      email: req.body.email
    }
  })
    .then(user => {
      if (user) {
        res.send({ msg: "this email is registered" });
        return next("this email exist");
      }
      next();
    })
    .catch(err => next(err));
};
app.post("/users", isRegister, (req, res, next) => {
  User.create(req.body)
    .then(user => res.json(user))
    .catch(err => next(err));
});

//get user by Id
app.get("/users/:userId", (req, res, next) => {
  const id = req.params.userId;
  User.findByPk(id)
    .then(user => {
      if (user) return res.status(200).json(user);
      res
        .status(404)
        .send({ msg: `user with id:${id} doesn't exist` })
        .end();
    })
    .catch(err => next(err));
});

//update user by id
app.put("/users/:userId", (req, res, next) => {
  const id = req.params.userId;
  User.findByPk(id)
    .then(user => {
      if (user) {
        return user.update(req.body).then(user => {
          //res.status(204).send({msg: 'update success'})
          res.status(200).json(user);
        });
      }
      res
        .status(404)
        .send({ msg: `user with id:${id} doesn't exist` })
        .end();
    })
    .catch(err => next(err));
});
//Create Task
app.post("/users/:userId/tasks", (req, res, next) => {
  const userId = req.params.userId;
  User.findByPk(userId)
    .then(user => {
      if (!user)
        return res
          .status(404)
          .send({ msg: `you cant, user id ${userId} doesnt exist` })
          .end();
      Task.create({
        ...req.body,
        userId
      })
        .then(task => res.status(200).json(task))
        .catch(err => next(err));
    })
    .catch(err => next(err));
});
//get task by user id and task id
app.get("/users/:userId/tasks/:taskId", (req, res, next) => {
  Task.findOne({
    where: {
      userId: req.params.userId,
      id: req.params.taskId
    }
  })
    .then(task => {
      if (task) return res.json(task);
      res
        .status(404)
        .send({ msg: "task not found" })
        .end();
    })
    .catch(err => next(err));
});
//get all user's task
app.get("/users/:userId/tasks", (req, res, next) => {
  Task.findAll({
    where: {
      userId: req.params.userId
    }
  })
    .then(tasks => {
      if (tasks) return res.json({ ...tasks, numberOfTasks: tasks.length });
      res.status(404).send({ msg: "no tasks" });
    })
    .then(err => next(err));
});

//update an existing task by userId and taskID
app.put("/users/:userId/tasks/:taskId", (req, res, next) => {
  Task.findOne({
    where: {
      userId: req.params.userId,
      id: req.params.taskId
    }
  })
    .then(task => {
      if (task) {
        task.update(req.body);
      } else {
        res
          .status(404)
          .send({ msg: "can not update" })
          .end();
      }
    })
    .catch(err => next(err));
});
//delete a user's task by taskId and userId
app.delete('/users/:userId/tasks/:taskId', (req, res, next) => {
    Task.destroy({
        where: {
            userId: req.params.userId,
            id: req.params.taskId
        }
    })
    .then(data => {
        if (data) return res.status(200).end()
        res.status(400).end()
    })
    .catch(next)
})

//delete all user's tasks
app.delete('/users/:userId/tasks', (req, res, next) => {
    Task.destroy({
        where: {
            userId: req.params.userId
        }
    })
    .then(deleted => {
        if (deleted) return res.status(200).send({msg: 'task deleted'}).end()
        res.status(400).send({msg: 'could not delete'}).end()
    })
    .catch(next)
})
app.listen(4000, console.log("server listen on 4000"));
