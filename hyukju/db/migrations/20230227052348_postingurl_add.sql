-- migrate:up
ALTER TABLE posts ADD image_url VARCHAR(200) NULL;

-- migrate:down
