"""Dá nomes aos recortes da folha do ep. 02 (entrada/imagens/ep02/GERACAO_FINAL_MELHOR.jpg).

uso: python tools/preparar_ativos.py ep02 GERACAO_FINAL_MELHOR && python tools/nomear_ep02.py
Copia assets/recortes/ep02/_folha/GERACAO_FINAL_MELHOR_N.png → assets/recortes/ep02/<nome>.png e
confere o tamanho de cada item (se a folha mudar, a conferência avisa em vez de trocar os nomes em silêncio).
"""
import json, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / 'assets' / 'recortes' / 'ep02'
FOLHA = 'GERACAO_FINAL_MELHOR'
NOMES = {
    1: 'ramo', 2: 'nuvem', 3: 'folha', 4: 'ramo2', 5: 'sol_disco', 6: 'notebook', 7: 'caminhao_lixo',
    8: 'pino_coral', 9: 'pino_ambar', 10: 'pino_lima', 11: 'cursor', 12: 'saco_restos', 13: 'vaca',
    14: 'gestora', 15: 'mao', 16: 'empresario', 17: 'pesquisadora', 18: 'pino_coral2', 19: 'livros',
    20: 'pino_ambar2', 21: 'pino_lima2', 22: 'artigo', 23: 'pino_petrol', 24: 'pergaminho', 25: 'lupa',
}
TAM = {6: (1070, 798), 13: (512, 387), 14: (489, 560), 16: (445, 593), 17: (394, 586), 19: (389, 285)}


def main():
    man = json.loads((D / '_folha' / 'manifest.json').read_text(encoding='utf-8'))[FOLHA]
    assert len(man) == len(NOMES), f'a folha tem {len(man)} itens, esperava {len(NOMES)}'
    for i, it in enumerate(man, start=1):
        if i in TAM: assert (it['w'], it['h']) == TAM[i], (i, it['w'], it['h'])
        shutil.copy(D / '_folha' / it['arquivo'], D / f'{NOMES[i]}.png')
        print(f'{i:2d} → {NOMES[i]:14s} {it["w"]}×{it["h"]}')


if __name__ == '__main__':
    main()
