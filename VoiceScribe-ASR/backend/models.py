import re
from collections import Counter

STOP = set("the is a an and of to in for on at it that this with as are was be by or from i you we they he she my our your not but have has had do does will can so if then than there their its am been were would could should about into just".split())

def analyze(text):
    words = re.findall(r"\S+", text)
    sentences = [s for s in re.split(r"[.!?।]+", text) if s.strip()]
    paragraphs = [p for p in text.split("\n") if p.strip()]
    toks = [w.lower() for w in re.findall(r"[\w']+", text) if len(w) > 2]
    kw = Counter(w for w in toks if w not in STOP).most_common(10)
    n = len(words)
    return {
        "words": n,
        "characters": len(text),
        "characters_no_spaces": len(re.sub(r"\s", "", text)),
        "sentences": len(sentences),
        "paragraphs": len(paragraphs),
        "avg_words_per_sentence": round(n / len(sentences), 1) if sentences else 0,
        "reading_time_seconds": round(n / 200 * 60),
        "keywords": [{"word": w, "count": c} for w, c in kw],
    }
