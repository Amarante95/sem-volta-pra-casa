#!/usr/bin/env python3
"""Junta index.html + estilo.css + jogo.js + assets.js + mapa/mapa.js num arquivo só: ../sem-volta-pra-casa.html
(é esse arquivo único que vai pro Claude/artefato ou pra qualquer lugar que só aceita um HTML).
Uso:  python3 juntar.py"""
import json,re,os
aqui=os.path.dirname(os.path.abspath(__file__))
ler=lambda n:open(os.path.join(aqui,n),encoding='utf-8').read()
html,css,js=ler('index.html'),ler('estilo.css'),ler('jogo.js')
mapa=ler(os.path.join('mapa','mapa.js'))  # exportado pelo Tiled (Ctrl+E no mapa.tmj)
a=ler('assets.js');assets=json.loads(a[a.index('=')+1:].strip().rstrip(';'))
for nome,valor in assets.items():
    js=js.replace(f"const {nome}=SVPC_ASSETS.{nome}",f"const {nome}='{valor}'")
assert 'SVPC_ASSETS' not in js,'algum asset não foi reinserido'
v=r'(?:\?v=[^"]*)?'  # o index.html usa ?v=data pra furar o cache do navegador
html=re.sub(r'<link rel="stylesheet" href="estilo\.css'+v+'">',lambda _:'<style>'+css+'</style>',html)
html=re.sub(r'<script src="assets\.js'+v+r'"></script>\n<script src="mapa/mapa\.js'+v+r'"></script>\n<script src="jogo\.js'+v+r'"></script>',lambda _:'<script>'+mapa+'</script>\n<script>'+js+'</script>',html)
saida=os.path.join(aqui,'..','sem-volta-pra-casa.html')
open(saida,'w',encoding='utf-8').write(html)
print('pronto:',os.path.normpath(saida),f'({len(html)/1e6:.1f} MB)')
