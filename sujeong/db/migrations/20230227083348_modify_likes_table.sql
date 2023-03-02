-- migrate:up
  ALTER TABLE likes ADD UNIQUE KEY (user_id,post_id)

-- migrate:down

