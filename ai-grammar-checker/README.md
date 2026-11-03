# AI Grammar Checker

> An intelligent, full-stack AI-powered Grammar, Spelling, and Style Checker web application built with Python Flask, LanguageTool NLP engine, and modern HTML5/CSS3/JavaScript.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-3.x-lightgrey?logo=flask)
![LanguageTool](https://img.shields.io/badge/NLP-LanguageTool_v2-brightgreen)
![Status](https://img.shields.io/badge/Status-Fully_Functional-success)

---

## 1. Project Objective

The **AI Grammar Checker** provides real-time grammatical, typographical, and punctuation analysis for English text. It helps students, professionals, and academic writers enhance sentence structure, eliminate agreement errors, and refine overall writing accuracy through single-click or bulk corrections.

Designed for college workshops and technical presentations, the application pairs an attractive, responsive UI with an enterprise-ready microservice backend that queries the official **LanguageTool API** with an embedded **zero-dependency offline rule fallback**.

---

## 2. Key Features

### Text Editor & Live Input
- **Large Text Workspace**: Comfortable multi-line textarea with subtle focus states and custom scrollbar.
- **Live Counter Bar**: Computes character count, word count, and estimated reading time in real time as the user types.
- **Preset Test Chips**: Quick 1-click test buttons for classroom demonstrations.
- **Highlight Overlay**: Interactive visual layer with colored error markers categorized by mistake type.

### Grammar & Error Detection
- **Real-Time Analysis**: Sends text to `/api/check-grammar` without reloading the page.
- **Categorized Detection**:
  - **Grammar & Agreement**: Subject-verb mismatches (*"They is playing cricket"* &rarr; *"They are playing cricket"*), article usage (*"a apple"* &rarr; *"an apple"*).
  - **Spelling Mistakes**: Typos, misspellings, and phonetic inaccuracies.
  - **Punctuation**: Spacing defects, missing commas, quotation mark anomalies.
  - **Commonly Confused Words**: Words like *"everyday"* (adjective) vs. *"every day"* (adverbial phrase).
  - **Capitalization**: Sentence initial capitalization and pronoun casing.

### Interactive Correction Engine
- **Atomic Correction**: Apply individual suggestions one-by-one with automatic position recalculation.
- **Accept All Corrections**: One-click bulk replacement applying suggestions in reverse offset order to maintain index integrity.
- **Explanation Cards**: Detailed grammar rationale and contextual sentence snippets.

### Writing Analysis & Statistics
- **6 Dynamic Statistic Cards**:
  1. Total Words
  2. Total Characters
  3. Grammar Mistakes Count
  4. Spelling Mistakes Count
  5. Punctuation Mistakes Count
  6. Overall Writing Accuracy Score (0-100%) with animated progress bar and quality rating badge (*Perfect*, *Excellent*, *Good*, *Needs Review*).

### Export & Productivity Tools
- **Copy to Clipboard**: Quick copy button with visual toast notification.
- **Download as Text**: Exports corrected document with timestamped `.txt` filename.
- **Clear All**: Resets document and counters.
- **Check Again**: Re-analyzes text on demand.
- **Keyboard Shortcut**: `Ctrl + Enter` (or `Cmd + Enter`) initiates instant grammar analysis.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) | Semantic markup, light blue modern design, interactive DOM realignment |
| **Backend** | Python 3.9+, Flask 3.x | Lightweight RESTful microservice API routing |
| **NLP Engine** | LanguageTool REST API (`api.languagetool.org/v2`) | Morphological analysis, rule matching, dictionary lookup |
| **Fallback Engine** | Custom Python Regular Expression Engine | Zero-dependency offline backup for college lab environments without internet |
| **Icons & Typography**| Font Awesome 6.5, Google Fonts (Plus Jakarta Sans & Inter) | Professional visual aesthetics |

---

## 4. Project Structure

```
ai-grammar-checker/
│
├── app.py                     # Flask application entry point and grammar API routes
├── requirements.txt           # Python package dependencies (Flask, requests)
├── run.bat                    # One-click Windows setup and runner script
├── test_app.py                # Automated unit tests covering all 4 standard test cases
├── README.md                  # Complete documentation and workshop guide
│
├── templates/
│   └── index.html             # Main semantic HTML5 template
│
└── static/
    ├── css/
    │   └── style.css          # Modern light blue & white responsive stylesheet
    └── js/
        └── script.js          # Interactive JavaScript client logic and offset realignment
```

---

## 5. File-by-File Explanation

1. **`app.py`**:
   - Initializes Flask server and registers routes (`/`, `/api/health`, `/api/check-grammar`).
   - Dispatches user text to LanguageTool's public API endpoint with strict timeouts.
   - Automatically falls back to internal rule-based parser if internet/API access is blocked.
   - Formats errors into standardized JSON containing offset, length, error category, message, and replacements.
   - Computes statistical counts and accuracy percentages.

2. **`templates/index.html`**:
   - Modern single-page layout featuring Hero section, interactive two-column workspace, writing statistics grid, feature showcase, and architectural explanation.
   - Fully accessible with ARIA attributes and toast message container.

3. **`static/css/style.css`**:
   - Clean, professional white & light blue design inspired by modern SaaS interfaces.
   - CSS Grid and Flexbox responsive layouts adapted for mobile, tablet, and desktop viewports.
   - Color-coded badges and markers for Grammar (red), Spelling (amber), Punctuation (purple), and Confused Words (sky blue).

4. **`static/js/script.js`**:
   - Handles client interactions without page refresh (AJAX via `fetch`).
   - Implements offset realignment: when a single word correction changes string length, remaining offsets are adjusted dynamically.
   - Coordinates reverse-order bulk replacement for "Accept All".
   - Generates interactive highlight overlays and manages clipboard and file downloads.

5. **`test_app.py`**:
   - Unit tests using Python's `unittest` framework to verify health checks, input validation, and the 4 target test sentences.

6. **`run.bat`**:
   - Automated Windows launcher that checks for Python/`py`, verifies dependencies, opens the browser, and starts the server.

---

## 6. How to Run on Windows

### Quick Start (1-Click)
Double-click `run.bat` or run:
```cmd
run.bat
```

### Manual Command-Line Setup

1. Open PowerShell or Command Prompt.
2. Navigate to the project directory:
   ```cmd
   cd C:\Users\DELL\.gemini\antigravity\scratch\ai-grammar-checker
   ```
3. Install dependencies:
   ```cmd
   py -m pip install -r requirements.txt
   ```
   *(Or `python -m pip install -r requirements.txt`)*
4. Run the backend server:
   ```cmd
   py app.py
   ```
5. Open your web browser and visit:
   ```
   http://127.0.0.1:5000
   ```

---

## 7. Verification & Test Cases

The application includes automated verification for the four benchmark test sentences:

### Test 1: Subject-Verb Agreement & Article
- **Input**: `"I has a apple."`
- **Output Detected**:
  - Mistake 1: `"has"` &rarr; Suggestion: `"have"` (Agreement)
  - Mistake 2: `"a"` &rarr; Suggestion: `"an"` (Article before vowel)
- **Corrected Text**: `"I have an apple."`

### Test 2: Third-Person Singular & Confused Word
- **Input**: `"She go to college everyday."`
- **Output Detected**:
  - Mistake 1: `"go"` &rarr; Suggestion: `"goes"` (Third-person singular verb)
  - Mistake 2: `"everyday"` &rarr; Suggestion: `"every day"` (Adverbial phrase)
- **Corrected Text**: `"She goes to college every day."`

### Test 3: Plural Agreement
- **Input**: `"They is playing cricket."`
- **Output Detected**:
  - Mistake: `"is"` &rarr; Suggestion: `"are"` (Plural verb with "they")
- **Corrected Text**: `"They are playing cricket."`

### Test 4: Error-Free Text
- **Input**: `"I am a student."`
- **Output Detected**:
  - 0 errors reported.
  - Accuracy score: 100%.
  - Celebration state displayed.

To run the automated test suite:
```cmd
py test_app.py
```

---

## 8. College Workshop Demonstration Guide

When demonstrating this project in a seminar or workshop:
1. **Show the Hero & Preset Chips**: Click on the chips under the hero section to show how students can immediately test known linguistic mistakes.
2. **Demonstrate 1-Click Individual Corrections**: Point out the error card explanation, then click **Apply Correction** to show the live textarea update and dynamic stats recalculation.
3. **Demonstrate "Accept All"**: Enter a multi-error paragraph, click **Check Grammar**, then click **Accept All** to showcase reverse-offset bulk resolution.
4. **Show Highlight Mode**: Click **View Highlights** to reveal the interactive visual overlay.
5. **Show Export Options**: Click **Copy Text** (showing toast notification) and **Download** to save the clean text file.
6. **Code Walkthrough**: Explain the Flask REST endpoint in `app.py` and the offset shifting logic in `script.js`.

---

## 9. License

This project is open-source and available under the [MIT License](LICENSE).
