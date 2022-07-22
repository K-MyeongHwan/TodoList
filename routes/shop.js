let router = require('express').Router(); //라우터 파일 필수



router.get('/shrits', (req, res)=>{
    res.send('셔츠');
});

router.get('/pants', (req, res)=>{
    res.send('qkwl');
});

module.exports = router; //내보낼 변수명
//require('라이브러리명'), require('파일경로')