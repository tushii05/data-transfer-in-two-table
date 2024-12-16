// const fs = require('fs');
// const { Sequelize, DataTypes } = require('sequelize');
// const mysql = require('mysql2/promise');
// require('dotenv').config();

// // Setup Sequelize
// const sequelize = new Sequelize(process.env.LOCAL_DB, process.env.LOCAL_USER, process.env.LOCAL_PASSWORD, {
//     host: process.env.LOCAL_HOST,
//     dialect: 'mysql',
//     logging: false,
//     dialectOptions: {
//         charset: 'utf8',
//     }
// });

// // Define the local table model
// const LocalTable = sequelize.define('LocalTable', {
//     lang_id: { type: DataTypes.INTEGER, allowNull: true },
//     title: { type: DataTypes.STRING, allowNull: true },
//     title_slug: { type: DataTypes.STRING, allowNull: true },
//     title_hash: { type: DataTypes.STRING, allowNull: true },
//     keywords: { type: DataTypes.STRING, allowNull: true },
//     content: { type: DataTypes.TEXT('long'), allowNull: true },
//     category_id: { type: DataTypes.INTEGER, allowNull: true },
//     image_big: { type: DataTypes.STRING, allowNull: true },
//     image_default: { type: DataTypes.STRING, allowNull: true },
//     image_slider: { type: DataTypes.STRING, allowNull: true },
//     image_mid: { type: DataTypes.STRING, allowNull: true },
//     image_small: { type: DataTypes.STRING, allowNull: true },
//     image_mime: { type: DataTypes.STRING, allowNull: true, defaultValue: 'jpg' },
//     image_storage: { type: DataTypes.STRING, allowNull: true, defaultValue: 'local' },
//     optional_url: { type: DataTypes.STRING, allowNull: true },
//     pageviews: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
//     need_auth: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
//     is_slider: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
//     slider_order: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
//     is_featured: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
//     featured_order: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
//     is_recommended: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
//     is_breaking: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
//     is_scheduled: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
//     visibility: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
//     show_right_column: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
//     post_type: { type: DataTypes.STRING, allowNull: true, defaultValue: 'post' },
//     video_path: { type: DataTypes.STRING, allowNull: true },
//     video_storage: { type: DataTypes.STRING, allowNull: true, defaultValue: 'local' },
//     image_url: { type: DataTypes.STRING, allowNull: true },
//     video_url: { type: DataTypes.STRING, allowNull: true },
//     video_embed_code: { type: DataTypes.STRING, allowNull: true },
//     user_id: { type: DataTypes.INTEGER, allowNull: true },
//     status: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
//     feed_id: { type: DataTypes.INTEGER, allowNull: true },
//     post_url: { type: DataTypes.STRING, allowNull: true },
//     show_post_url: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
//     image_description: { type: DataTypes.STRING, allowNull: true },
//     show_item_numbers: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
//     is_poll_public: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
//     link_list_style: { type: DataTypes.STRING, allowNull: true },
//     recipe_info: { type: DataTypes.TEXT, allowNull: true },
//     post_data: { type: DataTypes.TEXT, allowNull: true },
//     created_at: { type: DataTypes.DATE, allowNull: true },
//     updated_at: { type: DataTypes.DATE, allowNull: true },
// }, {
//     tableName: 'posts',
//     timestamps: false
// });

// // Migrate data
// const migrateData = async () => {
//     const wpConnection = await mysql.createConnection({
//         host: process.env.WP_HOST,
//         user: process.env.WP_USER,
//         password: process.env.WP_PASSWORD,
//         database: process.env.WP_DB,
//         charset: 'utf8'
//     });

//     try {
//         // Authenticate Sequelize connection
//         await sequelize.authenticate();
//         console.log('Connected to the local database.');

//         // Disable foreign key checks temporarily
//         await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', { raw: true });

//         // Fetch data from `wp_posts`
//         const [wpPosts] = await wpConnection.execute('SELECT * FROM wp_posts');

//         // Transform data and prepare for bulk insert
//         const postData = wpPosts.map(post => ({
//             id: post.ID,
//             lang_id: post.lang_id || null,
//             title: post.post_title,
//             title_slug: post.post_name,
//             title_hash: post.title_hash,
//             keywords: post.keywords,
//             content: post.post_content,
//             category_id: post.category_id || null, // Ensure valid category_id
//             image_big: post.image_big || null,
//             image_default: post.image_default || null,
//             image_slider: post.image_slider || null,
//             image_mid: post.image_mid || null,
//             image_small: post.image_small || null,
//             image_mime: 'jpg',
//             image_storage: 'local',
//             optional_url: post.optional_url || null,
//             pageviews: post.pageviews || 0,
//             need_auth: post.need_auth || 0,
//             is_slider: post.is_slider || 0,
//             slider_order: post.slider_order || 1,
//             is_featured: post.is_featured || 0,
//             featured_order: post.featured_order || 1,
//             is_recommended: post.is_recommended || 0,
//             is_breaking: post.is_breaking || 1,
//             is_scheduled: post.is_scheduled || 0,
//             visibility: post.visibility || 1,
//             show_right_column: post.show_right_column || 1,
//             post_type: post.post_type || null,
//             video_path: post.video_path || null,
//             image_url: post.image_url || null,
//             video_embed_code: post.video_embed_code || null,
//             user_id: post.post_author || null,
//             status: post.post_status || 1,
//             feed_id: post.feed_id || null,
//             post_url: post.post_url || null,
//             show_post_url: post.show_post_url || 1,
//             image_description: post.image_description || null,
//             show_item_numbers: post.show_item_numbers || 1,
//             video_url: post.video_url || null,
//             created_at: post.post_date,
//             updated_at: post.post_modified
//         }));

//         // Bulk insert data into the local table
//         await LocalTable.bulkCreate(postData, { ignoreDuplicates: true });

//         console.log('Data migration completed.');
//     } catch (error) {
//         console.error('Error during migration:', error);
//     } finally {
//         // Re-enable foreign key checks
//         await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;', { raw: true });
//         await wpConnection.end();
//         await sequelize.close();
//     }
// };

// migrateData();


const fs = require('fs');
const { Sequelize, DataTypes } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Setup Sequelize
const sequelize = new Sequelize(process.env.LOCAL_DB, process.env.LOCAL_USER, process.env.LOCAL_PASSWORD, {
    host: process.env.LOCAL_HOST,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
        charset: 'utf8mb4',
    }
});

// Define the local table model
const LocalTable = sequelize.define('LocalTable', {
    lang_id: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING, allowNull: true },
    title_slug: { type: DataTypes.STRING, allowNull: true },
    title_hash: { type: DataTypes.STRING, allowNull: true },
    keywords: { type: DataTypes.STRING, allowNull: true },
    content: { type: DataTypes.TEXT('long'), allowNull: true },
    category_id: { type: DataTypes.INTEGER, allowNull: true },
    image_big: { type: DataTypes.STRING, allowNull: true },
    image_default: { type: DataTypes.STRING, allowNull: true },
    image_slider: { type: DataTypes.STRING, allowNull: true },
    image_mid: { type: DataTypes.STRING, allowNull: true },
    image_small: { type: DataTypes.STRING, allowNull: true },
    image_mime: { type: DataTypes.STRING, allowNull: true, defaultValue: 'jpg' },
    image_storage: { type: DataTypes.STRING, allowNull: true, defaultValue: 'local' },
    optional_url: { type: DataTypes.STRING, allowNull: true },
    pageviews: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    need_auth: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    is_slider: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    slider_order: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    is_featured: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    featured_order: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    is_recommended: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    is_breaking: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    is_scheduled: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    visibility: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    show_right_column: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    post_type: { type: DataTypes.STRING, allowNull: true, defaultValue: 'post' },
    video_path: { type: DataTypes.STRING, allowNull: true },
    video_storage: { type: DataTypes.STRING, allowNull: true, defaultValue: 'local' },
    image_url: { type: DataTypes.STRING, allowNull: true },
    video_url: { type: DataTypes.STRING, allowNull: true },
    video_embed_code: { type: DataTypes.STRING, allowNull: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    feed_id: { type: DataTypes.INTEGER, allowNull: true },
    post_url: { type: DataTypes.STRING, allowNull: true },
    show_post_url: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    image_description: { type: DataTypes.STRING, allowNull: true },
    show_item_numbers: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
    is_poll_public: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 0 },
    link_list_style: { type: DataTypes.STRING, allowNull: true },
    recipe_info: { type: DataTypes.TEXT, allowNull: true },
    post_data: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'posts',
    timestamps: false
});

// Migrate data
const migrateData = async () => {
    const wpConnection = await mysql.createConnection({
        host: process.env.WP_HOST,
        user: process.env.WP_USER,
        password: process.env.WP_PASSWORD,
        database: process.env.WP_DB,
        charset: 'utf8mb4'
    });

    try {
        // Authenticate Sequelize connection
        await sequelize.authenticate();
        console.log('Connected to the local database.');

        // Disable foreign key checks temporarily
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', { raw: true });

        const limit = 1000; // Process records in chunks of 1000
        let offset = 0;

        while (true) {
            // Fetch data from `wp_posts` in chunks
            const [wpPosts] = await wpConnection.execute('SELECT * FROM wp_posts LIMIT ? OFFSET ?', [limit, offset]);
            if (wpPosts.length === 0) break; // Exit loop if no more data

            // Transform data and prepare for bulk insert
            const postData = wpPosts.map(post => ({
                id: post.ID,
                lang_id: post.lang_id || null,
                title: post.post_title,
                title_slug: post.post_name,
                title_hash: post.title_hash,
                keywords: post.keywords,
                content: post.post_content,
                category_id: post.category_id || null,
                image_big: post.image_big || null,
                image_default: post.image_default || null,
                image_slider: post.image_slider || null,
                image_mid: post.image_mid || null,
                image_small: post.image_small || null,
                image_mime: 'jpg',
                image_storage: 'local',
                optional_url: post.optional_url || null,
                pageviews: post.pageviews || 0,
                need_auth: post.need_auth || 0,
                is_slider: post.is_slider || 0,
                slider_order: post.slider_order || 1,
                is_featured: post.is_featured || 0,
                featured_order: post.featured_order || 1,
                is_recommended: post.is_recommended || 0,
                is_breaking: post.is_breaking || 1,
                is_scheduled: post.is_scheduled || 0,
                visibility: post.visibility || 1,
                show_right_column: post.show_right_column || 1,
                post_type: post.post_type || null,
                video_path: post.video_path || null,
                image_url: post.image_url || null,
                video_embed_code: post.video_embed_code || null,
                user_id: post.post_author || null,
                status: post.post_status || 1,
                feed_id: post.feed_id || null,
                post_url: post.post_url || null,
                show_post_url: post.show_post_url || 1,
                image_description: post.image_description || null,
                show_item_numbers: post.show_item_numbers || 1,
                video_url: post.video_url || null,
                created_at: post.post_date,
                updated_at: post.post_modified
            }));

            // Bulk insert data into the local table
            await LocalTable.bulkCreate(postData, { ignoreDuplicates: true });
            console.log(`Processed ${offset + wpPosts.length} records.`);

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
