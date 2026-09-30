"""Forced-aligns known words to a voiceover, returning when each word is spoken.

Why: Whisper's own word timings drift by up to ~0.5 s, enough to put a cut on
the wrong word. A CTC forced aligner (wav2vec2, trained on LibriSpeech) is told
the exact words and only has to find where they are, which it does to within a
few hundredths of a second.

Called by scripts/transcribe.ts; run standalone with:

    uv run --python 3.11 --with torch==2.5.1 --with torchaudio==2.5.1 --with numpy \\
        scripts/align_words.py voiceover.mp3 words.json out.json

words.json is a list of words, each a list of its spoken parts, e.g.
[["WITH"], ["ES", "QUE", "E", "ONE"]] for "With SQE1". out.json gets one
{"start": s, "end": s} per word, in seconds.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import NamedTuple, Sequence


class Span(NamedTuple):
    """One aligned character: its label and first/last emission frame."""

    label: str
    start: int
    end: int


SEPARATOR = "|"


def to_label_string(words: Sequence[Sequence[str]]) -> str:
    """Flattens spoken parts into the aligner's alphabet: A-Z and ', parts separated by |.

    Parts with no usable letters become "A" so every part still gets a slot and
    the part count stays in step with the words it came from.
    """
    parts = [re.sub(r"[^A-Z']", "", p.upper()) or "A" for word in words for p in word]
    return SEPARATOR.join(parts)


def group_spans(words: Sequence[Sequence[str]], spans: Sequence[Span], seconds_per_frame: float) -> list[dict[str, float]]:
    """Folds per-character spans back into one start/end per original word."""
    parts: list[list[Span]] = [[]]
    for span in spans:
        if span.label == SEPARATOR:
            parts.append([])
        else:
            parts[-1].append(span)

    timings: list[dict[str, float]] = []
    cursor = 0
    for word in words:
        own = [s for part in parts[cursor : cursor + len(word)] for s in part]
        cursor += len(word)
        timings.append(
            {
                "start": round(own[0].start * seconds_per_frame, 3),
                "end": round((own[-1].end + 1) * seconds_per_frame, 3),
            }
        )
    return timings


def align(audio: Path, words: Sequence[Sequence[str]]) -> list[dict[str, float]]:
    """Runs wav2vec2 over the audio and forced-aligns `words` to it."""
    # Imported here so the pure helpers above can be tested without torch installed.
    import torch
    import torchaudio
    import torchaudio.functional as F

    bundle = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
    model = bundle.get_model().eval()
    labels = bundle.get_labels()
    index = {c: i for i, c in enumerate(labels)}

    # Decode with ffmpeg: torchaudio's own decoders depend on optional backends.
    pcm = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", str(audio), "-f", "f32le", "-ac", "1", "-ar", str(bundle.sample_rate), "-"],
        capture_output=True,
        check=True,
    ).stdout
    waveform = torch.frombuffer(bytearray(pcm), dtype=torch.float32).unsqueeze(0)

    with torch.inference_mode():
        emission, _ = model(waveform)
    emission = torch.log_softmax(emission, dim=-1)

    targets = torch.tensor([[index[c] for c in to_label_string(words)]], dtype=torch.int32)
    alignment, scores = F.forced_align(emission, targets, blank=0)
    merged = F.merge_tokens(alignment[0], scores[0].exp())
    spans = [Span(labels[t.token], t.start, t.end) for t in merged]

    seconds_per_frame = waveform.shape[1] / emission.shape[1] / bundle.sample_rate
    return group_spans(words, spans, seconds_per_frame)


def main() -> None:
    audio, words_file, out_file = (Path(a) for a in sys.argv[1:4])
    words = json.loads(words_file.read_text())
    out_file.write_text(json.dumps(align(audio, words)))


if __name__ == "__main__":
    main()
