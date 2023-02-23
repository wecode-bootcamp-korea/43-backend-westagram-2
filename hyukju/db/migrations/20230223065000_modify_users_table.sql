-- migrate:up
ALTER TABLE users ADD password VARCHAR(200) NOT NULL;

-- migrate:down

