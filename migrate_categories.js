require('dotenv').config(); // Load environment variables
const mysql = require('mysql2/promise');

const WP_DB_CONFIG = {
    host: process.env.WP_HOST,
    user: process.env.WP_USER,
    password: process.env.WP_PASSWORD,
    database: process.env.WP_DB
};

const LOCAL_DB_CONFIG = {
    host: process.env.LOCAL_HOST,
    user: process.env.LOCAL_USER,
    password: process.env.LOCAL_PASSWORD,
    database: process.env.LOCAL_DB
};

async function migrateCategories() {
    let wpConn;
    let localConn;

    try {
        // Connect to WordPress DB
        wpConn = await mysql.createConnection(WP_DB_CONFIG);
        console.log('Connected to WordPress DB');

        // Connect to Local DB
        localConn = await mysql.createConnection(LOCAL_DB_CONFIG);
        console.log('Connected to Local DB');

        // Create categories table if not exists
        await localConn.execute(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT(11) AUTO_INCREMENT PRIMARY KEY,
                lang_id INT(11) DEFAULT 1,
                name VARCHAR(255) NULL,
                name_slug VARCHAR(255) NULL,
                parent_id INT(11) DEFAULT 0,
                sub_parent_id INT(11) DEFAULT 0,
                description VARCHAR(500) NULL,
                keywords VARCHAR(500) NULL,
                color VARCHAR(255) NULL,
                block_type VARCHAR(255) NULL,
                category_order INT(11) DEFAULT 0,
                show_on_homepage TINYINT(1) DEFAULT 1,
                show_on_menu TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Ensured categories table exists');

        // Fetch categories from WordPress
        const [categories] = await wpConn.execute(`
            SELECT t.term_id AS id, t.name, t.slug
            FROM wp_terms t
            JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
            WHERE tt.taxonomy = 'category'
            ORDER BY t.name ASC
        `);

        console.log(`Fetched ${categories.length} categories from WordPress`);

        if (categories.length === 0) {
            console.log('No categories to migrate.');
            return;
        }

        // Prepare bulk insert
        const values = categories.map(cat => [
            cat.id, cat.name, cat.slug, 1, 0, 0, 1, 1
        ]);

        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');

        const sql = `
            INSERT INTO categories 
            (id, name, name_slug, lang_id, parent_id, sub_parent_id, show_on_homepage, show_on_menu)
            VALUES ${placeholders}
            ON DUPLICATE KEY UPDATE name = VALUES(name), name_slug = VALUES(name_slug)
        `;

        // Flatten the values array
        const flatValues = values.flat();

        // Execute bulk insert
        await localConn.execute(sql, flatValues);

        console.log('Migration completed successfully!');

    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        if (wpConn) await wpConn.end();
        if (localConn) await localConn.end();
    }
}

migrateCategories();
