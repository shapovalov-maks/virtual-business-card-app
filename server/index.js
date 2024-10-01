const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config({ path: './.env' }); // Поддержка переменных окружения

// Инициализация приложения
const app = express();

// Middleware
app.use(express.json()); // Для работы с JSON-запросами
app.use(cors()); // Поддержка кросс-доменных запросов

// Логирование запросов для отладки
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Подключение к MongoDB
console.log('MongoDB URI:', process.env.MONGO_URI);
const mongoURI = process.env.MONGO_URI; // URI для подключения из .env файла
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Завершает процесс, если не удалось подключиться
  });

// Модель пользователя
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

// Маршрут для регистрации пользователя
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  console.log('Received registration request:', email, password); // Логируем данные для отладки

  try {
    // Проверка на существующего пользователя
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email); // Отладка: пользователь уже существует
      return res.status(400).json({ message: 'User already exists' });
    }

    // Хэшируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword); // Логируем хэшированный пароль

    // Создаём нового пользователя
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    console.log('User registered successfully'); // Логируем успешную регистрацию

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    // Логируем полную информацию об ошибке
    console.error('Error registering user:', error); 
    res.status(500).json({ 
      message: 'Error registering user', 
      error: error.message,
      stack: error.stack // Возвращаем стек вызовов для отладки
    });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
