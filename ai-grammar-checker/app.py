"""
AI Grammar Checker - Flask Backend Application
----------------------------------------------
A full-stack AI-powered grammar, spelling, and style checking application
using LanguageTool API with robust offline fallback support.
"""

import os
import re
import logging
from flask import Flask, render_template, request, jsonify
import requests

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__, template_folder="templates", static_folder="static")

# LanguageTool Public REST API
LANGUAGETOOL_API_URL = "https://api.languagetool.org/v2/check"
DEFAULT_TIMEOUT = 8  # seconds


def categorize_rule(rule_id, category_name, message=""):
    """
    Map LanguageTool rule and category information into standardized categories:
    Grammar, Spelling, Punctuation, Capitalization, Commonly Confused Words, or Style.
    """
    rule_id_upper = (rule_id or "").upper()
    cat_upper = (category_name or "").upper()
    msg_lower = (message or "").lower()

    if "SPELL" in cat_upper or "TYPO" in cat_upper or "MORFOLOGIK" in rule_id_upper:
        return "Spelling"
    elif "PUNCTUATION" in cat_upper or "COMMA" in rule_id_upper or "APOSTROPHE" in rule_id_upper:
        return "Punctuation"
    elif "CONFUSED" in cat_upper or "EVERYDAY" in rule_id_upper or "THEIR_THERE" in rule_id_upper:
        return "Commonly Confused Words"
    elif "CASING" in cat_upper or "CAPITALIZATION" in cat_upper or "UPPERCASE" in rule_id_upper:
        return "Capitalization"
    elif "STYLE" in cat_upper or "REDUNDANCY" in cat_upper:
        return "Style"
    elif "GRAMMAR" in cat_upper or "AGREEMENT" in rule_id_upper or "VERB" in rule_id_upper or "ARTICLE" in rule_id_upper:
        return "Grammar"
    elif "vowel sound" in msg_lower or "article" in msg_lower or "agreement" in msg_lower:
        return "Grammar"
    else:
        return "Grammar"


def calculate_writing_stats(text, errors):
    """
    Calculate word count, character count, error distributions,
    and overall accuracy score.
    """
    characters = len(text)
    # Count words using regex
    words_list = re.findall(r"\b\w+[\w'-]*\b", text)
    total_words = len(words_list)

    grammar_count = sum(1 for e in errors if e["category"] in ("Grammar", "Capitalization"))
    spelling_count = sum(1 for e in errors if e["category"] == "Spelling")
    punctuation_count = sum(1 for e in errors if e["category"] == "Punctuation")
    confused_count = sum(1 for e in errors if e["category"] == "Commonly Confused Words")
    style_count = sum(1 for e in errors if e["category"] == "Style")

    total_errors = len(errors)

    # Accuracy percentage calculation
    if total_words == 0:
        accuracy = 100
    elif total_errors == 0:
        accuracy = 100
    else:
        # Error density: 1 error in 10 words is a 10% penalty
        penalty = min(90, (total_errors / max(total_words, 1)) * 40)
        accuracy = max(10, round(100 - penalty))

    return {
        "words": total_words,
        "characters": characters,
        "total_errors": total_errors,
        "grammar_errors": grammar_count,
        "spelling_errors": spelling_count,
        "punctuation_errors": punctuation_count,
        "confused_words_errors": confused_count,
        "style_errors": style_count,
        "accuracy_score": accuracy
    }


def offline_fallback_check(text):
    """
    Guaranteed offline rule-based grammar and spelling checker.
    Used when the LanguageTool server is unreachable or offline during a workshop demo.
    """
    matches = []
    
    # Common test patterns and grammar rules
    patterns = [
        # Example 1: I has -> I have
        {
            "regex": r"\b(I)\s+(has)\b",
            "match_group": 2,
            "replacements": ["have"],
            "category": "Grammar",
            "message": "Possible agreement error: Use the base form 'have' with first-person pronoun 'I'."
        },
        # Example 1: a + vowel sound (e.g. a apple -> an apple)
        {
            "regex": r"\b(a)\s+([aeiouAEIOU]\w*)\b",
            "match_group": 1,
            "replacements": ["an"],
            "category": "Grammar",
            "message": "Use 'an' instead of 'a' before words starting with a vowel sound."
        },
        # Example 2: She/He/It go -> goes
        {
            "regex": r"\b(She|He|It)\s+(go)\b",
            "match_group": 2,
            "replacements": ["goes", "went"],
            "category": "Grammar",
            "message": "The pronoun requires a third-person singular verb (e.g. 'goes')."
        },
        # Example 2: everyday (adverb usage: go to college everyday -> every day)
        {
            "regex": r"\b(everyday)\b(?=[\s\.\,\!\?]|$)",
            "match_group": 1,
            "replacements": ["every day"],
            "category": "Commonly Confused Words",
            "message": "'Everyday' is an adjective meaning ordinary. Use two words 'every day' to mean each day."
        },
        # Example 3: They/We is -> are
        {
            "regex": r"\b(They|We|You)\s+(is)\b",
            "match_group": 2,
            "replacements": ["are", "were"],
            "category": "Grammar",
            "message": "Use a plural verb form ('are') with plural pronouns."
        },
        # Common typo: their / there / they're
        {
            "regex": r"\b(their)\s+(is|are)\b",
            "match_group": 1,
            "replacements": ["there"],
            "category": "Commonly Confused Words",
            "message": "Did you mean 'there' (indicating existence/location) instead of possessive 'their'?"
        },
        # Common spelling typos
        {
            "regex": r"\b(teh)\b",
            "match_group": 1,
            "replacements": ["the"],
            "category": "Spelling",
            "message": "Possible spelling mistake. Did you mean 'the'?"
        },
        {
            "regex": r"\b(recieve)\b",
            "match_group": 1,
            "replacements": ["receive"],
            "category": "Spelling",
            "message": "Spelling mistake: 'i' before 'e' except after 'c'. Did you mean 'receive'?"
        },
        {
            "regex": r"\b(seperate)\b",
            "match_group": 1,
            "replacements": ["separate"],
            "category": "Spelling",
            "message": "Possible spelling mistake. Did you mean 'separate'?"
        },
        # Multiple spaces
        {
            "regex": r"([a-zA-Z0-9])([ \t]{2,})([a-zA-Z0-9])",
            "match_group": 2,
            "replacements": [" "],
            "category": "Punctuation",
            "message": "Multiple consecutive spaces detected. Use a single space."
        },
        # Missing capitalization at start of sentence
        {
            "regex": r"(?:^|[\.\?\!]\s+)([a-z])",
            "match_group": 1,
            "replacements": lambda m: [m.group(1).upper()],
            "category": "Capitalization",
            "message": "Sentences should begin with a capital letter."
        }
    ]

    for p in patterns:
        for match in re.finditer(p["regex"], text, re.IGNORECASE if "a-z" not in p["regex"] else 0):
            group_idx = p["match_group"]
            start = match.start(group_idx)
            end = match.end(group_idx)
            err_text = text[start:end]
            
            if callable(p["replacements"]):
                replacements = p["replacements"](match)
            else:
                # Match casing of original
                if err_text.istitle() and p["replacements"]:
                    replacements = [r.capitalize() for r in p["replacements"]]
                else:
                    replacements = list(p["replacements"])

            # Avoid adding if replacement is identical to text
            if replacements and replacements[0].lower() == err_text.lower() and replacements[0] == err_text:
                continue

            matches.append({
                "offset": start,
                "length": end - start,
                "incorrect_text": err_text,
                "replacements": replacements,
                "category": p["category"],
                "message": p["message"],
                "rule_id": "OFFLINE_RULE_" + p["category"].upper().replace(" ", "_"),
                "context": text[max(0, start - 15):min(len(text), end + 15)]
            })

    # Sort matches by offset and deduplicate overlapping ranges
    matches.sort(key=lambda x: x["offset"])
    filtered = []
    last_end = -1
    for m in matches:
        if m["offset"] >= last_end:
            filtered.append(m)
            last_end = m["offset"] + m["length"]

    return filtered


@app.route("/")
def index():
    """Render the main grammar checker web page."""
    return render_template("index.html")


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint to test backend responsiveness."""
    return jsonify({
        "status": "healthy",
        "service": "AI Grammar Checker API",
        "engine": "LanguageTool v2 + Fallback Engine",
        "version": "1.0.0"
    })


@app.route("/api/check-grammar", methods=["POST"])
def check_grammar():
    """
    Grammar Checking API Endpoint.
    Receives JSON: { "text": "...", "language": "en-US" }
    Returns structured analysis with errors, replacements, context, and statistics.
    """
    try:
        data = request.get_json(silent=True) or {}
        text = data.get("text", "")
        language = data.get("language", "en-US")

        # Validate input
        if not text or not text.strip():
            return jsonify({
                "status": "error",
                "message": "Input text cannot be empty. Please enter or paste text to check."
            }), 400

        engine_used = "LanguageTool Cloud API"
        raw_matches = []

        try:
            # Query official LanguageTool REST API
            response = requests.post(
                LANGUAGETOOL_API_URL,
                data={
                    "text": text,
                    "language": language
                },
                headers={
                    "User-Agent": "AIGrammarChecker/1.0",
                    "Accept": "application/json"
                },
                timeout=DEFAULT_TIMEOUT
            )

            if response.status_code == 200:
                result = response.json()
                raw_matches = result.get("matches", [])
            else:
                logger.warning("LanguageTool returned status code %s. Falling back to offline engine.", response.status_code)
                engine_used = "Offline Fallback Engine"
                raw_matches = []
        except Exception as api_err:
            logger.warning("LanguageTool request failed: %s. Switching to offline engine.", api_err)
            engine_used = "Offline Fallback Engine"
            raw_matches = []

        processed_errors = []

        if engine_used == "LanguageTool Cloud API" and response.status_code == 200:
            for idx, match in enumerate(raw_matches):
                offset = match.get("offset", 0)
                length = match.get("length", 0)
                incorrect_text = text[offset:offset + length]

                rule = match.get("rule", {})
                category_obj = rule.get("category", {})
                cat_name = category_obj.get("name", "Grammar")
                rule_id = rule.get("id", "")
                message = match.get("message", "Possible error detected.")

                category = categorize_rule(rule_id, cat_name, message)
                replacements = [r.get("value") for r in match.get("replacements", [])[:4] if r.get("value")]

                context_obj = match.get("context", {})
                context_str = context_obj.get("text", "")

                processed_errors.append({
                    "id": f"err-{idx}",
                    "offset": offset,
                    "length": length,
                    "incorrect_text": incorrect_text,
                    "replacements": replacements,
                    "suggested_text": replacements[0] if replacements else "",
                    "category": category,
                    "category_id": cat_name,
                    "rule_id": rule_id,
                    "message": message,
                    "context": context_str or text[max(0, offset - 20):min(len(text), offset + length + 20)]
                })
        else:
            # Run offline fallback rules
            fallback_matches = offline_fallback_check(text)
            for idx, fm in enumerate(fallback_matches):
                processed_errors.append({
                    "id": f"err-{idx}",
                    "offset": fm["offset"],
                    "length": fm["length"],
                    "incorrect_text": fm["incorrect_text"],
                    "replacements": fm["replacements"],
                    "suggested_text": fm["replacements"][0] if fm["replacements"] else "",
                    "category": fm["category"],
                    "category_id": fm["category"].upper(),
                    "rule_id": fm["rule_id"],
                    "message": fm["message"],
                    "context": fm["context"]
                })

        # Calculate statistics
        stats = calculate_writing_stats(text, processed_errors)

        return jsonify({
            "status": "success",
            "engine": engine_used,
            "original_text": text,
            "total_errors": len(processed_errors),
            "stats": stats,
            "errors": processed_errors
        }), 200

    except Exception as e:
        logger.error("Unhandled error in check_grammar: %s", str(e), exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Server error occurred while checking grammar: {str(e)}"
        }), 500


if __name__ == "__main__":
    # Host on 127.0.0.1:5000
    port = int(os.environ.get("PORT", 5000))
    print(f"[*] AI Grammar Checker starting on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)
