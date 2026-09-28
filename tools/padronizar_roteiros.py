"""Converte roteiros/NN-*.md para o formato padrão de 4 partes (roteiro · imagens · música · narração).

uso: python tools/padronizar_roteiros.py      (idempotente: arquivos já no formato novo são pulados)

Formato padrão (ver roteiros/_MODELO.md):
  ficha técnica → 1. Roteiro do vídeo (ideia, estilo & twist, storyboard, checagem) → 2. Imagens (prompts)
  → 3. Música (prompt Lyria) → 4. Narração (voz, direção, texto, comando)
"""
import re
from pathlib import Path

R = Path(__file__).resolve().parents[1] / 'roteiros'
EN = {'colagem de papel': 'paper-cut collage', 'feltro & crochê': 'felt & crochet', 'livro pop-up': 'pop-up book',
      'maquete de papelão': 'cardboard diorama', 'lousa & caderno': 'chalkboard & sketchbook', 'planta técnica': 'blueprint',
      'quadrinhos': 'comic book', 'caderno de campo': 'field notebook'}
def em_ingles(nome):
    for pt, en in EN.items(): nome = nome.replace(pt, en)
    return nome


NOME = {'C': 'colagem de papel', 'F': 'feltro & crochê', 'P': 'livro pop-up', 'D': 'maquete de papelão',
        'L': 'lousa & caderno', 'B': 'planta técnica', 'Q': 'quadrinhos', 'N': 'caderno de campo'}

# ep: (twist, papel do Metaninho, bpm, variação musical, tom da narração)
EP = {
 '03': ('o livro do CP2B (cada página é uma ideia)', 'cientista abre o livro; mascote na lombada e na assinatura', 96,
        'Warm, proud and quietly cinematic storybook feel, like pages of a pop-up book turning: soft strings and french horn join the series instruments; a gentle page-turn motif on glockenspiel at the start of each phrase; builds to its proudest, fullest statement in the last third.',
        'Warm, confident and inspiring — the proud voice of the centre introducing itself, still smiling and upbeat.'),
 '04': ('mistério / detetive', 'cientista detetive', 100,
        'Playful cartoon detective mystery: sneaky pizzicato walking bass, tiptoe marimba, a curious clarinet melody, finger snaps; in the second half the mystery is solved and the music brightens into the full, happy series theme.',
        'Playful intrigue, like a friendly detective story: slightly hushed and curious on the clues, bursting with delight at the discovery.'),
 '05': ('musical (onomatopeias no compasso)', 'mascote marca o ritmo', 112,
        'Bouncy, danceable farmyard groove: ukulele strums, hand claps, woodblock and a cheeky bassoon, with short rhythmic breaks on the downbeats so sound effects (oink, cluck, plop) can land in the gaps.',
        'Extra bouncy and rhythmic, almost dancing with the music, playful on the animal sounds.'),
 '06': ('jornada da heroína (a casca de banana)', 'mascote em ponta', 108,
        'Light cartoon adventure: a small heroic melody on muted trumpet or clarinet over pizzicato and brushed snare, a tense little "villain" moment around the landfill, then a triumphant bright finish.',
        'Adventure-story narrator: energetic and dramatic in a fun, comic-book way, cheering for the banana-peel heroine.'),
 '07': ('tempo real (café da manhã)', 'mascote', 110,
        'Brisk breakfast-time groove: a ticking woodblock clock motif, jazzy ukulele and marimba, walking upright bass, cheerful and fast-moving like a morning rush.',
        'Brisk and cheerful like a busy morning, quick but always clear.'),
 '08': ('mergulho no solo', 'cientista anota', 90,
        'Gentle, earthy and curious: kalimba and marimba with soft warm strings, descending melodic phrases as the camera dives into the soil, a sunny blooming moment when the plant grows.',
        'Warm and wonder-filled, a little softer and more intimate as we dive underground, still smiling.'),
 '09': ('rebobinar (VHS)', 'mascote de carona', 108,
        'Upbeat road-trip groove: driving ukulele strums, bass and brushed kit, bright glockenspiel hook; keep it steady and clean (the rewind effect will be added in post).',
        'Upbeat road-trip energy, playful surprise on the first line.'),
 '10': ('programa de culinária', 'cientista de chef', 100,
        'Cheerful TV cooking-show theme: bright bossa-jazz ukulele and marimba, a playful clarinet, a "kitchen timer" glockenspiel ding motif.',
        'Charismatic TV-chef host energy: warm, playful and enthusiastic, like presenting a favourite recipe.'),
 '11': ('ponto de vista do átomo de carbono', 'cientista na lousa', 96,
        'Light, curious and minimal: plucky pizzicato and marimba loops, pencil-tap percussion, a floating glockenspiel melody that circles like the carbon cycle.',
        'Curious and friendly, like following a tiny adventurer on a journey; clear and light.'),
 '12': ('raio-X / visita guiada', 'cientista guia', 98,
        'Discovery and wonder: marimba arpeggios with soft warm pads and gentle pulses, each new section adding an instrument, as if a blueprint is coming to life in colour.',
        'Friendly tour-guide voice: inviting and clear, pointing things out with enthusiasm.'),
 '13': ('vlog "um dia na vida"', 'mascote visita', 86,
        'Cosy lo-fi acoustic vlog groove: soft brushed kit, warm upright bass, mellow ukulele and a gentle glockenspiel, relaxed but happy.',
        'Casual and intimate vlogger talking straight to camera: chatty, warm, a little proud, with a smile in every line.'),
 '14': ('programa de auditório (quiz)', 'cientista apresentador', 112,
        'Bright game-show quiz music: bouncy marimba and claps, short suspense tick-tock breaks before each answer, and quick celebratory stings on the answers.',
        'Game-show host energy: big, bright and playful, dramatic pauses before each answer.'),
 '15': ('comercial retrô de TV', 'mascote garoto-propaganda', 104,
        'Retro 1960s TV-commercial jingle: vibraphone, bright pizzicato, bouncy upright bass, a whistling-like flute melody, optimistic and a bit cheesy in a charming way (no vocals).',
        'Cheerful retro TV announcer: bright, bouncy, a little theatrical, with a wink.'),
 '16': ('antes × depois', 'cientista', 98,
        'Starts muted, grey and minimal (sparse pizzicato and a low clarinet), then blooms at the halfway point into the full warm, colourful series orchestration.',
        'Begins a touch more serious on the "before", then lights up with enthusiasm on the "after".'),
 '17': ('jogo de tabuleiro', 'mascote é o peão', 104,
        'Playful board-game music: a hopping step-by-step marimba motif, dice-roll woodblock rolls, ukulele and claps, cheerful and cooperative.',
        'Playful game-night energy, like explaining the rules of a fun board game.'),
 '18': ('dupla de heróis (Hidro & Meta)', 'cientista narra a HQ', 110,
        'Light superhero theme: a bold heroic melody on french horn and clarinet over bouncy pizzicato and brushed snare, a big team-up moment in the second half.',
        'Comic-book narrator: dramatic and fun, heroic emphasis on the team-up.'),
 '19': ('foto de turma', 'os dois na foto', 100,
        'Warm and communal: instruments join one by one like people stepping into a group photo (glockenspiel, then ukulele, marimba, bass, claps), building to a joyful full band.',
        'Warm and welcoming, celebrating people, with pride and a big smile.'),
 '20': ('fichário com abas (uma página por eixo)', 'cientista vira as abas', 96,
        'Gentle, exploratory and organised: a page-turn glockenspiel motif repeating for each new tab, kalimba and marimba with soft strings, steady and friendly.',
        'Clear, friendly and organised, like a guided tour through a notebook, with energy on each new tab.'),
 '21': ('corrida contra o relógio', 'mascote de passageiro', 120,
        'Brisk cartoon chase: fast ticking woodblock, galloping pizzicato, marimba runs, a triumphant arrival hit when the bus leaves.',
        'Energetic race commentary feel, fast-paced but clear, cheering at the finish.'),
 '22': ('antes × depois (tela dividida)', 'cientista com prancheta', 100,
        'Starts sepia and muted (sparse, slightly melancholic clarinet and pizzicato), then switches at "Depois" to a bright, confident major-key groove with the full series band.',
        'Starts reflective on the "before", then confident and upbeat on the "after".'),
 '23': ('subir de fase (videogame)', 'mascote é o jogador', 112,
        'Acoustic video-game adventure: glockenspiel and marimba playing chiptune-like arpeggios, bouncy bass, level-up jingles, a slightly tense moment at the "valley of death", then a victory fanfare.',
        'Video-game narrator: playful and excited, rising energy as each level is cleared.'),
 '24': ('super-heroínas da ciência (HQ)', 'cientista coadjuvante', 110,
        'Empowering upbeat heroic theme: bright horn melody, driving pizzicato and claps, joyful and confident.',
        'Empowering and joyful, confident comic-book narrator cheering on the heroines.'),
 '25': ('aula relâmpago', 'cientista professor', 100,
        'Light school-day music: a school-bell glockenspiel motif at start and end, playful pizzicato and marimba, chalk-tap percussion, brisk and friendly.',
        'Friendly, lively teacher: clear, encouraging, a bit playful.'),
 '26': ('história de origem ("era uma vez")', 'os dois (mascote e cientista)', 92,
        'Storybook "once upon a time": a music-box glockenspiel intro, soft and magical, growing into the full cheerful series theme when the mascot comes to life.',
        'Storyteller "once upon a time" warmth: tender at the start, then bright and excited as the mascot is born.'),
}

BASE_MUSICA = ('Instrumental for a {dur}-second educational animation about biogas for all ages ({nome} style). {var} '
               'Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, '
               'upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be '
               'present. Steady {bpm} BPM in 4/4, major key, friendly and never busy: it sits under a narrator. '
               'Total length {dur2} seconds. End with the series\' sonic signature: a clean final "ta-da" button — one '
               'tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. '
               'No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.')

DIRECAO = {
 'pt-BR': ('Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun '
           'science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to '
           'follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: {tom}'),
 'en-GB': ('British English, standard Southern British accent. Upbeat, bright and energetic female narrator for a fun '
           'science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear, short natural '
           'pauses at the ellipses and dashes. Pronounce Brazilian names the Brazilian way: São Paulo, Unicamp '
           '(oo-nee-KAMP), FAPESP (fah-PESP), NIPE (NEE-pee). Tone for this episode: {tom}'),
}


def secoes(corpo):
    out, cur, buf = {}, None, []
    for ln in corpo.split('\n'):
        m = re.match(r'^## (.+)$', ln)
        if m:
            if cur: out[cur] = '\n'.join(buf).strip('\n')
            cur, buf = m.group(1).strip(), []
        else:
            buf.append(ln)
    if cur: out[cur] = '\n'.join(buf).strip('\n')
    return out


def pega(sec, prefixo):
    for k, v in sec.items():
        if k.lower().startswith(prefixo.lower()):
            return k, v
    return None, ''


def main():
    for md in sorted(R.glob('[0-9][0-9]-*.md')):
        ep = md.name[:2]
        if ep not in EP:
            continue
        s = md.read_text(encoding='utf-8')
        if '## 1. Roteiro do vídeo' in s:
            print('já no formato:', md.name); continue
        linhas = s.split('\n')
        titulo, meta = linhas[0].strip(), linhas[1].strip()
        sec = secoes('\n'.join(linhas[2:]))
        twist, meta_papel, bpm, var, tom = EP[ep]
        est = re.search(r'estilo \*\*([^*]+)\*\*', meta).group(1)
        cod = est.split()[0].replace('→', '').strip()
        cod_img = 'C' if cod.startswith('B') and '→' not in est else cod[-1] if '→' in est else cod
        if est == 'B → D': cod_img = 'D'
        serie = re.search(r'\*\*(Série[^*]+)\*\*', meta).group(1)
        dur = re.search(r'~(\d+) s', meta).group(1)
        idiomas = ['pt-BR'] + (['en-GB'] if '```narracao en-GB' in s else [])
        nome_est = ' → '.join(NOME[c.strip()] for c in est.split('→')) if '→' in est else NOME[cod] + (' + ' + NOME['C'] if '+ **C**' in meta else '')
        _, ideia = pega(sec, 'Ideia')
        _, estilo = pega(sec, 'Estilo & twist')
        kn, narr = pega(sec, 'Narração')
        ks, story = pega(sec, 'Storyboard')
        ki, imgs = pega(sec, 'Imagens novas')
        _, chec = pega(sec, 'Checagem')
        blocos = re.findall(r'```narracao[^\n]*\n.*?```', narr, flags=re.S)
        extra_narr = re.sub(r'```narracao[^\n]*\n.*?```', '', narr, flags=re.S).strip()
        imgs = re.sub(r'^(Estilo-mestre e regras|Prompt-mestre[^\n]*regras)[^\n]*\n?', '', imgs, flags=re.M).strip()
        pasta = f'entrada/imagens/ep{ep}/'
        story_nome = ks.replace('Storyboard', '').strip()
        out = [titulo, '',
               '| ficha | |', '|---|---|',
               f'| série | {serie} |', f'| duração | ~{dur} s (+ ~4 s de assinatura CP2B) |',
               '| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d\'água CP2B |',
               f'| idiomas | {" + ".join(idiomas)} |',
               f'| estilo visual | **{est}** — {nome_est} |', f'| twist | {twist} |', f'| Metaninho | {meta_papel} |',
               f'| arquivos | imagens `{pasta}` · música `entrada/musica/musica_ep{ep}.mp3` · voz `entrada/narracao/<idioma>/ep{ep}_<idioma>_<voz>_take1.wav` |',
               '', '---', '', '## 1. Roteiro do vídeo (animação)', '',
               '### Ideia', ideia, '', '### Estilo & twist', estilo, '',
               f'### Storyboard {story_nome}'.rstrip(), story, '',
               '### Assinatura CP2B', 'Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", '
               'o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).', '',
               '### Checagem de conteúdo', chec, '', '---', '',
               '## 2. Imagens — prompts', '',
               f'Salvar em **`{pasta}`** com o nome da coluna "arquivo". Prompt-mestre do estilo **{cod_img}** + regras em '
               '[PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). '
               'Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.', '',
               imgs, '', '---', '',
               '## 3. Música — prompt (Lyria 3 Pro)', '',
               f'Salvar como **`entrada/musica/musica_ep{ep}.mp3`**. Anexe uma trilha anterior da série como referência de família sonora '
               '(ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).', '',
               '```musica',
               BASE_MUSICA.format(dur=int(dur) + 4, nome=em_ingles(nome_est), var=var, bpm=bpm, dur2=int(dur) + 6),
               '```', '', '---', '',
               '## 4. Narração — prompt (Gemini TTS)', '',
               'Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede '
               '(`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.', '']
        for lang in idiomas:
            out += [f'**Direção de voz ({lang})**', '', f'```direcao {lang}', DIRECAO[lang].format(tom=tom), '```', '']
        out += ['**Texto da narração**', ''] + [b + '\n' for b in blocos]
        if extra_narr:
            out += [extra_narr, '']
        out += ['**Comando**', '', '```powershell', 'cd "A:\\Pilar-2b\\PILAR-2b Design System\\educa_cp2b\\entrada"',
                f'python tools/tts/gerar_narracao.py {ep} --testar-vozes      # escolher a voz'] + \
               [f'python tools/tts/gerar_narracao.py {ep} --idioma {lang}        # 2 tomadas' for lang in idiomas] + ['```', '']
        md.write_text('\n'.join(out).replace('\n\n\n', '\n\n'), encoding='utf-8')
        print('ok', md.name)


if __name__ == '__main__':
    main()
