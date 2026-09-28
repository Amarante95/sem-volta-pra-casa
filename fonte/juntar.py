#!/usr/bin/env python3
"""Junta index.html + estilo.css + jogo.js + assets.js num arquivo só: ../sem-volta-pra-casa.html
(é esse arquivo único que vai pro Claude/artefato ou pra qualquer lugar que só aceita um HTML).
Uso:  python3 juntar.py"""
import json,re,os
aqui=os.path.dirname(os.path.abspath(__file__))
ler=lambda n:open(os.path.join(aqui,n),encoding='utf-8').read()
html,css,js=ler('index.html'),ler('estilo.css'),ler('jogo.js')
a=ler('assets.js');assets=json.loads(a[a.index('=')+1:].strip().rstrip(';'))
for nome,valor in assets.items():
    js=js.replace(f"const {nome}=SVPC_ASSETS.{nome}",f"const {nome}='{valor}'")
assert 'SVPC_ASSETS' not in js,'algum asset não foi reinserido'
html=html.replace('<link rel="stylesheet" href="estilo.css">','<style>'+css+'</style>')
html=html.replace('<script src="assets.js"></script>\n<script src="jogo.js"></script>','<script>'+js+'</script>')
saida=os.path.join(aqui,'..','sem-volta-pra-casa.html')
open(saida,'w',encoding='utf-8').write(html)
print('pronto:',os.path.normpath(saida),f'({len(html)/1e6:.1f} MB)')
