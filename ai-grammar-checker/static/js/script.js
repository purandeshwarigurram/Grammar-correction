/**
 * AI Grammar Checker - Modern Frontend Interactive Script
 * -------------------------------------------------------
 * Handles real-time word/character counts, API communication,
 * intelligent offset realignment during individual and bulk corrections,
 * interactive highlights, statistics updates, and exports.
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element References ---
  const textInput = document.getElementById("textInput");
  const highlightPreview = document.getElementById("highlightPreview");
  const languageSelect = document.getElementById("languageSelect");
  const engineBadge = document.getElementById("engineBadge");

  // Buttons
  const checkGrammarBtn = document.getElementById("checkGrammarBtn");
  const checkAgainBtn = document.getElementById("checkAgainBtn");
  const clearTextBtn = document.getElementById("clearTextBtn");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const copyTextBtn = document.getElementById("copyTextBtn");
  const downloadTextBtn = document.getElementById("downloadTextBtn");
  const acceptAllBtn = document.getElementById("acceptAllBtn");
  const toggleHighlightBtn = document.getElementById("toggleHighlightBtn");

  // Counters in editor footer
  const charCount = document.getElementById("charCount");
  const wordCount = document.getElementById("wordCount");
  const readTime = document.getElementById("readTime");

  // Suggestions panel elements
  const issuesCountBadge = document.getElementById("issuesCountBadge");
  const emptyState = document.getElementById("emptyState");
  const loadingState = document.getElementById("loadingState");
  const perfectState = document.getElementById("perfectState");
  const errorsList = document.getElementById("errorsList");
  const filterTabs = document.querySelectorAll(".filter-tab");

  // Filter Tab Counts
  const tabCountAll = document.getElementById("tabCountAll");
  const tabCountGrammar = document.getElementById("tabCountGrammar");
  const tabCountSpelling = document.getElementById("tabCountSpelling");
  const tabCountPunctuation = document.getElementById("tabCountPunctuation");
  const tabCountConfused = document.getElementById("tabCountConfused");

  // Writing Stats Elements
  const statWords = document.getElementById("statWords");
  const statChars = document.getElementById("statChars");
  const statGrammar = document.getElementById("statGrammar");
  const statSpelling = document.getElementById("statSpelling");
  const statPunctuation = document.getElementById("statPunctuation");
  const statAccuracy = document.getElementById("statAccuracy");
  const accuracyRating = document.getElementById("accuracyRating");
  const accuracyProgressBar = document.getElementById("accuracyProgressBar");

  // Toast Container
  const toastContainer = document.getElementById("toastContainer");

  // --- State Variables ---
  let currentErrors = [];
  let currentFilter = "all";
  let isHighlightActive = false;
  let isAnalyzing = false;

  // ==========================================================================
  // Live Text Metrics Calculation
  // ==========================================================================
  function updateTextMetrics() {
    const text = textInput.value;
    const chars = text.length;

    // Word count regex matching words with hyphens and apostrophes
    const wordsArray = text.match(/\b\w+[\w'-]*\b/g) || [];
    const words = wordsArray.length;

    // Estimated reading time (~200 words per minute)
    const minutes = Math.ceil(words / 200);
    const readingTimeStr = words === 0 ? "0 min read" : `${minutes} min read`;

    // Update editor bar
    charCount.textContent = chars.toLocaleString();
    wordCount.textContent = words.toLocaleString();
    readTime.textContent = readingTimeStr;

    // Update statistics preview if not yet checked
    statChars.textContent = chars.toLocaleString();
    statWords.textContent = words.toLocaleString();

    if (chars === 0) {
      statAccuracy.textContent = "100%";
      accuracyProgressBar.style.width = "100%";
      setAccuracyRating(100);
    }
  }

  function setAccuracyRating(score) {
    if (score >= 90) {
      accuracyRating.textContent = score === 100 ? "Perfect" : "Excellent";
      accuracyRating.className = "accuracy-pill rating-excellent";
      accuracyProgressBar.style.background = "linear-gradient(90deg, #0ea5e9, #10b981)";
    } else if (score >= 75) {
      accuracyRating.textContent = "Good";
      accuracyRating.className = "accuracy-pill rating-good";
      accuracyProgressBar.style.background = "linear-gradient(90deg, #2563eb, #0ea5e9)";
    } else {
      accuracyRating.textContent = "Needs Review";
      accuracyRating.className = "accuracy-pill rating-needs-review";
      accuracyProgressBar.style.background = "linear-gradient(90deg, #f59e0b, #ef4444)";
    }
  }

  // ==========================================================================
  // Toast Notification System
  // ==========================================================================
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconClass = "fa-solid fa-circle-info";
    if (type === "success") iconClass = "fa-solid fa-circle-check";
    if (type === "warning") iconClass = "fa-solid fa-triangle-exclamation";
    if (type === "error") iconClass = "fa-solid fa-circle-xmark";

    toast.innerHTML = `
      <i class="${iconClass}"></i>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(16px)";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ==========================================================================
  // Grammar Checking API Call
  // ==========================================================================
  async function performGrammarCheck() {
    const rawText = textInput.value;
    if (!rawText || !rawText.trim()) {
      showToast("Please enter or paste your text before checking grammar.", "warning");
      textInput.focus();
      return;
    }

    if (isAnalyzing) return;
    isAnalyzing = true;

    // UI Loading state
    setButtonLoading(true);
    showPanelState("loading");

    try {
      const response = await fetch("/api/check-grammar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: rawText,
          language: languageSelect.value || "en-US"
        })
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Failed to analyze grammar.");
      }

      // Update engine badge
      if (data.engine) {
        engineBadge.innerHTML = `<i class="fa-solid fa-bolt"></i> ${escapeHtml(data.engine)}`;
      }

      // Store errors and update UI
      currentErrors = data.errors || [];
      renderErrorsAndStats(data.stats, currentErrors);

      if (currentErrors.length === 0) {
        showPanelState("perfect");
        showToast("Outstanding! No grammar or spelling errors found.", "success");
      } else {
        showPanelState("errors");
        showToast(`Analysis complete: ${currentErrors.length} issue(s) detected.`, "info");
      }

      // Re-generate highlights
      renderHighlights();

    } catch (error) {
      console.error("Grammar check error:", error);
      showPanelState("empty");
      showToast(error.message || "Network error. Please try again.", "error");
    } finally {
      isAnalyzing = false;
      setButtonLoading(false);
    }
  }

  function setButtonLoading(loading) {
    const btnContent = checkGrammarBtn.querySelector(".btn-content");
    const btnLoader = checkGrammarBtn.querySelector(".btn-loader");
    if (loading) {
      btnContent.classList.add("hidden");
      btnLoader.classList.remove("hidden");
      checkGrammarBtn.disabled = true;
    } else {
      btnContent.classList.remove("hidden");
      btnLoader.classList.add("hidden");
      checkGrammarBtn.disabled = false;
    }
  }

  function showPanelState(state) {
    emptyState.classList.add("hidden");
    loadingState.classList.add("hidden");
    perfectState.classList.add("hidden");
    errorsList.classList.add("hidden");

    if (state === "empty") emptyState.classList.remove("hidden");
    if (state === "loading") loadingState.classList.remove("hidden");
    if (state === "perfect") perfectState.classList.remove("hidden");
    if (state === "errors") errorsList.classList.remove("hidden");
  }

  // ==========================================================================
  // Render Errors List & Statistics Cards
  // ==========================================================================
  function renderErrorsAndStats(stats, errors) {
    // 1. Update Statistics Cards
    statWords.textContent = stats.words.toLocaleString();
    statChars.textContent = stats.characters.toLocaleString();
    statGrammar.textContent = stats.grammar_errors.toLocaleString();
    statSpelling.textContent = stats.spelling_errors.toLocaleString();
    statPunctuation.textContent = stats.punctuation_errors.toLocaleString();
    statAccuracy.textContent = `${stats.accuracy_score}%`;
    accuracyProgressBar.style.width = `${stats.accuracy_score}%`;
    setAccuracyRating(stats.accuracy_score);

    // 2. Update Issues Badge
    const issueCount = errors.length;
    issuesCountBadge.textContent = issueCount === 1 ? "1 issue" : `${issueCount} issues`;
    issuesCountBadge.className = issueCount === 0 ? "badge badge-gray" : "badge badge-red";

    // 3. Show/Hide Accept All button
    if (issueCount > 0) {
      acceptAllBtn.classList.remove("hidden");
      acceptAllBtn.innerHTML = `<i class="fa-solid fa-check-double"></i> Accept All (${issueCount})`;
    } else {
      acceptAllBtn.classList.add("hidden");
    }

    // 4. Update Filter Tab Counts
    updateFilterCounts();

    // 5. Render Error Cards
    renderErrorCards();
  }

  function updateFilterCounts() {
    const all = currentErrors.length;
    const grammar = currentErrors.filter(e => e.category === "Grammar" || e.category === "Capitalization").length;
    const spelling = currentErrors.filter(e => e.category === "Spelling").length;
    const punctuation = currentErrors.filter(e => e.category === "Punctuation").length;
    const confused = currentErrors.filter(e => e.category === "Commonly Confused Words").length;

    tabCountAll.textContent = all;
    tabCountGrammar.textContent = grammar;
    tabCountSpelling.textContent = spelling;
    tabCountPunctuation.textContent = punctuation;
    tabCountConfused.textContent = confused;
  }

  function renderErrorCards() {
    errorsList.innerHTML = "";

    const filtered = currentFilter === "all"
      ? currentErrors
      : currentErrors.filter(e => {
          if (currentFilter === "Grammar") return e.category === "Grammar" || e.category === "Capitalization";
          return e.category === currentFilter;
        });

    if (filtered.length === 0 && currentErrors.length > 0) {
      errorsList.innerHTML = `
        <div class="state-card">
          <p class="state-description">No errors found in the <strong>${escapeHtml(currentFilter)}</strong> category.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((err, idx) => {
      const card = document.createElement("div");
      let categoryClass = "card-grammar";
      let badgeClass = "badge-red";

      if (err.category === "Spelling") {
        categoryClass = "card-spelling";
        badgeClass = "badge-amber";
      } else if (err.category === "Punctuation") {
        categoryClass = "card-punctuation";
        badgeClass = "badge-purple";
      } else if (err.category === "Commonly Confused Words") {
        categoryClass = "card-confused";
        badgeClass = "badge-blue";
      }

      card.className = `error-card ${categoryClass}`;
      card.dataset.errorId = err.id;

      const primaryReplacement = err.replacements && err.replacements.length > 0 ? err.replacements[0] : "";

      card.innerHTML = `
        <div class="error-card-header">
          <span class="badge ${badgeClass} error-category-pill">${escapeHtml(err.category)}</span>
          <span class="badge badge-gray">Issue #${idx + 1}</span>
        </div>

        <div class="error-words-row">
          <span class="incorrect-word" title="Original text">${escapeHtml(err.incorrect_text)}</span>
          <i class="fa-solid fa-arrow-right arrow-icon"></i>
          ${
            primaryReplacement
              ? `<span class="suggested-replacement-chip" data-replacement="${escapeHtml(primaryReplacement)}" title="Click to apply correction">
                   <i class="fa-solid fa-check"></i> ${escapeHtml(primaryReplacement)}
                 </span>`
              : `<span class="badge badge-gray">Review context</span>`
          }
        </div>

        <p class="error-explanation">${escapeHtml(err.message)}</p>

        ${
          err.context
            ? `<div class="error-context-box">"${escapeHtml(err.context)}"</div>`
            : ""
        }

        <div class="error-card-actions">
          ${
            primaryReplacement
              ? `<button class="btn btn-sm btn-primary apply-btn" data-error-id="${err.id}">
                   <i class="fa-solid fa-check"></i> Apply Correction
                 </button>`
              : ""
          }
        </div>
      `;

      // Event listener for applying single correction
      const applyBtn = card.querySelector(".apply-btn");
      if (applyBtn) {
        applyBtn.addEventListener("click", () => applySingleCorrection(err.id, primaryReplacement));
      }

      const repChip = card.querySelector(".suggested-replacement-chip");
      if (repChip) {
        repChip.addEventListener("click", () => applySingleCorrection(err.id, primaryReplacement));
      }

      // Hover card highlights corresponding marker
      card.addEventListener("mouseenter", () => {
        const marker = highlightPreview.querySelector(`[data-error-id="${err.id}"]`);
        if (marker) marker.style.outline = "2px solid #2563eb";
      });

      card.addEventListener("mouseleave", () => {
        const marker = highlightPreview.querySelector(`[data-error-id="${err.id}"]`);
        if (marker) marker.style.outline = "none";
      });

      errorsList.appendChild(card);
    });
  }

  // ==========================================================================
  // Applying Corrections (Single and All)
  // ==========================================================================
  function applySingleCorrection(errorId, replacement) {
    const errorIndex = currentErrors.findIndex(e => e.id === errorId);
    if (errorIndex === -1) return;

    const error = currentErrors[errorIndex];
    const originalText = textInput.value;

    // Verify boundary match
    const snippet = originalText.substring(error.offset, error.offset + error.length);

    // Apply substitution to textarea
    const updatedText =
      originalText.substring(0, error.offset) +
      replacement +
      originalText.substring(error.offset + error.length);

    textInput.value = updatedText;
    updateTextMetrics();

    // Calculate offset shift
    const delta = replacement.length - error.length;

    // Shift offsets of subsequent errors
    for (let i = 0; i < currentErrors.length; i++) {
      if (i !== errorIndex && currentErrors[i].offset > error.offset) {
        currentErrors[i].offset += delta;
      }
    }

    // Remove the applied error
    const removed = currentErrors.splice(errorIndex, 1)[0];

    // Show feedback toast
    showToast(`Corrected "${removed.incorrect_text}" → "${replacement}"`, "success");

    // Recalculate stats dynamically
    const wordsArray = updatedText.match(/\b\w+[\w'-]*\b/g) || [];
    const totalWords = wordsArray.length;
    const remainingCount = currentErrors.length;

    const grammarCount = currentErrors.filter(e => e.category === "Grammar" || e.category === "Capitalization").length;
    const spellingCount = currentErrors.filter(e => e.category === "Spelling").length;
    const punctuationCount = currentErrors.filter(e => e.category === "Punctuation").length;

    let accuracy = 100;
    if (totalWords > 0 && remainingCount > 0) {
      const penalty = Math.min(90, (remainingCount / Math.max(totalWords, 1)) * 40);
      accuracy = Math.max(10, Math.round(100 - penalty));
    }

    const dynamicStats = {
      words: totalWords,
      characters: updatedText.length,
      total_errors: remainingCount,
      grammar_errors: grammarCount,
      spelling_errors: spellingCount,
      punctuation_errors: punctuationCount,
      accuracy_score: accuracy
    };

    renderErrorsAndStats(dynamicStats, currentErrors);

    if (currentErrors.length === 0) {
      showPanelState("perfect");
      showToast("All issues resolved! Writing accuracy is now 100%.", "success");
    }

    // Refresh highlight layer
    renderHighlights();
  }

  function applyAllCorrections() {
    if (currentErrors.length === 0) return;

    let text = textInput.value;

    // Sort descending by offset so replacements don't disrupt earlier offsets
    const sortedErrors = [...currentErrors].sort((a, b) => b.offset - a.offset);

    let appliedCount = 0;
    sortedErrors.forEach(err => {
      const rep = err.replacements && err.replacements.length > 0 ? err.replacements[0] : null;
      if (rep !== null) {
        text = text.substring(0, err.offset) + rep + text.substring(err.offset + err.length);
        appliedCount++;
      }
    });

    textInput.value = text;
    updateTextMetrics();

    currentErrors = [];

    const wordsArray = text.match(/\b\w+[\w'-]*\b/g) || [];
    const totalWords = wordsArray.length;

    const perfectStats = {
      words: totalWords,
      characters: text.length,
      total_errors: 0,
      grammar_errors: 0,
      spelling_errors: 0,
      punctuation_errors: 0,
      accuracy_score: 100
    };

    renderErrorsAndStats(perfectStats, []);
    showPanelState("perfect");
    renderHighlights();

    showToast(`Successfully applied ${appliedCount} correction(s)!`, "success");
  }

  // ==========================================================================
  // Interactive Highlight Layer
  // ==========================================================================
  function renderHighlights() {
    const text = textInput.value;
    if (!text || currentErrors.length === 0) {
      highlightPreview.innerHTML = escapeHtml(text);
      return;
    }

    // Sort ascending by offset
    const sorted = [...currentErrors].sort((a, b) => a.offset - b.offset);

    let html = "";
    let lastIndex = 0;

    sorted.forEach(err => {
      if (err.offset >= lastIndex && err.offset + err.length <= text.length) {
        // Plain text before error
        html += escapeHtml(text.substring(lastIndex, err.offset));

        // Category marker class
        let markerClass = "marker-grammar";
        if (err.category === "Spelling") markerClass = "marker-spelling";
        if (err.category === "Punctuation") markerClass = "marker-punctuation";
        if (err.category === "Commonly Confused Words") markerClass = "marker-confused";

        const errWord = text.substring(err.offset, err.offset + err.length);
        const rep = err.replacements && err.replacements.length > 0 ? err.replacements[0] : "";

        html += `<span class="error-marker ${markerClass}" data-error-id="${err.id}" title="${escapeHtml(err.message)} -> ${escapeHtml(rep)}">${escapeHtml(errWord)}</span>`;

        lastIndex = err.offset + err.length;
      }
    });

    // Remainder of text
    if (lastIndex < text.length) {
      html += escapeHtml(text.substring(lastIndex));
    }

    highlightPreview.innerHTML = html;

    // Attach click events to markers in highlight overlay
    const markers = highlightPreview.querySelectorAll(".error-marker");
    markers.forEach(m => {
      m.addEventListener("click", () => {
        const errorId = m.dataset.errorId;
        const targetCard = errorsList.querySelector(`[data-error-id="${errorId}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          targetCard.style.boxShadow = "0 0 0 3px #2563eb";
          setTimeout(() => {
            targetCard.style.boxShadow = "";
          }, 1500);
        }
      });
    });
  }

  function toggleHighlightView() {
    isHighlightActive = !isHighlightActive;
    if (isHighlightActive) {
      highlightPreview.classList.add("active-view");
      highlightPreview.classList.remove("hidden");
      toggleHighlightBtn.classList.add("active");
      toggleHighlightBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Edit Text';
      renderHighlights();
    } else {
      highlightPreview.classList.remove("active-view");
      highlightPreview.classList.add("hidden");
      toggleHighlightBtn.classList.remove("active");
      toggleHighlightBtn.innerHTML = '<i class="fa-solid fa-highlighter"></i> View Highlights';
      textInput.focus();
    }
  }

  // ==========================================================================
  // Copy, Download, and Clear Actions
  // ==========================================================================
  async function copyTextToClipboard() {
    const text = textInput.value;
    if (!text || !text.trim()) {
      showToast("Text editor is empty. Nothing to copy.", "warning");
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        textInput.select();
        document.execCommand("copy");
      }
      showToast("Corrected text copied to clipboard!", "success");
    } catch (err) {
      console.error("Copy failed:", err);
      showToast("Failed to copy text automatically.", "error");
    }
  }

  function downloadTextFile() {
    const text = textInput.value;
    if (!text || !text.trim()) {
      showToast("Text editor is empty. Nothing to download.", "warning");
      return;
    }

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grammar-checked-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Downloaded corrected text file!", "success");
  }

  function clearTextOnly() {
    textInput.value = "";
    updateTextMetrics();
    renderHighlights();
    showToast("Editor text cleared.", "info");
    textInput.focus();
  }

  function clearAll() {
    textInput.value = "";
    currentErrors = [];
    currentFilter = "all";

    filterTabs.forEach(t => t.classList.remove("active"));
    const allTab = document.querySelector('.filter-tab[data-category="all"]');
    if (allTab) allTab.classList.add("active");

    tabCountAll.textContent = "0";
    tabCountGrammar.textContent = "0";
    tabCountSpelling.textContent = "0";
    tabCountPunctuation.textContent = "0";
    tabCountConfused.textContent = "0";

    issuesCountBadge.textContent = "0 issues";
    issuesCountBadge.className = "badge badge-gray";
    acceptAllBtn.classList.add("hidden");

    statWords.textContent = "0";
    statChars.textContent = "0";
    statGrammar.textContent = "0";
    statSpelling.textContent = "0";
    statPunctuation.textContent = "0";
    statAccuracy.textContent = "100%";
    accuracyProgressBar.style.width = "100%";
    setAccuracyRating(100);

    charCount.textContent = "0";
    wordCount.textContent = "0";
    readTime.textContent = "0 min read";

    if (isHighlightActive) {
      toggleHighlightView();
    }
    highlightPreview.innerHTML = "";

    showPanelState("empty");
    showToast("Reset all text and grammar statistics.", "info");
  }

  // ==========================================================================
  // Sample Sentences Chip Buttons (Ideal for Demos & Testing)
  // ==========================================================================
  const chipButtons = document.querySelectorAll(".chip-btn");
  chipButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const sample = btn.dataset.sample;
      if (sample) {
        textInput.value = sample;
        updateTextMetrics();

        // Smooth scroll to checker workspace
        const checkerSection = document.getElementById("checker");
        if (checkerSection) {
          checkerSection.scrollIntoView({ behavior: "smooth" });
        }

        // Trigger grammar check automatically
        setTimeout(() => {
          performGrammarCheck();
        }, 300);
      }
    });
  });

  // ==========================================================================
  // Filter Tabs Event Listeners
  // ==========================================================================
  filterTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      filterTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.dataset.category;
      renderErrorCards();
    });
  });

  // ==========================================================================
  // Event Bindings
  // ==========================================================================
  textInput.addEventListener("input", () => {
    updateTextMetrics();
    if (isHighlightActive) {
      renderHighlights();
    }
  });

  checkGrammarBtn.addEventListener("click", performGrammarCheck);
  checkAgainBtn.addEventListener("click", performGrammarCheck);
  clearTextBtn.addEventListener("click", clearTextOnly);
  clearAllBtn.addEventListener("click", clearAll);
  copyTextBtn.addEventListener("click", copyTextToClipboard);
  downloadTextBtn.addEventListener("click", downloadTextFile);
  acceptAllBtn.addEventListener("click", applyAllCorrections);
  toggleHighlightBtn.addEventListener("click", toggleHighlightView);

  // Keyboard shortcut: Ctrl + Enter to check grammar
  textInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      performGrammarCheck();
    }
  });

  // Smooth scrolling for navigation links
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // Initial calculation
  updateTextMetrics();
});
