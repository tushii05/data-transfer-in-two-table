## 1. Find Invalid category_id Values

SELECT *
FROM posts
WHERE category_id NOT IN (SELECT id FROM categories);

## 2. Update Invalid category_id Values

UPDATE posts
SET category_id = 1
WHERE category_id NOT IN (SELECT id FROM categories);

## Change post to article 
 