const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
});

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [
    {
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  }, 
  date: {
    type: Date,
    default: Date.now
  }
}], 
})

let User = mongoose.model("User", UserSchema)

// Post a user and return username and id
app.post('/api/users', async (req, res) =>{
  try{
  let user = new User({
    username: req.body.username,
  })
  let savedUser = await user.save();
  res.json({
    username: savedUser.username,
    _id: savedUser.id,
  })
}catch(err){
    res.status(500).json({ message: "There was an error creating the user" })
}
  })

//get users and return an array of users with username and id
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({})
    formattedUsers = users.map(user => ({ username: user.username, _id : user.id}))
    console.log(users)
    res.json(formattedUsers)
  }catch(err) {
    res.status(500).json({ message: "There was an error fetching the users" })
  };
})

// Post a user with all its information
app.post('/api/users/:_id/exercises', async (req, res) =>{
  const user_id = req.params._id;
  try{
    const user = await User.findById(user_id);
    if (!user){
      return res.status(404).json({ message: "User not found" });
    }
    const exercise = {
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date ? new Date(req.body.date) : new Date()
    }
    user.log.push(exercise);
    await user.save()
    res.json({
      _id: user._id,
      username: user.username,
      date: exercise.date,
      duration: exercise.duration,
      description: exercise.description
    })
  }catch(err){
    res.status(500).json({ message: "There was an error updating the user." })
}
})

//get a user and return username, count, id, and log
app.get('/api/users/:_id/logs', async (req, res) => {
  const user_id = req.params._id;
  let {from, to, limit} = req.query;
  try{
  const user = await User.findById(user_id);
  
  if (!user){
    return res.status(404).json({ message: "User not found" });
  }
  
  let logs = [...user.log];

  if(from){
    const fromDate = new Date(from);
    fromDate.setHours(0,0,0,0);
    logs = logs.filter(ex => new Date(ex.date) >= fromDate)
  }
  if(to){
    const toDate = new Date(to);
    toDate.setHours(23,59,59,999); 
    logs = logs.filter(ex => new Date(ex.date) <= toDate)

  }
  if(limit){
    logs = logs.slice(0, parseInt(limit))
  }

  res.json({
    _id: user.id,
    username: user.username,
    count: user.log.length,
    log: logs.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: new Date(ex.date).toDateString()
    })),
  
  })}catch(err){
    console.log(err)
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
