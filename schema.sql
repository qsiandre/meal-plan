use avohome; 

CREATE TABLE IF NOT EXISTS to_scrape (
  id INT NOT NULL AUTO_INCREMENT,
  ds char(20),
  url text(1000),
  kind char(100),
  description char(100),
  status char(100),
  host char(100),
  job_id char(100),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS dim_recipes (
  id INT NOT NULL AUTO_INCREMENT,
  ds char(20),
  url text(1000),
  type char(100),
  description text(1000),
  directions JSON,
  tags JSON,
  ingredients JSON,
  title char(200),
  image text(1000),
  serves char(100),
  time char(100),
  host char(100),
  job_id char(100),
  PRIMARY KEY (id)
);