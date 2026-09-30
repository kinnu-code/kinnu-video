"""Tests for the pure helpers in align_words.py (no torch or model needed).

    uv run --python 3.11 --with pytest pytest scripts/test_align_words.py
"""

from align_words import SEPARATOR, Span, group_spans, to_label_string


def test_label_string_uppercases_strips_and_separates_parts() -> None:
    words = [["with"], ["ES", "QUE", "E", "ONE"], ["doesn't"]]
    assert to_label_string(words) == "WITH|ES|QUE|E|ONE|DOESN'T"


def test_label_string_keeps_a_slot_for_parts_without_letters() -> None:
    assert to_label_string([["1"], ["go"]]) == "A|GO"


def test_group_spans_gives_each_word_its_first_and_last_character() -> None:
    # "HI|ES|QUE" for words [["HI"], ["ES", "QUE"]]: the second word spans two parts.
    spans = [
        Span("H", 10, 11),
        Span("I", 12, 13),
        Span(SEPARATOR, 14, 14),
        Span("E", 20, 20),
        Span("S", 21, 22),
        Span(SEPARATOR, 23, 23),
        Span("Q", 25, 25),
        Span("U", 26, 26),
        Span("E", 27, 29),
    ]
    timings = group_spans([["HI"], ["ES", "QUE"]], spans, seconds_per_frame=0.02)
    assert timings == [{"start": 0.2, "end": 0.28}, {"start": 0.4, "end": 0.6}]
