import os
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

IG_TOKEN = os.environ.get("IG_TOKEN")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not IG_TOKEN:
    raise SystemExit("Error: falta IG_TOKEN. Corre 'export IG_TOKEN=\"...\"' primero.")
if not SUPABASE_URL:
    raise SystemExit("Error: falta SUPABASE_URL. Corre 'export SUPABASE_URL=\"...\"' primero.")
if not SUPABASE_SERVICE_KEY:
    raise SystemExit("Error: falta SUPABASE_SERVICE_KEY. Corre 'export SUPABASE_SERVICE_KEY=\"...\"' primero.")

IG_BASE = "https://graph.instagram.com"

def get_json(url):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode())

def guardar_en_supabase(fila):
    url = f"{SUPABASE_URL}/rest/v1/publicaciones_instagram"
    data = json.dumps(fila).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("apikey", SUPABASE_SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    urllib.request.urlopen(req)

# Traemos las ultimas 10 publicaciones
media_url = f"{IG_BASE}/me/media?fields=id,caption,timestamp&limit=10&access_token={IG_TOKEN}"
posts = get_json(media_url)["data"]

print(f"{'Publicacion':<40} {'Alcance':>8} {'Interac.':>9} {'Guard.':>7} {'Compart.':>9}  Estado")
print("-" * 95)

for post in posts:
    caption = post.get("caption", "(sin texto)")
    titulo = caption.split("\n")[0][:38]
    post_id = post["id"]
    fecha_publicacion = post["timestamp"]

    insights_url = f"{IG_BASE}/{post_id}/insights?metric=reach,total_interactions,saved,shares&access_token={IG_TOKEN}"
    metricas = {"reach": 0, "total_interactions": 0, "saved": 0, "shares": 0}
    try:
        data = get_json(insights_url)["data"]
        for item in data:
            metricas[item["name"]] = item["values"][0]["value"]
    except Exception:
        pass

    fila = {
        "post_id": post_id,
        "titulo": titulo,
        "fecha_publicacion": fecha_publicacion,
        "fecha_consulta": datetime.now(timezone.utc).isoformat(),
        "alcance": metricas["reach"],
        "interacciones": metricas["total_interactions"],
        "guardados": metricas["saved"],
        "compartidos": metricas["shares"],
    }

    try:
        guardar_en_supabase(fila)
        estado = "guardado"
    except urllib.error.HTTPError as e:
        estado = f"ERROR {e.code}: {e.read().decode()}"
    except Exception as e:
        estado = f"ERROR: {e}"

    print(f"{titulo:<40} {metricas['reach']:>8} {metricas['total_interactions']:>9} {metricas['saved']:>7} {metricas['shares']:>9}  [{estado}]")