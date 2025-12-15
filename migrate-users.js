require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateUsers() {
    // WordPress DB connection
    const wpDb = await mysql.createConnection({
        host: process.env.WP_HOST,
        user: process.env.WP_USER,
        password: process.env.WP_PASSWORD,
        database: process.env.WP_DB
    });

    // Local DB connection
    const localDb = await mysql.createConnection({
        host: process.env.LOCAL_HOST,
        user: process.env.LOCAL_USER,
        password: process.env.LOCAL_PASSWORD,
        database: process.env.LOCAL_DB
    });

    console.log('✅ Connected to both databases');

    // 1️⃣ Create users table if not exists
    await localDb.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT(11) AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NULL,
      slug VARCHAR(255) NULL,
      email VARCHAR(255) NULL,
      email_status TINYINT(1) DEFAULT 1,
      token VARCHAR(500) NULL,
      password VARCHAR(255) NULL,
      role VARCHAR(100) DEFAULT 'user',
      user_type VARCHAR(50) DEFAULT 'registered',
      google_id VARCHAR(255) NULL,
      facebook_id VARCHAR(255) NULL,
      vk_id VARCHAR(255) NULL,
      avatar VARCHAR(255) NULL,
      cover_image VARCHAR(255) NULL,
      status TINYINT(1) DEFAULT 1,
      about_me VARCHAR(5000) NULL,
      facebook_url VARCHAR(500) NULL,
      twitter_url VARCHAR(500) NULL,
      instagram_url VARCHAR(500) NULL,
      tiktok_url VARCHAR(500) NULL,
      whatsapp_url VARCHAR(500) NULL,
      youtube_url VARCHAR(500) NULL,
      discord_url VARCHAR(500) NULL,
      telegram_url VARCHAR(500) NULL,
      pinterest_url VARCHAR(500) NULL,
      linkedin_url VARCHAR(500) NULL,
      twitch_url VARCHAR(500) NULL,
      vk_url VARCHAR(500) NULL,
      personal_website_url VARCHAR(500) NULL,
      last_seen TIMESTAMP NULL,
      show_email_on_profile TINYINT(1) DEFAULT 1,
      show_rss_feeds TINYINT(1) DEFAULT 1,
      reward_system_enabled TINYINT(1) DEFAULT 0,
      balance DOUBLE DEFAULT 0,
      total_pageviews INT(11) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      otpExpirationTime DATE NULL,
      isEmailVerified TINYINT(4) DEFAULT 0,
      verificationOtp INT(11) DEFAULT 0,
      gender VARCHAR(255) NULL,
      preferences LONGTEXT NULL,
      dob VARCHAR(255) NULL,
      address VARCHAR(255) NULL,
      UNIQUE KEY unique_email (email)
    )
  `);

    console.log('📦 users table ready');

    // 2️⃣ Fetch users from WordPress
    const [wpUsers] = await wpDb.query(`
    SELECT
      ID,
      user_login,
      user_nicename,
      user_email,
      user_pass,
      user_registered
    FROM wp_users
  `);

    console.log(`👤 Found ${wpUsers.length} WP users`);

    // 3️⃣ Insert users into local DB
    for (const user of wpUsers) {
        await localDb.query(
            `
      INSERT INTO users (
        id,
        username,
        slug,
        email,
        password,
        created_at,
        status,
        role,
        user_type,
        email_status
      )
      VALUES (?, ?, ?, ?, ?, ?, 1, 'user', 'registered', 1)
      ON DUPLICATE KEY UPDATE
        username = VALUES(username),
        slug = VALUES(slug),
        password = VALUES(password)
      `,
            [
                user.ID,
                user.user_login,
                user.user_nicename,
                user.user_email,
                user.user_pass,
                user.user_registered
            ]
        );
    }

    console.log('🚀 Migration completed successfully');

    await wpDb.end();
    await localDb.end();
}

migrateUsers().catch(err => {
    console.error('❌ Error:', err);
});
