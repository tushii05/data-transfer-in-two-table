const { Sequelize, DataTypes } = require('sequelize');

const wpSequelize = new Sequelize('tripdb', 'root', '123456', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

const localSequelize = new Sequelize('demotripdb', 'root', '123456', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

const LocalTable = localSequelize.define('LocalTable', {
    lang_id: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING, allowNull: true },
    title_slug: { type: DataTypes.STRING, allowNull: true },
    title_hash: { type: DataTypes.STRING, allowNull: true },
    keywords: { type: DataTypes.STRING, allowNull: true },
    summary: { type: DataTypes.TEXT('long'), allowNull: true },
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
    isOld: { type: DataTypes.TINYINT, allowNull: true, defaultValue: 1 },
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
    tableName: 'postsNewCopy',
    timestamps: false
});

// --- Fetch WordPress posts ---
async function fetchWpPosts() {
    const [results] = await wpSequelize.query(`
        SELECT 
            t.term_id AS category_id,
            p.ID AS post_id,
            p.post_title AS post_title,
            p.post_date AS post_date
        FROM wp_terms t
        JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
        JOIN wp_term_relationships tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
        JOIN wp_posts p ON tr.object_id = p.ID
        WHERE tt.taxonomy = 'category' 
          AND p.post_type = 'post' 
          AND p.post_status = 'publish'
        ORDER BY t.term_id, p.post_date DESC
    `);
    return results;
}

// --- Update local table ---
async function updateLocalPosts() {
    const wpPosts = await fetchWpPosts();
    // console.log(wpPosts,"wpPosts");
    const categoryMap = {};

    // Prepare category-wise updates
    for (const post of wpPosts) {
        if (!categoryMap[post.category_id]) categoryMap[post.category_id] = [];
        categoryMap[post.category_id].push(post);
    }

    let totalUpdated = 0;

    for (const categoryId of Object.keys(categoryMap)) {
        const posts = categoryMap[categoryId];
        let categoryUpdated = 0;

        for (const post of posts) {
            const [affectedRows] = await LocalTable.update(
                { post_id: post.post_id, title: post.post_title },
                { where: { category_id: post.category_id } }
            );
            categoryUpdated += affectedRows;
        }

        totalUpdated += categoryUpdated;
        console.log(`Category ${categoryId} → ${categoryUpdated} rows updated`);
    }

    console.log(`Total rows updated: ${totalUpdated}`);
}

// --- Run migration ---
(async () => {
    try {
        await wpSequelize.authenticate();
        await localSequelize.authenticate();
        console.log('✅ DB connections successful!');

        await updateLocalPosts();
        console.log('✅ Migration completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
})();
