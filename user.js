const { Sequelize, DataTypes } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

const sequelize = new Sequelize(process.env.LOCAL_DB, process.env.LOCAL_USER, process.env.LOCAL_PASSWORD, {
    host: process.env.LOCAL_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 20000,
    },
});

const UsersTable = sequelize.define('UsersTable', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,       // Set as primary key
        autoIncrement: true,    // Set to auto-increment
    },
    username: { type: DataTypes.STRING, allowNull: true, },
    slug: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true, defaultValue: 'name@domain.com' },
    email_status: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    token: { type: DataTypes.STRING, allowNull: true },
    password: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.STRING, allowNull: true, defaultValue: 'user' },
    user_type: { type: DataTypes.STRING, allowNull: true, defaultValue: 'registered' },
    google_id: { type: DataTypes.STRING, allowNull: true },
    facebook_id: { type: DataTypes.STRING, allowNull: true },
    vk_id: { type: DataTypes.STRING, allowNull: true },
    avatar: { type: DataTypes.STRING, allowNull: true },
    cover_image: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    about_me: { type: DataTypes.STRING, allowNull: true },
    facebook_url: { type: DataTypes.STRING, allowNull: true },
    twitter_url: { type: DataTypes.STRING, allowNull: true },
    instagram_url: { type: DataTypes.STRING, allowNull: true },
    tiktok_url: { type: DataTypes.STRING, allowNull: true },
    whatsapp_url: { type: DataTypes.STRING, allowNull: true },
    youtube_url: { type: DataTypes.STRING, allowNull: true },
    discord_url: { type: DataTypes.STRING, allowNull: true },
    telegram_url: { type: DataTypes.STRING, allowNull: true },
    pinterest_url: { type: DataTypes.STRING, allowNull: true },
    linkedin_url: { type: DataTypes.STRING, allowNull: true },
    twitch_url: { type: DataTypes.STRING, allowNull: true },
    vk_url: { type: DataTypes.STRING, allowNull: true },
    personal_website_url: { type: DataTypes.STRING, allowNull: true },
    last_seen: { type: DataTypes.DATE, allowNull: true },
    show_email_on_profile: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    show_rss_feeds: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    reward_system_enabled: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    balance: { type: DataTypes.DOUBLE, allowNull: true, defaultValue: 0 },
    total_pageviews: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    verificationOtp: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    isEmailVerified: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
    otpExpirationTime: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
    tableName: 'users',
    timestamps: false
});



const migrateData = async () => {
    const wpConnection = await mysql.createConnection({
        host: process.env.WP_HOST,
        user: process.env.WP_USER,
        password: process.env.WP_PASSWORD,
        database: process.env.WP_DB,
        // charset: 'utf8mb4'
    });

    try {
        // Authenticate Sequelize connection
        await sequelize.authenticate();
        console.log('Connected to the local database.');

        // Disable foreign key checks temporarily
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', { raw: true });

        const limit = 10; // Process records in chunks of 1000
        let offset = 0;

        while (true) {
            // Fetch data from `wp_users` in chunks
            const [wpUsers] = await wpConnection.execute('SELECT * FROM wp_users LIMIT ? OFFSET ?', [limit, offset]);
            if (wpUsers.length === 0) break; // Exit loop if no more data

            // Transform data and prepare for bulk insert
            const userData = wpUsers.map(user => ({
                id: user.ID,
                username: user.user_login,
                slug: user.user_login,
                password: user.user_pass,
                email: user.user_email,
                created_at: user.user_registered,
                status: user.user_status,
            }));

            // Bulk insert data into the local table
            await UsersTable.bulkCreate(userData, { ignoreDuplicates: true });
            console.log(`Processed ${offset + wpUsers.length} records.`);

            offset += limit; // Increment offset
        }

        console.log('Data migration completed.');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        // Re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;', { raw: true });
        await wpConnection.end();
        await sequelize.close();
    }
};

migrateData();
