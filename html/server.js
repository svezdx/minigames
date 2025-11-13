const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public')); // HTML, CSS, JS

const DATA_FILE = 'data.json';

// Чтение/запись базы
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({users: {}}));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===== API =====

// Регистрация пользователя с паролем
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({error: 'Имя и пароль обязательны'});

  const data = readData();
  const uid = Date.now().toString();

  // Проверка на уникальность имени
  const exists = Object.values(data.users).some(u => u.username === username);
  if (exists) return res.status(400).json({error: 'Имя уже занято'});

  data.users[uid] = { username, password, balance: 1000, friends: [] };
  writeData(data);

  res.json({uid, username, balance: 1000});
});

// Вход по имени и паролю
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const data = readData();

  const entry = Object.entries(data.users).find(([uid, u]) => u.username === username && u.password === password);
  if (!entry) return res.status(404).json({error: 'Неверное имя или пароль'});

  const [uid, user] = entry;
  res.json({uid, username: user.username, balance: user.balance, friends: user.friends});
});

// Добавление друга
app.post('/api/user/:uid/addFriend', (req, res) => {
  const { friendUID } = req.body;
  const data = readData();
  const user = data.users[req.params.uid];
  if (!user || !data.users[friendUID]) return res.status(404).json({error: 'Пользователь не найден'});

  if (!user.friends.includes(friendUID)) {
    user.friends.push(friendUID);
    writeData(data);
  }

  res.json({friends: user.friends});
});

// Получить профиль пользователя
app.get('/api/user/:uid', (req, res) => {
  const data = readData();
  const user = data.users[req.params.uid];
  if (!user) return res.status(404).json({error: 'Пользователь не найден'});
  res.json(user);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
