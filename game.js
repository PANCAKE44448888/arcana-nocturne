(() => {
  "use strict";

  const SUITS = [
    { name: "spades", symbol: "♠", color: "black" },
    { name: "hearts", symbol: "♥", color: "red" },
    { name: "diamonds", symbol: "♦", color: "red" },
    { name: "clubs", symbol: "♣", color: "black" },
  ];
  const SUIT_FAMILIARS = [
    { name: "Mooncat", fur: "#9785bf", cloak: "#5c4b82", glow: "#d7bbff", eyes: "#fff0a8" },
    { name: "Embercat", fur: "#e28c83", cloak: "#b45d75", glow: "#ffb5a5", eyes: "#fff2a6" },
    { name: "Starseer", fur: "#d9ad68", cloak: "#bd806e", glow: "#ffd98e", eyes: "#b8ffeb" },
    { name: "Mossmage", fur: "#7fb794", cloak: "#4b8c76", glow: "#a6edb8", eyes: "#fff0a6" },
  ];
  const RANKS = [
    [2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"], [7, "7"], [8, "8"],
    [9, "9"], [10, "10"], [11, "J"], [12, "Q"], [13, "K"], [14, "A"],
  ];
  const RANK_NAMES = { 14: "Ace", 13: "King", 12: "Queen", 11: "Jack" };
  const HAND_NAMES = ["High card", "One pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush"];
  const ACTS = ["THE VELVET HAND", "THE MOONLIT MASQUERADE", "THE VOID CATHEDRAL", "THE LAST ORACLE"];
  const state = {
    deck: [], player: [], opponent: [], board: [], mana: 3, playerChips: 1000, opponentChips: 1000,
    pot: 0, street: -1, active: false, handNumber: 0, wins: 0, losses: 0, raiseUsed: false,
    revealed: false, showdownComplete: false, used: new Set(), selected: null, toastTimer: null,
  };
  const $ = (id) => document.getElementById(id);
  const playerCards = $("player-cards");
  const opponentCards = $("opponent-cards");
  const communityCards = $("community-cards");
  const feed = $("feed-message");
  const STREET_NAMES = ["PRE-FLOP", "THE FLOP", "THE TURN", "THE RIVER"];

  function makeDeck() {
    state.deck = [];
    for (const suit of SUITS) for (const [rank, label] of RANKS) state.deck.push({ suit: SUITS.indexOf(suit), rank, label });
    for (let i = state.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
    }
  }

  function draw() { return state.deck.pop(); }
  function formatChips(amount) { return Math.max(0, amount).toLocaleString("en-US"); }
  function cardLabel(card) { return `${card.label} of ${SUITS[card.suit].name}`; }

  function catIllustration(card) {
    const familiar = SUIT_FAMILIARS[card.suit];
    let regalia = "";
    if (card.rank === 11) regalia = `<path d="M15 15 19 5l6 8 7-8 2 11Z" fill="${familiar.glow}" stroke="#f4dfad" stroke-width=".8"/><circle cx="25" cy="12" r="1.5" fill="#fff0bd"/>`;
    else if (card.rank === 12) regalia = `<path d="M18 12a7 7 0 0 1 10-7 7 7 0 1 0 7 9 8 8 0 0 1-17-2Z" fill="${familiar.glow}" stroke="#f4dfad" stroke-width=".7"/>`;
    else if (card.rank === 13) regalia = `<path d="m15 15 2-7 5 5 3-8 4 8 5-5 1 8Z" fill="${familiar.glow}" stroke="#f4dfad" stroke-width=".8"/><circle cx="25" cy="11" r="1.4" fill="#fff0bd"/>`;
    else if (card.rank === 14) regalia = `<path d="m24 3 2 4 4 .5-3 3 .7 4.5-3.7-2.2-3.7 2.2.7-4.5-3-3 4-.5Z" fill="${familiar.glow}" stroke="#fff0bd" stroke-width=".7"/>`;

    return `<svg class="card-cat" viewBox="0 0 48 52" aria-hidden="true">
      <circle class="cat-halo" cx="24" cy="27" r="19" fill="none" stroke="${familiar.glow}" stroke-width="1.2" opacity=".68"/>
      <path d="m8 31-3-2m35 2 3-2M11 16l-2-3m28 3 2-3" stroke="${familiar.glow}" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>
      <path d="M8 50c1-8 7-13 16-13s15 5 16 13Z" fill="${familiar.cloak}" stroke="${familiar.glow}" stroke-width="1.2"/>
      <path d="M17 40q3-3 6 0l1 3 1-3q3-3 6 0l-2 5q-5 3-10 0Z" fill="#ffe4ea" stroke="#fff7ed" stroke-width=".65"/>
      <path d="M11 20 9 9q-.4-3 2-2l9 8q4-2 8 0l9-8q2-1 2 2l-2 12q3 9-4 15-5 5-10 5t-10-5q-7-6-4-16Z" fill="${familiar.fur}" stroke="#fff1df" stroke-width="1.15" stroke-linejoin="round"/>
      <path d="m13 13 5 4m17-4-5 4" fill="none" stroke="${familiar.glow}" stroke-width="1.4" stroke-linecap="round"/>
      ${regalia}
      <ellipse cx="15" cy="29" rx="3.1" ry="1.8" fill="#ffb5c8" opacity=".75"/>
      <ellipse cx="33" cy="29" rx="3.1" ry="1.8" fill="#ffb5c8" opacity=".75"/>
      <ellipse cx="18.5" cy="25" rx="4" ry="4.8" fill="${familiar.eyes}"/>
      <ellipse cx="29.5" cy="25" rx="4" ry="4.8" fill="${familiar.eyes}"/>
      <ellipse cx="19" cy="26" rx="2.1" ry="2.8" fill="#463954"/>
      <ellipse cx="29" cy="26" rx="2.1" ry="2.8" fill="#463954"/>
      <circle class="cat-eye-glint" cx="18" cy="23.5" r="1.3" fill="#fff"/>
      <circle class="cat-eye-glint" cx="28" cy="23.5" r="1.3" fill="#fff"/>
      <path d="M21.5 31q2.5-2.3 5 0l-2.5 2.1Zm2.5 2v1.4m0-1.4q-2.5 2.8-4.5.2m4.5-.2q2.5 2.8 4.5.2" fill="#fff0e8" stroke="#765267" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="24" cy="44" r="2.8" fill="${familiar.glow}" stroke="#fff2db" stroke-width=".8"/>
      <text x="24" y="45.5" text-anchor="middle" font-size="4.2" fill="#fff">${SUITS[card.suit].symbol}</text>
      <path d="m7 22 .7 1.3 1.4.2-1 .9.2 1.4-.3-.2m33-3.6.7 1.3 1.4.2-1 .9.2 1.4-.3-.2" fill="${familiar.glow}"/>
    </svg>`;
  }

  function catBackIllustration() {
    return `<svg class="card-back-cat" viewBox="0 0 48 52" aria-hidden="true">
      <circle cx="24" cy="26" r="18" fill="none" stroke="#c6a9ec" stroke-width="1" opacity=".65"/>
      <path d="M11 20 9 9q-.4-3 2-2l9 8q4-2 8 0l9-8q2-1 2 2l-2 12q3 9-4 15-5 5-10 5t-10-5q-7-6-4-16Z" fill="#9b88c4" stroke="#f1ddff" stroke-width="1.2" stroke-linejoin="round"/>
      <ellipse cx="16" cy="29" rx="3.2" ry="1.8" fill="#ffaec4"/>
      <ellipse cx="32" cy="29" rx="3.2" ry="1.8" fill="#ffaec4"/>
      <ellipse cx="18.5" cy="25" rx="4" ry="4.8" fill="#fff0a8"/>
      <ellipse cx="29.5" cy="25" rx="4" ry="4.8" fill="#fff0a8"/>
      <ellipse cx="19" cy="26" rx="2.1" ry="2.8" fill="#463954"/>
      <ellipse cx="29" cy="26" rx="2.1" ry="2.8" fill="#463954"/>
      <circle cx="18" cy="23.5" r="1.3" fill="#fff"/>
      <circle cx="28" cy="23.5" r="1.3" fill="#fff"/>
      <path d="M21.5 31q2.5-2.3 5 0l-2.5 2.1Zm2.5 2v1.4m0-1.4q-2.5 2.8-4.5.2m4.5-.2q2.5 2.8 4.5.2" fill="#fff0e8" stroke="#765267" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="m24 3 1.5 3 3 .5-2.3 2.2.5 3.2-2.7-1.5-2.7 1.5.5-3.2-2.3-2.2 3-.5Z" fill="#e1c878"/>
    </svg>`;
  }

  function renderCard(card, options = {}) {
    const element = document.createElement("div");
    const revealed = options.revealed && card;
    element.className = `playing-card${revealed && SUITS[card.suit].color === "red" ? " red" : ""}${options.back ? " back" : ""}${options.selected ? " selected" : ""}${options.selectable ? " selectable" : ""}${revealed ? " revealed" : ""}${options.winner ? " winner-glow" : ""}`;
    if (options.back) {
      element.innerHTML = catBackIllustration();
      element.setAttribute("aria-label", "Face-down card with a magical cat");
    } else {
      element.innerHTML = `<span class="card-corner">${card.label}<small>${SUITS[card.suit].symbol}</small></span><span class="card-center" aria-hidden="true">${catIllustration(card)}</span><span class="card-bottom" aria-hidden="true">${SUITS[card.suit].symbol}</span>`;
      element.setAttribute("aria-label", `${cardLabel(card)}, ${SUIT_FAMILIARS[card.suit].name} familiar`);
      if (options.selectable) {
        element.setAttribute("role", "button");
        element.setAttribute("tabindex", "0");
      }
    }
    return element;
  }

  function renderCards() {
    playerCards.replaceChildren();
    state.player.forEach((card, index) => {
      const element = renderCard(card, { selected: state.selected === index, selectable: state.active });
      if (state.active) {
        element.addEventListener("click", () => selectCard(index));
        element.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectCard(index); }
        });
      }
      playerCards.append(element);
    });

    opponentCards.replaceChildren();
    state.opponent.forEach((card, index) => {
      const visible = state.showdownComplete || (state.revealed && index === 0);
      opponentCards.append(renderCard(card, { back: !visible, revealed: visible }));
    });

    communityCards.replaceChildren();
    state.board.forEach((card) => communityCards.append(renderCard(card)));
    $("pot-count").textContent = formatChips(state.pot);
    $("player-chips").textContent = formatChips(state.playerChips);
    $("opponent-chips").textContent = formatChips(state.opponentChips);
  }

  function updateControls() {
    $("mana-count").textContent = state.mana;
    $("fold-button").disabled = !state.active;
    $("raise-button").disabled = !state.active || state.raiseUsed || state.playerChips < 40 || state.opponentChips < 40;
    $("check-button").disabled = false;
    $("check-label").textContent = state.active ? (state.street === 3 ? "SHOWDOWN" : "CHECK") : "DEAL THE HAND";
    $("check-detail").textContent = state.active ? (state.street === 3 ? "Reveal your fate" : "Pass the action") : "The night is young";
    $("round-label").textContent = state.street >= 0 && state.street < 4 ? STREET_NAMES[state.street] : (state.active ? "SHOWDOWN" : "THE TABLE AWAITS");
    const spells = [
      ["oracle", 2], ["cinder", 2], ["runeshift", 2], ["lucky", 1],
    ];
    for (const [name, cost] of spells) {
      const button = $(`spell-${name}`);
      button.classList.toggle("used", state.used.has(name));
      button.disabled = !state.active || state.used.has(name) || state.mana < cost;
    }
    $("wins-count").textContent = String(state.wins % 3).padStart(2, "0");
    $("progress-fill").style.width = `${(state.wins % 3) * 33.333}%`;
    const act = Math.floor(state.wins / 3);
    $("act-name").textContent = ACTS[act % ACTS.length];
    $("act-number").textContent = `ACT ${["I", "II", "III", "IV"][act % 4]}`;
    $("next-gate").textContent = ACTS[(act + 1) % ACTS.length];
    $("hand-number").textContent = String(Math.max(1, state.handNumber)).padStart(2, "0");
    $("footer-hand").textContent = String(Math.max(1, state.handNumber)).padStart(3, "0");
  }

  function say(message) { feed.textContent = message; }
  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove("visible"), 2300);
  }

  function updateHandTotals() {
    state.pot += 40;
    state.playerChips -= 20;
    state.opponentChips -= 20;
  }

  function startHand() {
    if (state.playerChips < 20 || state.opponentChips < 20) {
      state.playerChips = Math.max(state.playerChips, 500);
      state.opponentChips = Math.max(state.opponentChips, 500);
      say("The house restores your stack. The night is not done with you.");
    }
    makeDeck();
    state.player = [draw(), draw()];
    state.opponent = [draw(), draw()];
    state.board = [];
    state.pot = 0;
    state.street = 0;
    state.active = true;
    state.raiseUsed = false;
    state.revealed = false;
    state.showdownComplete = false;
    state.used = new Set();
    state.selected = null;
    state.handNumber++;
    state.mana = Math.min(5, state.mana + (state.handNumber === 1 ? 0 : 1));
    updateHandTotals();
    $("spell-hint").textContent = "Select a spell to weave it into the hand.";
    say(state.handNumber === 1 ? "The ante is in. Lysandra watches you over the rim of her cards." : "A new hand. The ante is in; the cards are listening.");
    $("opponent-mood").textContent = state.wins >= 3 ? "“The stars are changing. So am I.”" : "“The cards are only half the story.”";
    renderCards();
    updateControls();
  }

  function nextStreet() {
    state.raiseUsed = false;
    if (state.street === 0) state.board.push(draw(), draw(), draw());
    else if (state.street < 3) state.board.push(draw());
    state.street++;
    state.mana = Math.min(5, state.mana + 1);
    if (state.street === 4) {
      say("The river is still. One last breath before the truth.");
    } else {
      const lines = [
        "The flop falls. Lysandra studies your face.",
        "A card turns. Somewhere, a candle gutters.",
        "The river. No more cards, no more hiding.",
      ];
      say(lines[state.street - 1]);
    }
    renderCards();
    updateControls();
  }

  function playerAction(action) {
    if (!state.active) { startHand(); return; }
    if (action === "fold") {
      state.opponentChips += state.pot;
      state.losses++;
      state.active = false;
      say("You fold. Lysandra gathers the pot without turning over a card.");
      renderCards();
      updateControls();
      return;
    }
    let response = "Lysandra checks. Her gaze never leaves you.";
    if (action === "raise") {
      state.playerChips -= 40;
      state.pot += 40;
      const callChance = Math.min(.95, .55 + rivalStrength() * .05 + Math.min(state.wins, 8) * .025);
      if (Math.random() > callChance) {
        state.playerChips += state.pot;
        state.wins++;
        state.active = false;
        say("You raise 40. Lysandra considers the wager, then folds into the shadows.");
        if (state.wins % 3 === 0) showToast("The next gate opens. Your legend grows.");
        renderCards();
        updateControls();
        return;
      }
      state.opponentChips -= 40;
      state.pot += 40;
      state.raiseUsed = true;
      response = "You raise 40. Lysandra calls, with the faintest smile.";
    } else if (state.street < 3 && Math.random() < Math.min(.13 + state.wins * .04, .35)) {
      response = ["“A curious wager.” She calls.", "Lysandra matches you in silence.", "She taps the table twice. Call."][Math.floor(Math.random() * 3)];
    }
    if (state.street === 3) { showdown(); return; }
    nextStreet();
    say(`${response} ${feed.textContent}`);
  }

  function combinations(cards, size, start = 0, current = [], all = []) {
    if (current.length === size) { all.push(current.slice()); return all; }
    for (let i = start; i <= cards.length - (size - current.length); i++) {
      current.push(cards[i]);
      combinations(cards, size, i + 1, current, all);
      current.pop();
    }
    return all;
  }

  function evaluateFive(cards) {
    const values = cards.map((card) => card.rank).sort((a, b) => b - a);
    const counts = new Map();
    for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
    const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const flush = cards.every((card) => card.suit === cards[0].suit);
    const unique = [...new Set(values)].sort((a, b) => b - a);
    let straightHigh = 0;
    if (unique.length === 5 && unique[0] - unique[4] === 4) straightHigh = unique[0];
    else if (unique.join(",") === "14,5,4,3,2") straightHigh = 5;

    if (flush && straightHigh) return { rank: 8, values: [straightHigh], cards };
    if (groups[0][1] === 4) return { rank: 7, values: [groups[0][0], groups[1][0]], cards };
    if (groups[0][1] === 3 && groups[1][1] === 2) return { rank: 6, values: [groups[0][0], groups[1][0]], cards };
    if (flush) return { rank: 5, values, cards };
    if (straightHigh) return { rank: 4, values: [straightHigh], cards };
    if (groups[0][1] === 3) return { rank: 3, values: [groups[0][0], ...groups.slice(1).map((group) => group[0]).sort((a, b) => b - a)], cards };
    if (groups[0][1] === 2 && groups[1][1] === 2) return { rank: 2, values: [Math.max(groups[0][0], groups[1][0]), Math.min(groups[0][0], groups[1][0]), groups[2][0]], cards };
    if (groups[0][1] === 2) return { rank: 1, values: [groups[0][0], ...groups.slice(1).map((group) => group[0]).sort((a, b) => b - a)], cards };
    return { rank: 0, values, cards };
  }

  function bestHand(cards) {
    return combinations(cards, 5).map(evaluateFive).reduce((best, hand) => compareScores(hand, best) > 0 ? hand : best);
  }

  function rivalStrength() {
    const cards = [...state.opponent, ...state.board];
    if (cards.length >= 5) return bestHand(cards).rank;
    const ranks = state.opponent.map((card) => card.rank);
    if (ranks[0] === ranks[1]) return 2;
    return ranks.filter((rank) => rank >= 11).length === 2 ? 1 : 0;
  }

  function compareScores(a, b) {
    if (a.rank !== b.rank) return a.rank - b.rank;
    for (let i = 0; i < Math.max(a.values.length, b.values.length); i++) {
      const difference = (a.values[i] || 0) - (b.values[i] || 0);
      if (difference) return difference;
    }
    return 0;
  }

  function valueName(value) { return RANK_NAMES[value] || String(value); }

  function describeHand(hand) {
    const main = hand.values[0];
    let name = HAND_NAMES[hand.rank];
    if (hand.rank === 1) name = `Pair of ${valueName(main)}s`;
    else if (hand.rank === 2) name = `Two pair, ${valueName(main)}s high`;
    else if (hand.rank === 3) name = `Three ${valueName(main)}s`;
    else if (hand.rank === 4) name = `${valueName(main)}-high straight`;
    else if (hand.rank === 6) name = `Full house, ${valueName(main)}s full`;
    else if (hand.rank === 7) name = `Four ${valueName(main)}s`;
    else if (hand.rank === 8) name = `${valueName(main)}-high straight flush`;

    if (hand.rank === 8 && main === 14 && hand.cards.every((card) => card.suit === 1)) return "Royal Flame";
    if (hand.rank === 6 && hand.cards.some((card) => card.suit === 0)) return "Moonlit Full House";
    if (hand.rank === 4 && hand.cards.some((card) => card.suit === 0)) return "Void Straight";
    if (hand.rank === 7 && hand.cards.some((card) => card.suit === 3)) return "Hexed Four of a Kind";
    return name;
  }

  function showdown() {
    const playerBest = bestHand([...state.player, ...state.board]);
    const opponentBest = bestHand([...state.opponent, ...state.board]);
    const comparison = compareScores(playerBest, opponentBest);
    let message;
    if (comparison > 0) {
      state.playerChips += state.pot;
      state.wins++;
      message = `You take the pot with ${describeHand(playerBest)}. Lysandra inclines her head.`;
      if (state.wins % 3 === 0) showToast("The Moonlit Masquerade awaits. Your legend grows.");
    } else if (comparison < 0) {
      state.opponentChips += state.pot;
      state.losses++;
      message = `Lysandra wins with ${describeHand(opponentBest)}. Her cards vanish into shadow.`;
    } else {
      state.playerChips += Math.floor(state.pot / 2);
      state.opponentChips += Math.ceil(state.pot / 2);
      message = "A perfect tie. The pot is split; the night holds its breath.";
    }
    state.active = false;
    state.revealed = true;
    state.showdownComplete = true;
    $("spell-hint").textContent = `Your hand: ${describeHand(playerBest)}.`;
    say(message);
    renderCards();
    updateControls();
  }

  function selectCard(index) {
    state.selected = index;
    renderCards();
    $("spell-hint").textContent = `Selected ${cardLabel(state.player[index])}.`;
  }

  function castSpell(name) {
    if (!state.active || state.used.has(name)) return;
    const costs = { oracle: 2, cinder: 2, runeshift: 2, lucky: 1 };
    const cost = costs[name];
    if (state.mana < cost) { showToast("Not enough mana. The runes remain dark."); return; }
    if ((name === "runeshift" || name === "lucky") && state.selected === null) {
      $("spell-hint").textContent = "Choose one of your cards first.";
      showToast("Select one of your cards before casting.");
      return;
    }
    state.mana -= cost;
    state.used.add(name);
    if (name === "oracle") {
      state.revealed = true;
      say(`The Oracle's Eye opens. Lysandra holds the ${cardLabel(state.opponent[0])}.`);
      $("spell-hint").textContent = "A glimpse of the hand behind the veil.";
    } else if (name === "cinder") {
      const burned = Math.min(35, state.opponentChips);
      state.opponentChips -= burned;
      state.playerChips += burned;
      say(`Cinder Mark takes ${burned} chips from Lysandra's stack. She does not flinch.`);
      $("spell-hint").textContent = `${burned} rival chips claimed by the flame.`;
    } else if (name === "runeshift") {
      const card = state.player[state.selected];
      card.suit = (card.suit + 1) % SUITS.length;
      say(`Runeshift bends your ${card.label} into ${SUITS[card.suit].name}. The pattern changes.`);
      $("spell-hint").textContent = `${card.label} shifted to ${SUITS[card.suit].name}.`;
    } else {
      const replaced = state.player[state.selected];
      state.player[state.selected] = draw();
      say(`Lucky Draw casts away the ${cardLabel(replaced)}. A new omen appears.`);
      $("spell-hint").textContent = `New card: ${cardLabel(state.player[state.selected])}.`;
    }
    renderCards();
    updateControls();
  }

  $("check-button").addEventListener("click", () => playerAction("check"));
  $("fold-button").addEventListener("click", () => playerAction("fold"));
  $("raise-button").addEventListener("click", () => playerAction("raise"));
  document.querySelectorAll(".spell-card").forEach((button) => button.addEventListener("click", () => castSpell(button.dataset.spell)));
  startHand();
})();
