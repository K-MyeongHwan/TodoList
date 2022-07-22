const express = require('express'); //express 가 필요해요
const bodyParser = require('body-parser'); //bodyParser 가 필요해요
const methodOverride = require('method-override');
const multer = require('multer');
const app = express(); //express 객체 생성
const http = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(http);
require('dotenv').config();
app.set('view engine', 'ejs'); //view engine 은 ejs 를 사용하겟습니다

app.use('/public', express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'))



const MongoClient = require('mongodb').MongoClient;

var db;
MongoClient.connect("mongodb+srv://KimMyeongHwan:rlaaudghks01@cluster0.gnra2yg.mongodb.net/?retryWrites=true&w=majority", (error, client) => {
    if (error) return console.log(error);

    db = client.db('TodoList'); //Database 에 TodoList 연결시켜주세요

    //db = client.db('TodoList'); //Database 에 TodoList 연결시켜주세요
    //db.collection('post').insertOne({이름 : '김명환', 나이 : 20, _id: 100}, (error, result)=>{
    //    console.log('저장완료');
    //});

    http.listen(8080, () => { //app.listen
        console.log('listeing on 8080');
    }); //서버 오픈
});

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/image')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) //파일명을 다이나믹하게 하고싶으면 요기를 건들면됨
    },
    filefilter: function (req, file, cb) { //파일 확장자를 거르려면 여기서 하면됨

    },
    limit: function (req, file, cb) { //뭐 용량 리미트 이런거

    }
})

let upload = multer({ storage: storage });

//app.get('경로', function()) {
//
//}

app.get('/', (req, res) => {
    res.render('index.ejs', {});
});

app.get('/write', (req, res) => {
    res.render('write.ejs', {});
})



app.get('/list', (req, res) => {
    db.collection('post').find().toArray((error, result) => {
        console.log(result);
        res.render('list.ejs', { posts: result });
    });

});


app.get('/detail/:id', (req, res) => {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, (error, result) => {
        console.log(result);
        res.render('detail.ejs', { data: result });
    })
});

app.get('/edit/:id', (req, res) => {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, (error, result) => {
        console.log(result);
        res.render('edit.ejs', { post: result });
    })
});

app.put('/edit', (req, res) => {
    console.log(req.body);

    db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { 제목: req.body.title, 날짜: req.body.date } }, (error, result) => {
        if (error) {
            console.log(error);
        }

        console.log('수정완료');

        res.redirect('/list');
    });
});


const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({ secret: '비밀번호', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', (req, res) => {
    res.render('login.ejs',);
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/fail' }), (req, res) => {
    res.redirect('/');
});


passport.use(new localStrategy({
    usernameField: 'id',
    passwordField: 'pwd',
    session: true,
    passReqToCallback: false,
}, function (id, pwd, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: id }, function (error, result) {
        if (error) return done(error)

        if (!result) return done(null, false, { message: '존재하지않는 아이디요' })
        if (pwd == result.pwd) {
            return done(null, result)
        } else {
            return done(null, false, { message: '비번틀렸어요' })
        }
    })
}));

passport.serializeUser((user, done) => { //세션을 저장시키는 코드
    done(null, user.id); //세션 데이터를 만들고 id를 기반으로 쿠키를 생성함
});
passport.deserializeUser((id, done) => { //로그인한 유저의 세션아이디를 바탕으로 개인정보를 DB 에서 찾는 역할
    db.collection('login').findOne({ id: id }, (error, result) => {
        done(null, result);
    });
});

app.post('/register', (req, res) => {
    db.collection('login').insertOne({ id: req.body.id, pwd: req.body.pwd }, (error, result) => {
        res.redirect('/');
    });
})

app.post('/add', (req, res) => {

    console.log(req.body.title);
    console.log(req.body.date);

    db.collection('counter').findOne({ name: '게시물갯수' }, (error, result) => {
        console.log(result.totalPost);
        let totalPost = result.totalPost;
        let data = { _id: totalPost + 1, 제목: req.body.title, 날짜: req.body.date, user: req.user._id };

        db.collection('post').insertOne(data, (error, result) => {
            console.log('저장완료');
            res.render('write.ejs');

            //$set : 값을 바꿀때
            //$inc : 값을 증가시킬때
            db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, (error, result) => {
                if (error) {
                    console.log(error);
                }
            });
        });
    });

});

app.delete('/delete', (req, res) => {
    console.log(req.body);
    req.body._id = parseInt(req.body._id);

    let data = { _id: req.body._id, user: req.user._id }

    db.collection('post').deleteOne(data, (error, result) => {
        if (error) {
            console.log(error);
            res.status(400).send({ message: '실패!' });
        }

        console.log('삭제완료');
        res.status(200).send({ message: '성공했습니다' });
    });
});

app.get('/mypage', isLogined, (req, res) => {
    res.render('mypage.ejs', { user: req.user });
});

function isLogined(req, res, next) {
    if (req.user) { //로그인 후 세션이 있으면, req.user 가 항상 있음
        next() //통과 , continue
    } else {
        res.send('로그인안했는디유');
    }
}

app.get('/search', (req, res) => {
    console.log(req.query.keyword); //parameter 

    db.collection('post').find({ $text: { $search: req.query.keyword } }).toArray((error, result) => {
        console.log(result);
        res.render('search.ejs', { posts: result });
    });
});

app.use('/shop', require('./routes/shop')); //req - res 사이에 실행되는 코드

app.get('/upload', (req, res) => {
    res.render('upload.ejs')
});

app.post('/upload', upload.single('profile'), (req, res) => { //여러파일이라면 upload.array 로, upload.array('profile', 10)
    res.send('업로드 완료');
});

app.get('/image/:imageName', (req, res) => {
    res.sendFile(__dirname + '/public/image/' + req.params.imageName)
});
//<img src="/image/1.png">

//////

app.post('/chatroom', isLogined, (req, res) => {
    req.body.postId = parseInt(req.body.postId);

    db.collection('post').findOne({ _id: req.body.postId }, (error, result) => {
        if (error) {
            console.log(error);
        }

        let postName = result.제목;
        let user = result.user;

        let data = { member: [user, req.user._id], date: new Date(), title: postName };

        db.collection('chatroom').insertOne(data, (error, result) => {
            if (error) {
                console.log(error);
            }

            console.log('채팅방 생성완료');
        });
    });
});

app.get('/chat', isLogined, (req, res) => {
    db.collection('chatroom').find({ member: req.user._id }).toArray((error, result) => {
        res.render('chat.ejs', { chatrooms: result });
    })
});

app.post('/message', isLogined, (req, res) => {
    let data = {
        parent: req.body.parent,
        content: req.body.content,
        user: req.user._id,
        date: new Date()
    };
    db.collection('message').insertOne(data).then(() => {
        console.log('DB 저장 완료');
        res.send('DB 저장 완료');
    });
});

app.get('/message/:id', isLogined, (req, res) => {

    res.writeHead(200, { //header 를 이렇게 설정해주세요~
        "Connection": "kepp-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",

    });

    db.collection('message').find({ parent: req.params.id }).toArray().then((result) => {

        res.write('event: test\n'); //응답 여러번 가능 , 유저에게 데이터 전송은 evnet: 보낼데이터이름\n 
        res.write('data: ' + JSON.stringify(result) + '\n\n');
    });


    //
    const pipeline = [
        {$match: {'fullDocument.parent' : req.params.id}}
    ];
    const collection = db.collection('message');
    const changeStream = collection.watch(pipeline);
    changeStream.on('change', (result)=>{
        res.write('event: test\n');
        res.write('data:' + JSON.stringify([result.fullDocument]) + '\n\n');
    });
});

app.get('/socket', (req, res)=>{
    res.render('socket.ejs');
});

io.on('connection',(socket)=>{ //웹소켓 접속시 실행코드
    console.log('유저접속');


    socket.on('user-send', (data)=>{ //서버가 수신할때, on(작명(이벤트이름), 콜백함수), emit 과 같은 이벤트명
        console.log(data);

        io.emit('broadcast', data); //서버 -> 유저 메시지전송, 모든 유저에게 메시지를 보냄
        //io.to(socket.id).emit('boardcast',data); socket.id 로 구분하여 서버 - 유저간의 1ㄷ1 대화를 할 수있따는데
    });

    socket.on('joinRoom', (data)=>{
        socket.join('room1'); //채팅방 생성, 입장 
    });

    socket.on('room1-send', (data)=>{
        io.to('room1').emit('broadcast',data); //room1 들어간 유저에게 전송됨
    })
});