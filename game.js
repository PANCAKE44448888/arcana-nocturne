(() => {
  "use strict";

  const SUITS = [
    { name: "spades", symbol: "♠", color: "black" },
    { name: "hearts", symbol: "♥", color: "red" },
    { name: "diamonds", symbol: "♦", color: "red" },
    { name: "clubs", symbol: "♣", color: "black" },
  ];
  const SUIT_FAMILIARS = [
    { name: "Mooncat", fur: "#51466f", cloak: "#302945", glow: "#aa95db", eyes: "#e1caff" },
    { name: "Embercat", fur: "#914a43", cloak: "#512d35", glow: "#e58b71", eyes: "#ffe2a0" },
    { name: "Starseer", fur: "#927547", cloak: "#514632", glow: "#d8b76e", eyes: "#a9f0e2" },
    { name: "Mossmage", fur: "#43735d", cloak: "#29483e", glow: "#81bd8e", eyes: "#e9df99" },
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
      <circle class="cat-halo" cx="24" cy="27" r="18" fill="none" stroke="${familiar.glow}" stroke-width=".8" opacity=".55"/>
      <path d="M9 35 5 32m34 3 4-3M11 15l-2-3m28 3 2-3" stroke="${familiar.glow}" stroke-width="1" opacity=".8"/>
      <path d="M9 50c2-9 7-14 15-14s13 5 15 14Z" fill="${familiar.cloak}" stroke="${familiar.glow}" stroke-width="1"/>
      <path d="M18 39 24 46l6-7" fill="none" stroke="${familiar.glow}" stroke-width="1"/>
      <path d="M11 20 8 8l12 7q4-3 8 0l12-7-3 13q3 10-5 16-8 6-16 0-8-6-5-17Z" fill="${familiar.fur}" stroke="#f0ddbd" stroke-width="1"/>
      <path d="m12 16-1-5 6 4m19 1 1-5-6 4" fill="none" stroke="${familiar.glow}" stroke-width="1.2" opacity=".8"/>
      ${regalia}
      <path d="M15 24q4-4 8 0-4 5-8 0Zm10 0q4-4 8 0-4 5-8 0Z" fill="${familiar.eyes}"/>
      <circle cx="19" cy="24" r="1.1" fill="#282333"/><circle cx="29" cy="24" r="1.1" fill="#282333"/>
      <path d="m22 29 2-1.5 2 1.5-2 1.7Zm2 2v1.5m0-1.5q-2.5 3-5 0m5 0q2.5 3 5 0" fill="none" stroke="#f4dfcb" stroke-width=".85" stroke-linecap="round"/>
      <circle cx="24" cy="44" r="2.4" fill="${familiar.glow}" stroke="#f4dfbd" stroke-width=".7"/>
      <text x="24" y="46" text-anchor="middle" font-size="4" fill="#fff4d6">${SUITS[card.suit].symbol}</text>
    </svg>`;
  }

  function catBackIllustration() {
    return `<svg class="card-back-cat" viewBox="0 0 48 52" aria-hidden="true">
      <circle cx="24" cy="26" r="18" fill="none" stroke="#c6a9ec" stroke-width="1" opacity=".65"/>
      <path d="M11 21 9 9l11 7q4-3 8 0l11-7-2 13q3 9-5 15-8 6-16 0-8-6-5-16Z" fill="#71628d" stroke="#e2cefb" stroke-width="1.2"/>
      <path d="M16 25q3-3 6 0-3 4-6 0Zm10 0q3-3 6 0-3 4-6 0Z" fill="#f3d996"/>
      <path d="m22 30 2-1.5 2 1.5-2 1.5Zm2 2v2m0-2q-2 2.5-4 0m4 0q2 2.5 4 0" fill="none" stroke="#f4e6d2" stroke-width="1" stroke-linecap="round"/>
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
  renderCards();
  updateControls();
})();
