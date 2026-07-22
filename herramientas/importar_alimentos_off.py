#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SANEAS · Fusiona el CAT_Tienda (tabla `productos`) con Open Food Facts España
y prepara la carga de la capa nutricional (`alimentos`).

USO (en el Mac, con red normal):
  1. En Supabase → Table Editor → productos → Export → CSV
     Guardar como productos.csv junto a este script.
  2. python3 importar_alimentos_off.py productos.csv
  3. Salidas:
     - alimentos_tienda.csv   → coincidencias claras (origen 'tienda', con producto_id).
                                Importar en Supabase → Table Editor → alimentos → Import CSV.
     - revisar_a_mano.csv     → coincidencias dudosas: nombre nuestro, candidato OFF y
                                nutrición propuesta. Oscar decide fila a fila.
     - sin_resultado.csv      → productos sin nada en OFF: rellenar a mano o dejar
                                que la clienta use los genéricos de la semilla.

Solo usa la librería estándar de Python (nada que instalar).
Datos: Open Food Facts, licencia ODbL (citar la fuente en la app: ya está en el
pie del buscador del diario).
"""
import csv, json, re, sys, time, unicodedata, urllib.parse, urllib.request

API = "https://es.openfoodfacts.org/cgi/search.pl?search_terms={q}&search_simple=1&action=process&json=1&page_size=5&fields=product_name_es,product_name,brands,code,nutriments"
CABECERA_UA = {"User-Agent": "Saneas-App/1.2 (app.saneas.es; importador fase 1)"}

def normaliza(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]+", " ", s)

def tokens(s):
    PARADA = {"de","la","el","con","sin","en","y","al","del","los","las","para","g","gr","kg","ml","l","un","una"}
    return {t for t in normaliza(s).split() if len(t) > 2 and t not in PARADA}

def busca_off(nombre):
    url = API.format(q=urllib.parse.quote(nombre))
    req = urllib.request.Request(url, headers=CABECERA_UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8")).get("products", [])

def nutricion(p):
    n = p.get("nutriments") or {}
    kcal = n.get("energy-kcal_100g")
    if kcal is None:  # algunos solo traen kJ
        kj = n.get("energy_100g")
        kcal = round(kj / 4.184, 1) if kj else None
    return kcal, n.get("proteins_100g"), n.get("carbohydrates_100g"), n.get("fat_100g"), n.get("fiber_100g")

def puntua(nuestro, candidato):
    tn, tc = tokens(nuestro), tokens(candidato)
    if not tn or not tc: return 0.0
    return len(tn & tc) / len(tn)

def main(ruta):
    with open(ruta, newline="", encoding="utf-8") as f:
        productos = list(csv.DictReader(f))
    print(f"{len(productos)} productos del CAT_Tienda")

    campos = ["nombre","marca","origen","producto_id","codigo_barras",
              "kcal_100","prot_100","hc_100","grasa_100","fibra_100","categoria"]
    ok  = csv.DictWriter(open("alimentos_tienda.csv","w",newline="",encoding="utf-8"), fieldnames=campos); ok.writeheader()
    rev = csv.DictWriter(open("revisar_a_mano.csv","w",newline="",encoding="utf-8"),
                         fieldnames=["producto_id","nuestro_nombre","off_nombre","off_marca","puntuacion"]+campos[5:]); rev.writeheader()
    sin = csv.DictWriter(open("sin_resultado.csv","w",newline="",encoding="utf-8"),
                         fieldnames=["producto_id","nombre","categoria"]); sin.writeheader()

    n_ok = n_rev = n_sin = 0
    for i, p in enumerate(productos):
        nombre = p.get("nombre") or ""
        if not nombre.strip(): continue
        try:
            candidatos = busca_off(nombre)
        except Exception as e:
            print(f"  ⚠️ red: {nombre}: {e}"); candidatos = []
        mejor, mejor_p = None, 0.0
        for c in candidatos:
            cn = c.get("product_name_es") or c.get("product_name") or ""
            kcal, *_ = nutricion(c)
            if kcal is None: continue
            s = puntua(nombre, cn + " " + (c.get("brands") or ""))
            if s > mejor_p: mejor, mejor_p = c, s
        if mejor is None:
            sin.writerow({"producto_id": p.get("id"), "nombre": nombre, "categoria": p.get("categoria")}); n_sin += 1
        else:
            kcal, prot, hc, gra, fib = nutricion(mejor)
            fila = {"nombre": nombre, "marca": (mejor.get("brands") or "").split(",")[0][:60],
                    "origen": "tienda", "producto_id": p.get("id"),
                    "codigo_barras": mejor.get("code") or "",
                    "kcal_100": kcal, "prot_100": prot or 0, "hc_100": hc or 0,
                    "grasa_100": gra or 0, "fibra_100": fib or "", "categoria": p.get("categoria")}
            if mejor_p >= 0.7:
                ok.writerow(fila); n_ok += 1
            else:
                rev.writerow({"producto_id": p.get("id"), "nuestro_nombre": nombre,
                              "off_nombre": mejor.get("product_name_es") or mejor.get("product_name"),
                              "off_marca": mejor.get("brands"), "puntuacion": round(mejor_p,2),
                              **{k: fila[k] for k in campos[5:]}}); n_rev += 1
        if (i+1) % 25 == 0: print(f"  {i+1}/{len(productos)}…")
        time.sleep(0.7)   # respetar el límite de peticiones de OFF

    print(f"\n✅ {n_ok} claras (alimentos_tienda.csv) · 🟠 {n_rev} a revisar · ⚪ {n_sin} sin resultado")
    print("Importa alimentos_tienda.csv en Supabase → alimentos. Las otras dos las revisa Oscar.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    main(sys.argv[1])
