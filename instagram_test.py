import os
import json
import urllib.request

TOKEN = os.environ.get("IG_TOKEN")
if not TOKEN:
    raise SystemExit("Error: no encontre la variable IG_TOKEN. Corre 'export IG_TOKEN=\"...\"' primero en esta misma terminal.")

BASE = "https://graph.instagram.com"

def get_json(url):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode())

# Traemos las ultimas 10 publicaciones
media_url = f"{BASE}/me/media?fields=id,caption,timestamp&limit=10&access_token={TOKEN}"
posts = get_json(media_url)["data"]

print(f"{'Publicacion':<45} {'Fecha':<12} {'Alcance':>10}")
print("-" * 70)

for post in posts:
    caption = post.get("caption", "(sin texto)")
    titulo = caption.split("\n")[0][:42]
    fecha = post["timestamp"][:10]
    post_id = post["id"]

    insights_url = f"{BASE}/{post_id}/insights?metric=reach&access_token={TOKEN}"
    try:
        data = get_json(insights_url)["data"]
        alcance = data[0]["values"][0]["value"]
    except Exception:
        alcance = "N/D"

    print(f"{titulo:<45} {fecha:<12} {str(alcance):>10}")