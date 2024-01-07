var express = require('express');
var router = express.Router();

const mongojs = require('mongojs');
const db = mongojs('mongodb://127.0.0.1:27017/bezeroakimage', ['bezeroak']);
const multer = require('multer')
const storage = multer.diskStorage(
    {
        destination: 'uploads/',
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }
);
const upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 },
    fileFilter: (req, file, cb) => {
        // Verifica el formato del archivo
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Solo se permiten archivos .png o .jpg'));
        }
    }
});

let users = [];

function findUsers() {
  return new Promise((resolve, reject) => {
    db.bezeroak.find({}, function (err, docs) {
      if (err) {
        reject(err);
      } else {
        resolve(docs);
      }
    });
  });
}

/* GET users listing. */
router.get('/', async function(req, res, next) {
  try {
    users = await findUsers();
    console.log("Users:", users); // Agrega un log para verificar que los usuarios se obtienen correctamente
    res.render("users", {
      title: "Users",
      users: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener usuarios");
  }
});

router.get('/list', function(req, res, next) {
  res.json(users);
});


router.post("/new", upload.single('avatar'), function (req, res) {
  if (req.body.avatar == "") {
    req.body.avatar = "descarga.jpg";
  }
  users.push(req.body);
  console.log(req.body);

  db.bezeroak.insert(req.body, function (err, user) {
    if (err) {
      console.log(err)
    } else {
      console.log(user)
      res.json(user)
    }
  })
});

router.delete("/delete/:id", (req, res) => {
  users = users.filter(user => user._id != req.params.id);
  
  db.bezeroak.remove(
    {"_id":  mongojs.ObjectID(req.params.id)},
    function (err, user) {
        if (err) {
            console.log(err)
        } else {
            console.log(user)
        }
    })
  res.json(users);
});

router.put("/update/:id", (req, res) => {
  let user = users.find(user => user._id == req.params.id);
  user.izena = req.body.izena;
  user.abizena = req.body.abizena;
  user.email = req.body.email;
  user.avatar = req.body.avatar.filename;
  
  db.bezeroak.update({"_id":  mongojs.ObjectID(req.params.id)},
    { $set: {"izena":  req.body.izena, "abizena":  req.body.abizena, "email":  req.body.email, "avatar": req.body.avatar.filename} },
    function (err, user) {
        if (err) {
            console.log(err)
        } else {
          console.log(user)
        }
    })

  res.json(users);
})

module.exports = router;
