#!/usr/bin/env python3
"""Regenera los códigos QR del componente del grupo.

Los QR del desplegable no se calculan en la app: son siete direcciones fijas, así
que se generan aquí con una librería de referencia y se pegan como datos en
js/24-grupo-saneas.js. Ventajas: ni codificador ni dependencias en el cliente,
menos de 1 kB en total, y son correctos por construcción.

    python3 -m venv .venv && ./.venv/bin/pip install segno
    ./.venv/bin/python herramientas/qr_grupo.py

Imprime el bloque `var QRS = {...}` listo para sustituir en el componente. Si
cambia alguna dirección del grupo, se vuelve a ejecutar y se pega el resultado
EN LOS TRES SITIOS (app, webs y Acumula), que el fichero es el mismo en todos.
"""
import base64
import segno

URLS = {
    'saneas':      'https://saneas.es',
    'saneas-app':  'https://saneas.es/instala-app',
    'asesorias':   'https://saneas.es/asesorias',
    'pordondevoy': 'https://pordondevoy-saneas.vercel.app',
    'activala':    'https://activala.es',
    'laora':       'https://laora.es',
    'acumula':     'https://acumula.es',
}

filas = []
for clave, url in URLS.items():
    qr = segno.make(url, error='m', mode='byte')
    matriz = [[1 if punto else 0 for punto in fila] for fila in qr.matrix]
    lado = len(matriz)
    bits = ''.join(''.join(map(str, fila)) for fila in matriz)
    bits += '0' * ((8 - len(bits) % 8) % 8)
    crudo = bytes(int(bits[i:i + 8], 2) for i in range(0, len(bits), 8))
    filas.append("    '%s': {t:%d, d:'%s'}" % (clave, lado, base64.b64encode(crudo).decode()))
    print('# %-12s version %-2s  %dx%d' % (clave, qr.version, lado, lado))

print('\n  var QRS = {')
print(',\n'.join(filas))
print('  };')
