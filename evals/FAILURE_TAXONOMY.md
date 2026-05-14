# Failure Taxonomy — AI Stack Eval Pipeline
## Version: v1 — Based on real runs against gemma3:4b

---

## F01 — INSTRUCTION_IGNORE
**Description:** Model ignores explicit format instructions (e.g. "one sentence", "one word").
**Example:** Asked "What is the capital of France? One word answer." — model responds with full sentences.
**Frequency:** Low on factual queries, higher on open-ended.
**Detection:** output.split(".").length > 2 when one sentence requested.

---

## F02 — TOPIC_DRIFT
**Description:** Model answers a different question than asked, hallucinating context.
**Example:** Asked "what is LangGraph?" — model described Scottish Premier League instead.
**Frequency:** Medium — occurs on proper nouns and technical terms post training cutoff.
**Detection:** icontains assertion on expected keywords fails.

---

## F03 — VERBOSITY_OVERFLOW
**Description:** Model generates excessive tokens when brevity is requested.
**Example:** Asked "Reply in one sentence: what is Python?" — model generated 5+ sentences with links.
**Frequency:** High on gemma3:4b — model tends toward exhaustive explanations.
**Detection:** output.length > 500 when short response expected.

---

## F04 — FORMAT_NONCOMPLIANCE
**Description:** Model returns markdown when plain text expected.
**Example:** Asked "what is 2+2?" — model returned "**Answer:** 4" with markdown bold.
**Frequency:** Medium — gemma3:4b heavily uses markdown formatting.
**Detection:** output.includes("**") when plain text required.

---

## F05 — FACTUAL_CONFABULATION
**Description:** Model states confidently incorrect facts.
**Example:** LangGraph described as graph neural network instead of LLM orchestration framework.
**Frequency:** Low on common facts, high on recent technical topics.
**Detection:** icontains assertion on required factual keywords fails.

---

## Baseline Pass Rate: 10/10 (100%) — eval-cLd-2026-05-13
## Model: gemma3:4b via Ollama (local)
## Pipeline: FastAPI + Ollama direct inference