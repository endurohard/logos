const TelegramBot = require("node-telegram-bot-api");
const { Pool } = require("pg");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: 5432,
});

async function addUser(username, password) {
    const query = `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *`;
    const result = await pool.query(query, [username, password]);
    return result.rows[0];
}

async function getUser(username) {
    const query = `SELECT * FROM users WHERE username = $1`;
    const result = await pool.query(query, [username]);
    return result.rows[0];
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "Добро пожаловать в Proxy Manager!\nИспользуйте /create для создания прокси."
    );
});

bot.onText(/\/create/, async (msg) => {
    const username = `user_${msg.from.id}`;
    const password = Math.random().toString(36).slice(-8);

    try {
        const user = await getUser(username);
        if (user) {
            return bot.sendMessage(
                msg.chat.id,
                `Аккаунт уже существует!\nЛогин: ${user.username}\nПароль: ${user.password}`
            );
        }
        const newUser = await addUser(username, password);
        bot.sendMessage(
            msg.chat.id,
            `Аккаунт создан!\nЛогин: ${newUser.username}\nПароль: ${newUser.password}`
        );
    } catch (err) {
        bot.sendMessage(msg.chat.id, "Ошибка при создании аккаунта.");
    }
});