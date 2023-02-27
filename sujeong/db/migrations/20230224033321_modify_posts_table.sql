-- migrate:up
  ALTER TABLE posts ADD image_url VARCHAR(500) NULL;
-- migrate:down

