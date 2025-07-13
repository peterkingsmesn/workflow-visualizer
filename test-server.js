const express = require('express');
const app = express();
const PORT = 3001;

app.get('/api/oauth/status', (req, res) => {
  res.json({ google: true, github: false });
});

app.listen(PORT, () => {
  console.log(`테스트 서버가 포트 ${PORT}에서 실행 중입니다.`);
});