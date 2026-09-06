import urllib.request
import re
import json

def search_unsplash(query):
    url = f"https://unsplash.com/napi/search/photos?query={query}&per_page=5"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            return [
                {
                    "url": img["urls"]["regular"],
                    "author": img["user"]["name"],
                    "link": img["links"]["html"],
                    "alt": img.get("alt_description", query)
                }
                for img in data["results"]
            ]
    except Exception as e:
        print(f"Error searching {query}: {e}")
        return []

queries = [
    "morocco modern villa",
    "casablanca architecture",
    "rabat morocco",
    "marrakech riad",
    "tanger morocco",
    "agadir morocco",
    "fes morocco",
    "meknes morocco",
    "oujda morocco",
    "tetouan morocco",
]

results = {}
for q in queries:
    print(f"Searching {q}...")
    results[q] = search_unsplash(q.replace(' ', '%20'))

with open("images.json", "w") as f:
    json.dump(results, f, indent=2)
