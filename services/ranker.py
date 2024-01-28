import os

import sys
import traceback
import urllib.parse
import mysql.connector as connection
import pandas as pd
from dotenv import load_dotenv
import re
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

load_dotenv()


def build_index(df):
    inv_index = {}
    for _, row in df.iterrows():
        id = row["id"]
        tokens = valid_tokens(row["title"])
        for tag in json.loads(row["tags"]):
            for token in valid_tokens(tag):
                tokens.append(token)

        for token in tokens:
            values = inv_index[token] if token in inv_index else []
            values.append(id)
            inv_index[token] = values
    return inv_index


def tokenize(sentence):
    return sentence.lower().split(" ")


def clean_token(token):
    m = re.match("^([a-z].*[a-z])$", token)
    return m.group(0) if m != None else None


def valid_tokens(sentence):
    tokens = tokenize(sentence)
    valid = []
    for tk in tokens:
        clean = clean_token(tk)
        if clean:
            valid.append(clean)
    return valid


def get_entry(id, df):
    matches = list(df[df["id"] == id].iterrows())
    if len(matches) == 1:
        return matches[0][1]
    return None


class Features:
    def __init__(self, title):
        self.matches = 0
        self.title = title
        self.ingredient_matches = 0
        self.tag_matches = 0
        self.description_matches = 0
        self.direction_matches = 0

    def get_key(self):
        return (
            self.matches,
            self.tag_matches,
            self.ingredient_matches,
            self.description_matches,
            self.direction_matches,
            self.title,
        )


def get_features(entry, entries, query_tokens):
    id = entry["id"]
    features = Features(entry["title"])
    for _, v in entries.items():
        features.matches += 1 if id in v else 0

    for tk in valid_tokens(entry["description"]):
        if tk in query_tokens:
            features.description_matches += 1

    for tag in json.loads(entry["tags"]):
        for tk in valid_tokens(tag):
            if tk in query_tokens:
                features.tag_matches += 1

    for ingredient in json.loads(entry["ingredients"]):
        for tk in valid_tokens(ingredient):
            if tk in query_tokens:
                features.ingredient_matches += 1
    for direction in json.loads(entry["directions"]):
        for tk in valid_tokens(direction):
            if tk in query_tokens:
                features.direction_matches += 1
    return features


def likely(prefix, inv_index):
    opts = []
    for k, v in inv_index.items():
        if k not in ("or", "the", "this") and k.startswith(prefix):
            opts.append((k, len(v)))
    opts.sort(reverse=True, key=lambda e: (e[1], -len(e[0]), e[0]))
    return opts


def search(query, limit, inv_index, df):
    query_tokens = valid_tokens(query)
    extended = [lk for (lk, _) in likely(query_tokens[-1], inv_index)[:3]]
    with_features = []
    for ext in extended + [None]:
        entries = {}
        ids = set()
        tokens = query_tokens + [ext]
        for token in tokens:
            if token in ("or", "the", "this"):
                continue
            values = inv_index[token] if token in inv_index else []
            entries[token] = set(values)
            for id in values:
                ids.add(id)
        for id in ids:
            entry = get_entry(id, df)
            features = get_features(entry, entries, tokens)
            with_features.append((entry, ext, features.get_key(), features))
    with_features.sort(reverse=True, key=lambda e: (e[2], -len(e[1]) if e[1] else 0))
    filtered = []
    used = set()
    for entry, ext, _, f in with_features[0:limit] if limit else with_features:
        if entry["id"] in used:
            continue
        used.add(entry["id"])
        filtered.append(
            {
                "suffix_hint": ext,
                "features": vars(f),
                "id": entry["id"],
                "title": f.title,
            }
        )

    return filtered


def search_route(query, limit):
    mydb = connection.connect(
        host=os.environ.get("db_host"),
        database=os.environ.get("db_name"),
        user=os.environ.get("db_user"),
        passwd=os.environ.get("db_password"),
        use_pure=True,
    )
    db_query = """
      with latest_recipes as (
          select url as latest_url, max(id) as latest_id 
          from dim_recipes 
          group by url
      )
      select id, ds, url, type, description, directions, ingredients, tags, title, image, serves, time, host 
      from dim_recipes 
      right join latest_recipes as lts 
      on lts.latest_id = dim_recipes.id
      """
    df = pd.read_sql(db_query, mydb)
    mydb.close()  # close the connection
    inv_index = build_index(df)
    return search(query, limit, inv_index, df)


class RankingServer(BaseHTTPRequestHandler):
    def do_GET(self):
        print(self.path, self.request)
        if not self.path.startswith("/search_recipe?"):
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("Content-type", "text/json")
        self.end_headers()
        _, __, query_string = self.path.partition("?")
        parsed_qs = urllib.parse.parse_qs(query_string)
        result = search_route(
            parsed_qs["q"][0],
            int(parsed_qs["limit"][0]) if "limit" in parsed_qs else None,
        )
        self.wfile.write(json.dumps(result).encode("utf-8"))


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 3000), RankingServer)
    print("Server started http://0.0.0.0:3000")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()
    print("Server stopped.")
