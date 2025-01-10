const { Sequelize, DataTypes } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();
const phpUnserialize = require('php-serialize');

// Setup Sequelize
const sequelize = new Sequelize(process.env.LOCAL_DB, process.env.LOCAL_USER, process.env.LOCAL_PASSWORD, {
    host: process.env.LOCAL_HOST,
    dialect: 'mysql',
    logging: false,
    // dialectOptions: {
    //     charset: 'utf8mb4',
    // }
    pool: {
        max: 5,
        min: 0,
        acquire: 60000,  // Increase acquire timeout to 60 seconds
        idle: 20000,     // Increase idle timeout to 20 seconds
    },
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


const getImageSizes = (metaValue) => {
    try {
        const metadata = phpUnserialize.unserialize(metaValue);
        const originalFilePath = metadata?.file;

        const constructImagePath = (sizeKey) => {
            const sizeData = metadata?.sizes?.[sizeKey];
            if (sizeData?.file) {
                const pathParts = originalFilePath.split('/');
                const baseDir = pathParts.slice(0, -1).join('/');
                return `${baseDir}/${sizeData.file}`;
            }
            return null;
        };

        return {
            image_small: constructImagePath('medium'),
            image_mid: constructImagePath('medium_large'),
            image_big: constructImagePath('large'),
        };
    } catch (error) {
        console.error('Error processing _wp_attachment_metadata:', error);
        return { image_small: null, image_mid: null, image_big: null };
    }
};

const migrateData = async () => {
    const wpConnection = await mysql.createConnection({
        host: process.env.WP_HOST,
        user: process.env.WP_USER,
        password: process.env.WP_PASSWORD,
        database: process.env.WP_DB,
        charset: 'utf8mb4',
        connectTimeout: 60000,
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
            // Fetch data from `wp_posts` in chunks where `post_type` is `post`
            const [wpPosts] = await wpConnection.execute(
                'SELECT * FROM wp_posts WHERE post_type = ? AND post_status != ? LIMIT ? OFFSET ?',
                ['post', 'auto-draft', limit, offset]
            );

            if (wpPosts.length === 0) {
                console.log('No posts found.');
                return;
            }

            // Fetch additional data from wp_postmeta and wp_term_relationships
            const postIds = wpPosts.map(post => post.ID);
            let postMeta = [];
            let termRelationships = [];

            if (postIds.length > 0) {
                const idString = postIds.join(',');

                // Fetch post metadata
                [postMeta] = await wpConnection.query(
                    `SELECT post_id, meta_key, meta_value FROM wp_postmeta WHERE post_id IN (${idString})`
                );

                // Fetch term relationships
                [termRelationships] = await wpConnection.query(
                    `SELECT object_id, term_taxonomy_id FROM wp_term_relationships WHERE object_id IN (${idString})`
                );
            }

            // Map meta and taxonomy data for easier lookup
            const metaMap = postMeta.reduce((map, meta) => {
                if (!map[meta.post_id]) map[meta.post_id] = {};
                map[meta.post_id][meta.meta_key] = meta.meta_value;
                return map;
            }, {});
            const taxonomyMap = termRelationships.reduce((map, term) => {
                map[term.object_id] = term.term_taxonomy_id;
                return map;
            }, {});

            // Transform data and prepare for bulk insert
            const postData = await Promise.all(wpPosts.map(async (post) => {
                // Get attachment for the post
                const [attachmentRows] = await wpConnection.execute(
                    'SELECT * FROM wp_posts WHERE post_parent = ? AND post_type = ? ORDER BY ID DESC LIMIT 1',
                    [post.ID, 'attachment']
                );

                let image_url = null;
                let image_mime = null;
                let image_small = null;
                let image_mid = null;
                let image_big = null;

                let metaValue = metaMap[post.ID]?._wp_attachment_metadata;

                if (!metaValue && attachmentRows.length > 0) {
                    // If no metadata for the current post.ID, check post_parent attachment rows
                    const attachment = attachmentRows[0];
                    const [metaRows] = await wpConnection.execute(
                        'SELECT meta_value FROM wp_postmeta WHERE post_id = ? AND meta_key = ?',
                        [attachment.ID, '_wp_attachment_metadata']
                    );

                    if (metaRows.length > 0) {
                        metaValue = metaRows[0].meta_value;
                    }
                }

                if (metaValue) {
                        const sizes = getImageSizes(metaValue);
                        image_small = sizes.image_small;
                        image_mid = sizes.image_mid;
                        image_big = sizes.image_big;
                    }
                // if (metaValue) {
                //     console.log("Processing metadata for image_small...");
                //     image_small = getImageSmall(metaValue); // Extract image_small
                // }

                if (attachmentRows.length > 0) {
                    // If an attachment row exists, use the guid and post_mime_type for image_big and image_mime
                    const attachment = attachmentRows[0];
                    image_url = attachment.guid || null;
                    image_mime = attachment.post_mime_type || null;

                    // Now check for _wp_attachment_metadata in wp_postmeta
                    // console.log([post.ID])
                    // console.log(metaMap[post.ID]._wp_attachment_metadata, 'metaMap[post.ID]')
                    // const metaValue = metaMap[post.ID]?._wp_attachment_metadata;
                    // // console.log(metaValue, 'metaValue')
                    // if (metaValue) {
                    //     console.log("object")
                    //     // Get the image_small value by processing the _wp_attachment_metadata
                    //     image_small = getImageSmall(metaValue);
                    // }
                }

                return {
                    id: post.ID,
                    lang_id: 1, // Default lang_id
                    title: post.post_title,
                    title_slug: post.post_name,
                    summary: post.post_excerpt || null,
                    content: post.post_content,
                    post_type: post.post_type || null,
                    user_id: post.post_author || null,
                    status: post.post_status === 'publish' ? 1 : 0,
                    updated_at: post.post_modified,
                    created_at: post.post_date,
                    image_url, // Set image_big from attachment
                    image_mime, // Set image_mime from attachment
                    image_small, // Set image_small from processed metadata
                    image_big,
                    image_mid,
                    // Additional fields from wp_postmeta
                    image_default: metaMap[post.ID]?._wp_attached_file || null,
                    pageviews: parseInt(metaMap[post.ID]?.post_views_count || 0, 10),
                    image_description: metaMap[post.ID]?._wp_attachment_image_alt || null,
                    // Additional field from wp_term_relationships
                    category_id: taxonomyMap[post.ID] || null,
                    // Retain other fields as they are
                    title_hash: post.title_hash || null,
                    keywords: post.keywords || null,
                    image_slider: post.image_slider || null,
                    // image_big: post.image_big || null,
                    // image_mid: post.image_mid || null,
                    // image_small: post.image_small || null,
                    image_mime: 'jpg', // Default image mime type
                    image_storage: 'local',
                    optional_url: post.optional_url || null,
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
                    video_path: post.video_path || null,
                    video_embed_code: post.video_embed_code || null,
                    feed_id: post.feed_id || null,
                    post_url: post.post_url || null,
                    show_post_url: post.show_post_url || 1,
                    show_item_numbers: post.show_item_numbers || 1,
                    video_url: post.video_url || null
                };
            }));

            // Bulk insert data into the local table
            try {
                await LocalTable.bulkCreate(postData, { ignoreDuplicates: true });
                console.log(`Processed ${offset + wpPosts.length} records.`);
            } catch (error) {
                console.error(`Error inserting records at offset ${offset}:`, error);
            }

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