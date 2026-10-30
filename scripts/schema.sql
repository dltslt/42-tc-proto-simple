-- Tables loaded from the seed CSV. One table per file.
-- `state` on a task matches its column in `columns`.
-- `relations` is the parent and child record. `tasks.parent_id` repeats it.

CREATE TABLE actors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  spaces TEXT NOT NULL
);

CREATE TABLE spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL
);

CREATE TABLE members (
  space TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  role TEXT NOT NULL,
  PRIMARY KEY (space, actor_id)
);

CREATE TABLE columns (
  space TEXT NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  position TEXT NOT NULL,
  PRIMARY KEY (space, name)
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  space TEXT NOT NULL,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  parent_id TEXT NOT NULL,
  kanban TEXT NOT NULL,
  state TEXT NOT NULL,
  lead TEXT NOT NULL,
  contributors TEXT NOT NULL,
  description TEXT NOT NULL,
  effort TEXT NOT NULL,
  scheduled_time TEXT NOT NULL
);

CREATE TABLE relations (
  parent_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  PRIMARY KEY (parent_id, child_id)
);

CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE item_tags (
  item_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (item_id, tag_id)
);

CREATE TABLE blockers (
  id TEXT PRIMARY KEY,
  blocker_item_id TEXT NOT NULL,
  blocked_item_id TEXT NOT NULL,
  severity TEXT NOT NULL
);

CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL
);

CREATE TABLE item_artifacts (
  item_id TEXT NOT NULL,
  artifact_id TEXT NOT NULL,
  PRIMARY KEY (item_id, artifact_id)
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  at TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  detail TEXT NOT NULL
);
