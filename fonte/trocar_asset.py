#!/usr/bin/env python3
"""Troca uma música ou imagem embutida.
Uso:  python3 trocar_asset.py NOME arquivo
NOMES: INICIO_AUDIO (menu/intro), MARACA_AUDIO (torcida), FESTA_AUDIO (Circo Voador), FINAL_AUDIO (depois do chefão),
       FACE_SRC (foto do rosto do Markin, png), BALL_SRC (bola da altinha, png), SONO_SRC (foto da tela de derrota, jpg),
       FINAL_SRC (foto da galera na tela de vitória, jpg)
Áudio: mp3 curto (até uns 2 MB). Depois rode  python3 juntar.py"""
import sys,json,base64,os
aqui=os.path.dirname(os.path.abspath(__file__));p=os.path.join(aqui,'assets.js')
nome,arq=sys.argv[1],sys.argv[2]
a=open(p,encoding='utf-8').read();cab=a[:a.index('=')+1];assets=json.loads(a[a.index('=')+1:].strip().rstrip(';'))
if nome not in assets:sys.exit('nome inválido. Use um destes: '+', '.join(assets))
b=base64.b64encode(open(arq,'rb').read()).decode()
if nome.endswith('_SRC'):
    ext=arq.lower().rsplit('.',1)[-1];b=f"data:image/{'jpeg' if ext in ('jpg','jpeg') else ext};base64,"+b
assets[nome]=b;open(p,'w',encoding='utf-8').write(cab+json.dumps(assets,indent=0)+';\n');print('trocado:',nome)
