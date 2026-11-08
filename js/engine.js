// Core Illegal Chess Board Engine, King Immunity, Drag & Drop, Bot AI & P2P Sync
window.PIECE_URLS = {
  w: {
    p: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wp.png',
    n: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png',
    b: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png',
    r: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png',
    q: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png',
    k: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png'
  },
  b: {
    p: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bp.png',
    n: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png',
    b: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png',
    r: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png',
    q: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png',
    k: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png'
  }
};

window.Game = {
  board: [],
  sqMeta: [],
  turn: 'w',
  mana: { w: 3, b: 3 },
  hands: { w: [], b: [] },
  captured: { w: [], b: [] },
  selectedSq: null,
  legalMoves: [],
  activeCard: null,
  spellFirstTarget: null,
  extraTurnPending: false,
  manaSurgeUsedThisTurn: false,
  mode: 'bot', // 'bot' | 'local' | 'p2p'
  botLevel: 'archmage',
  myColor: 'w',
  peer: null,
  conn: null,
  gameOver: false,
  lastMove: null,

  init() {
    this.setupNewGame();
    this.bindUI();
    this.setupDragAndDrop();
  },

  setupNewGame() {
    this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    this.sqMeta = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => ({ wall: 0, mine: null, trap: null })));
    const backRank = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let c = 0; c < 8; c++) {
      this.board[0][c] = { color: 'b', type: backRank[c], shield: 0, frozen: 0, poison: 0, mark: 0, ghost: false };
      this.board[1][c] = { color: 'b', type: 'p', shield: 0, frozen: 0, poison: 0, mark: 0, ghost: false };
      this.board[6][c] = { color: 'w', type: 'p', shield: 0, frozen: 0, poison: 0, mark: 0, ghost: false };
      this.board[7][c] = { color: 'w', type: backRank[c], shield: 0, frozen: 0, poison: 0, mark: 0, ghost: false };
    }
    this.turn = 'w';
    this.mana = { w: 4, b: 4 };
    this.captured = { w: [], b: [] };
    this.hands = { w: [], b: [] };
    for (let i = 0; i < 4; i++) {
      this.hands.w.push(window.drawWeightedAbility(this.hands.w));
      this.hands.b.push(window.drawWeightedAbility(this.hands.b));
    }
    this.selectedSq = null;
    this.legalMoves = [];
    this.activeCard = null;
    this.spellFirstTarget = null;
    this.extraTurnPending = false;
    this.manaSurgeUsedThisTurn = false;
    this.gameOver = false;
    this.lastMove = null;
    const logEl = document.getElementById('move-log');
    if (logEl) logEl.innerHTML = '';
    this.logEvent('Match started. Capture the enemy King to win!');
    this.renderAll();
  },

  logEvent(msg) {
    const logEl = document.getElementById('move-log');
    if (!logEl) return;
    const row = document.createElement('div');
    row.style.padding = '2px 0';
    row.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
    row.textContent = msg;
    logEl.prepend(row);
  },

  getLegalMovesFor(r, c) {
    const p = this.board[r][c];
    if (!p || p.frozen > 0) return [];
    const moves = [];
    const addSq = (nr, nc, canCap = true, mustCap = false) => {
      if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return false;
      if (this.sqMeta[nr][nc].wall > 0) return false;
      const occ = this.board[nr][nc];
      if (!occ) {
        if (!mustCap) moves.push({ r: nr, c: nc, capture: false });
        return true;
      } else {
        if (canCap && occ.color !== p.color && occ.shield <= 0) {
          moves.push({ r: nr, c: nc, capture: true });
        }
        return false;
      }
    };

    const dir = p.color === 'w' ? -1 : 1;
    if (p.type === 'p') {
      if (addSq(r + dir, c, false, false)) {
        const startRank = p.color === 'w' ? 6 : 1;
        if (r === startRank) addSq(r + dir * 2, c, false, false);
      }
      addSq(r + dir, c - 1, true, true);
      addSq(r + dir, c + 1, true, true);
    }

    const slideDirs = {
      r: [[-1,0],[1,0],[0,-1],[0,1]],
      b: [[-1,-1],[-1,1],[1,-1],[1,1]],
      q: [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]
    };

    if (slideDirs[p.type]) {
      for (const [dr, dc] of slideDirs[p.type]) {
        for (let step = 1; step < 8; step++) {
          if (!addSq(r + dr * step, c + dc * step)) break;
        }
      }
    }

    if (p.type === 'n' || p.ghost) {
      const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of jumps) addSq(r + dr, c + dc);
    }

    if (p.type === 'k') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) addSq(r + dr, c + dc);
        }
      }
    }
    return moves;
  },

  executeMove(fr, fc, tr, tc) {
    if (this.gameOver) return;
    const moving = this.board[fr][fc];
    const target = this.board[tr][tc];
    if (!moving) return;

    if (target) {
      this.captured[this.turn].push(target.type);
      this.mana[this.turn] = Math.min(10, this.mana[this.turn] + 2);
      // Curing poison/mark on capture
      moving.poison = 0;
      moving.mark = 0;
      window.SoundFX.play('capture');
      if (target.type === 'k') {
        this.board[tr][tc] = moving;
        this.board[fr][fc] = null;
        this.gameOver = true;
        window.SoundFX.play('victory');
        this.logEvent((this.turn === 'w' ? 'White' : 'Black') + ' captured the Enemy King! Victory!');
        this.renderAll();
        return;
      }
    } else {
      window.SoundFX.play('move');
    }

    this.board[tr][tc] = moving;
    this.board[fr][fc] = null;
    this.lastMove = { fr, fc, tr, tc };

    // Pawn promotion
    if (moving.type === 'p' && (tr === 0 || tr === 7)) {
      moving.type = 'q';
      this.logEvent('Pawn promoted to Queen!');
    }

    // Trigger Square Traps / Mines (WITH KING IMMUNITY)
    const meta = this.sqMeta[tr][tc];
    if (meta.mine) {
      meta.mine = null;
      if (moving.type === 'k') {
        this.logEvent('Royal Immunity: King safely defused the Hidden Mine!');
      } else if (moving.shield > 0) {
        moving.shield = 0;
        this.logEvent('Divine Shield absorbed the Hidden Mine!');
      } else {
        this.board[tr][tc] = null;
        this.logEvent('BOOM! Hidden Mine destroyed ' + moving.type.toUpperCase() + '!');
      }
    }
    if (meta.trap && this.board[tr][tc]) {
      meta.trap = null;
      if (moving.type !== 'k') {
        moving.frozen = Math.max(moving.frozen, 2);
        this.logEvent('Bear Trap snapped! Piece frozen for 2 turns.');
      }
    }

    this.selectedSq = null;
    this.legalMoves = [];

    if (this.extraTurnPending) {
      this.extraTurnPending = false;
      this.logEvent('Chrono Time Warp active: take your bonus board move!');
      this.renderAll();
      return;
    }

    this.endTurn();
  },

  endTurn() {
    const nextTurn = this.turn === 'w' ? 'b' : 'w';
    this.turn = nextTurn;
    this.manaSurgeUsedThisTurn = false;
    this.mana[nextTurn] = Math.min(10, this.mana[nextTurn] + 1);
    if (this.hands[nextTurn].length < 5) {
      this.hands[nextTurn].push(window.drawWeightedAbility(this.hands[nextTurn]));
    }

    // Tick statuses for the player starting their turn
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.sqMeta[r][c].wall > 0) this.sqMeta[r][c].wall--;
        const p = this.board[r][c];
        if (p && p.color === nextTurn) {
          if (p.shield > 0) p.shield--;
          if (p.frozen > 0) p.frozen--;
          if (p.poison > 0 && p.type !== 'k') {
            p.poison--;
            if (p.poison === 0) {
              this.board[r][c] = null;
              this.logEvent('Poison claimed ' + p.type.toUpperCase() + '!');
              continue;
            }
          }
          if (p.mark > 0 && p.type !== 'k') {
            p.mark--;
            if (p.mark === 0) {
              this.board[r][c] = null;
              this.logEvent('Assassin Mark executed ' + p.type.toUpperCase() + '!');
            }
          }
        }
      }
    }

    this.renderAll();

    if (this.mode === 'bot' && this.turn === 'b' && !this.gameOver) {
      setTimeout(() => this.runBotTurn(), 480);
    }
  },

  // Spell Casting (Strict King Immunity enforced)
  canTargetWithCard(card, r, c) {
    const p = this.board[r][c];
    const meta = this.sqMeta[r][c];
    const myCol = this.turn;
    const enCol = myCol === 'w' ? 'b' : 'w';

    switch (card.mode) {
      case 'own_pawn': return p && p.color === myCol && p.type === 'p';
      case 'own_piece': return p && p.color === myCol;
      case 'own_minor': return p && p.color === myCol && (p.type === 'n' || p.type === 'b');
      case 'empty_sq': return !p && meta.wall === 0;
      case 'own_pawn_rank': {
        const rank = myCol === 'w' ? 6 : 1;
        return r === rank && !p && meta.wall === 0;
      }
      case 'empty_back_rank': {
        const rank = myCol === 'w' ? 7 : 0;
        return r === rank && !p && meta.wall === 0;
      }
      case 'own_to_empty_half': {
        if (!this.spellFirstTarget) return p && p.color === myCol;
        const validHalf = myCol === 'w' ? r >= 4 : r <= 3;
        return !p && meta.wall === 0 && validHalf;
      }
      case 'two_own': return p && p.color === myCol;
      // Strict King Immunity on all offensive spells
      case 'enemy_non_king': return p && p.color === enCol && p.type !== 'k' && p.shield <= 0;
      case 'enemy_non_royal': return p && p.color === enCol && p.type !== 'k' && p.type !== 'q' && p.shield <= 0;
      case 'enemy_non_royal_fwd': return p && p.color === enCol && p.type !== 'k' && p.type !== 'q' && p.shield <= 0;
      case 'enemy_pawn': return p && p.color === enCol && p.type === 'p' && p.shield <= 0;
      case 'enemy_minor': return p && p.color === enCol && ['n','b','r'].includes(p.type) && p.shield <= 0;
      case 'enemy_minor_advanced': {
        const enemyBackRank = enCol === 'w' ? 7 : 0;
        return p && p.color === enCol && ['p','n','b'].includes(p.type) && r !== enemyBackRank && p.shield <= 0;
      }
      default: return false;
    }
  },

  triggerCard(card) {
    if (this.gameOver) return;
    if (this.mana[this.turn] < card.cost) return;

    if (card.mode === 'instant') {
      if (card.id === 'mana' && this.manaSurgeUsedThisTurn) {
        this.logEvent('Mana Surge can only be cast once per turn!');
        return;
      }
      this.consumeCard(card);
      if (card.id === 'mana') {
        this.manaSurgeUsedThisTurn = true;
        this.mana[this.turn] = Math.min(10, this.mana[this.turn] + 4);
        this.logEvent('Mana Surge: +4 Mana crystals!');
      } else if (card.id === 'fog') {
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            const p = this.board[r][c];
            if (p && p.color === this.turn && p.type !== 'k') p.shield = Math.max(p.shield, 1);
          }
        }
        this.logEvent('Fog of War: Friendly army cloaked for 1 turn!');
      } else if (card.id === 'timewarp') {
        this.extraTurnPending = true;
        this.logEvent('Chrono Time Warp: You gain an extra move this turn!');
      } else if (card.id === 'cataclysm') {
        this.castGrandCataclysm();
      }
      window.SoundFX.play('spell');
      this.renderAll();
      return;
    }

    if (this.activeCard && this.activeCard.uid === card.uid) {
      this.activeCard = null;
      this.spellFirstTarget = null;
    } else {
      this.activeCard = card;
      this.spellFirstTarget = null;
    }
    this.renderAll();
  },

  castGrandCataclysm() {
    const myCol = this.turn;
    const enCol = myCol === 'w' ? 'b' : 'w';
    const enemyTargets = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === enCol && p.type !== 'k') {
          enemyTargets.push({ r, c, p });
        } else if (p && p.color === myCol && p.type === 'k') {
          p.shield = Math.max(p.shield, 2);
        }
      }
    }
    // Shuffle and obliterate up to 2 non-King enemy pieces
    enemyTargets.sort(() => Math.random() - 0.5);
    let destroyed = 0;
    for (const item of enemyTargets) {
      if (destroyed < 2 && item.p.shield <= 0) {
        this.board[item.r][item.c] = null;
        destroyed++;
      } else {
        item.p.frozen = Math.max(item.p.frozen, 1);
      }
    }
    // Summon Royal Rook or Queen on back rank
    const backRank = myCol === 'w' ? 7 : 0;
    for (let c = 0; c < 8; c++) {
      if (!this.board[backRank][c]) {
        this.board[backRank][c] = { color: myCol, type: 'q', shield: 1, frozen: 0, poison: 0, mark: 0, ghost: false };
        break;
      }
    }
    this.logEvent('GRAND CATACLYSM (10 Mana)! 2 enemy units obliterated, army frozen, Royal Queen summoned!');
  },

  applyTargetedCard(r, c) {
    const card = this.activeCard;
    if (!card || !this.canTargetWithCard(card, r, c)) return;

    const myCol = this.turn;
    const dir = myCol === 'w' ? -1 : 1;
    const p = this.board[r][c];

    if (card.mode === 'two_own' || card.mode === 'own_to_empty_half') {
      if (!this.spellFirstTarget) {
        this.spellFirstTarget = { r, c };
        this.renderAll();
        return;
      }
      const f = this.spellFirstTarget;
      if (card.id === 'swap') {
        const tmp = this.board[f.r][f.c];
        this.board[f.r][f.c] = this.board[r][c];
        this.board[r][c] = tmp;
        this.logEvent('Soul Swap: Swapped two friendly pieces!');
      } else if (card.id === 'teleport') {
        this.board[r][c] = this.board[f.r][f.c];
        this.board[f.r][f.c] = null;
        this.logEvent('Phase Teleport complete!');
      }
      this.consumeCard(card);
      window.SoundFX.play('spell');
      this.renderAll();
      return;
    }

    switch (card.id) {
      case 'sprint': {
        let destR = r;
        if (r + dir >= 0 && r + dir <= 7 && !this.board[r + dir][c]) destR = r + dir;
        if (destR !== r && r + dir * 2 >= 0 && r + dir * 2 <= 7 && !this.board[r + dir * 2][c]) destR = r + dir * 2;
        if (destR === r) return;
        this.board[destR][c] = p;
        this.board[r][c] = null;
        break;
      }
      case 'retreat': {
        const backR = r - dir;
        if (backR < 0 || backR > 7 || this.board[backR][c]) return;
        this.board[backR][c] = p;
        this.board[r][c] = null;
        break;
      }
      case 'shift': {
        const sc = c > 0 && !this.board[r][c - 1] ? c - 1 : (c < 7 && !this.board[r][c + 1] ? c + 1 : -1);
        if (sc === -1) return;
        this.board[r][sc] = p;
        this.board[r][c] = null;
        break;
      }
      case 'wall': this.sqMeta[r][c].wall = 3; break;
      case 'mine': this.sqMeta[r][c].mine = myCol; break;
      case 'trap': this.sqMeta[r][c].trap = myCol; break;
      case 'purify':
        p.frozen = 0; p.poison = 0; p.mark = 0; p.shield = Math.max(p.shield, 1);
        break;
      case 'shield': p.shield = Math.max(p.shield, 2); break;
      case 'smoke':
        p.shield = Math.max(p.shield, 1);
        if (c > 0 && this.board[r][c - 1]?.color === myCol) this.board[r][c - 1].shield = Math.max(this.board[r][c - 1].shield, 1);
        break;
      case 'ghost': p.ghost = true; break;
      case 'sniper':
      case 'ram':
      case 'lightning':
        this.board[r][c] = null;
        break;
      case 'meteor':
        this.board[r][c] = null;
        this.sqMeta[r][c].wall = 2;
        break;
      case 'poison': p.poison = 3; break;
      case 'mark': p.mark = 3; break;
      case 'freeze': p.frozen = 2; break;
      case 'magnet': {
        const pullR = r - dir;
        if (pullR >= 0 && pullR <= 7 && !this.board[pullR][c]) {
          this.board[pullR][c] = p;
          this.board[r][c] = null;
        }
        break;
      }
      case 'infantry':
        this.board[r][c] = { color: myCol, type: 'p', shield: 0, frozen: 0, poison: 0, mark: 0, ghost: false };
        break;
      case 'harvest':
        this.board[r][c] = null;
        this.mana[myCol] = Math.min(10, this.mana[myCol] + 3);
        if (this.hands[myCol].length < 5) this.hands[myCol].push(window.drawWeightedAbility(this.hands[myCol]));
        break;
      case 'necro':
        this.board[r][c] = { color: myCol, type: 'r', shield: 0, frozen: 0, poison: 0, mark: 0, ghost: false };
        break;
      case 'recruit':
        p.color = myCol;
        p.frozen = 1;
        break;
      case 'poly':
        p.type = 'p';
        break;
      case 'valkyrie':
        p.type = 'n';
        break;
      case 'clone': {
        const adj = [[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of adj) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7 && !this.board[nr][nc]) {
            this.board[nr][nc] = { ...p, shield: 0 };
            break;
          }
        }
        break;
      }
    }

    this.logEvent((myCol === 'w' ? 'White' : 'Black') + ' cast ' + card.name + '!');
    this.consumeCard(card);
    window.SoundFX.play('spell');
    this.renderAll();
  },

  consumeCard(card) {
    this.mana[this.turn] -= card.cost;
    this.hands[this.turn] = this.hands[this.turn].filter(c => c.uid !== card.uid);
    this.activeCard = null;
    this.spellFirstTarget = null;
  },

  rerollHandCard() {
    if (this.mana[this.turn] < 1 || this.hands[this.turn].length === 0) return;
    this.mana[this.turn] -= 1;
    this.hands[this.turn].pop();
    this.hands[this.turn].push(window.drawWeightedAbility(this.hands[this.turn]));
    window.SoundFX.play('spell');
    this.renderAll();
  },

  runBotTurn() {
    if (this.gameOver || this.turn !== 'b') return;
    // Try casting 1 affordable spell
    const affordable = this.hands.b.filter(c => c.cost <= this.mana.b);
    if (affordable.length > 0 && Math.random() < 0.7) {
      const card = affordable[0];
      if (card.mode === 'instant') {
        this.triggerCard(card);
      } else {
        for (let r = 0; r < 8; r++) {
          let castDone = false;
          for (let c = 0; c < 8; c++) {
            if (this.canTargetWithCard(card, r, c)) {
              this.activeCard = card;
              this.applyTargetedCard(r, c);
              castDone = true;
              break;
            }
          }
          if (castDone) break;
        }
      }
    }

    // Standard chess move
    const allMoves = [];
    const vals = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === 'b') {
          const moves = this.getLegalMovesFor(r, c);
          moves.forEach(m => {
            const target = this.board[m.r][m.c];
            const score = target ? vals[target.type] * 10 : Math.random() * 2;
            allMoves.push({ fr: r, fc: c, tr: m.r, tc: m.c, score });
          });
        }
      }
    }
    if (allMoves.length > 0) {
      allMoves.sort((a, b) => b.score - a.score);
      const best = allMoves[0];
      this.executeMove(best.fr, best.fc, best.tr, best.tc);
    } else {
      this.endTurn();
    }
  },

  setupDragAndDrop() {
    let dragging = null;
    let ghostEl = null;

    const boardEl = document.getElementById('chessboard');
    boardEl.addEventListener('pointerdown', (e) => {
      if (this.gameOver) return;
      const sqEl = e.target.closest('.sq');
      if (!sqEl) return;
      const r = Number(sqEl.dataset.r);
      const c = Number(sqEl.dataset.c);

      if (this.activeCard) {
        this.applyTargetedCard(r, c);
        return;
      }

      const existingMove = this.legalMoves.find(m => m.r === r && m.c === c);
      if (this.selectedSq && existingMove) {
        this.executeMove(this.selectedSq.r, this.selectedSq.c, r, c);
        return;
      }

      const p = this.board[r][c];
      if (p && p.color === this.turn && p.frozen <= 0) {
        this.selectedSq = { r, c };
        this.legalMoves = this.getLegalMovesFor(r, c);
        this.renderBoard();

        dragging = { r, c };
        ghostEl = document.createElement('img');
        ghostEl.src = window.PIECE_URLS[p.color][p.type];
        ghostEl.className = 'floating-drag-piece';
        ghostEl.style.left = e.clientX + 'px';
        ghostEl.style.top = e.clientY + 'px';
        document.body.appendChild(ghostEl);
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!ghostEl) return;
      ghostEl.style.left = e.clientX + 'px';
      ghostEl.style.top = e.clientY + 'px';
    });

    window.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      if (ghostEl) {
        ghostEl.remove();
        ghostEl = null;
      }
      const elUnder = document.elementFromPoint(e.clientX, e.clientY);
      const targetSq = elUnder ? elUnder.closest('.sq') : null;
      if (targetSq) {
        const tr = Number(targetSq.dataset.r);
        const tc = Number(targetSq.dataset.c);
        const valid = this.legalMoves.find(m => m.r === tr && m.c === tc);
        if (valid) {
          this.executeMove(dragging.r, dragging.c, tr, tc);
        }
      }
      dragging = null;
    });
  },

  bindUI() {
    document.getElementById('btn-new-game').onclick = () => this.setupNewGame();
    document.getElementById('btn-reroll').onclick = () => this.rerollHandCard();
    document.getElementById('btn-spellbook').onclick = () => {
      document.getElementById('spellbook-modal').style.display = 'flex';
      this.renderSpellbook();
    };
    document.getElementById('btn-close-spellbook').onclick = () => {
      document.getElementById('spellbook-modal').style.display = 'none';
    };
  },

  renderSpellbook() {
    const grid = document.getElementById('spellbook-grid');
    if (!grid) return;
    grid.innerHTML = window.ABILITIES.map(a => `
      <div class="ability-card rarity-${a.rarity}" style="cursor:default">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong style="font-size:12px">${a.name}</strong>
          <span class="rarity-tag tag-${a.rarity}">${a.rarity} • ${a.dropChance}%</span>
        </div>
        <div style="font-size:11px;color:#9ca3af">${a.desc}</div>
        <div style="font-size:11px;color:#38bdf8;font-weight:700">Cost: ${a.cost} Mana</div>
      </div>
    `).join('');
  },

  renderBoard() {
    const boardEl = document.getElementById('chessboard');
    boardEl.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        const isLight = (r + c) % 2 === 0;
        sq.className = 'sq ' + (isLight ? 'light' : 'dark');
        sq.dataset.r = r;
        sq.dataset.c = c;

        if (this.selectedSq && this.selectedSq.r === r && this.selectedSq.c === c) {
          sq.classList.add('selected');
        }
        if (this.lastMove && ((this.lastMove.fr === r && this.lastMove.fc === c) || (this.lastMove.tr === r && this.lastMove.tc === c))) {
          sq.classList.add('last-move');
        }

        const lm = this.legalMoves.find(m => m.r === r && m.c === c);
        if (lm) {
          sq.classList.add(lm.capture ? 'legal-capture' : 'legal-move');
        }

        if (this.activeCard && this.canTargetWithCard(this.activeCard, r, c)) {
          sq.classList.add('spell-target');
        }

        const meta = this.sqMeta[r][c];
        if (meta.wall > 0) {
          sq.innerHTML = `<div class="sq-wall">${window.SVG_ICONS.wall}</div>`;
        } else {
          if (meta.mine) sq.innerHTML += `<div class="sq-trap">${window.SVG_ICONS.mine}</div>`;
          if (meta.trap) sq.innerHTML += `<div class="sq-trap">${window.SVG_ICONS.trap}</div>`;
        }

        const p = this.board[r][c];
        if (p) {
          const img = document.createElement('img');
          img.src = window.PIECE_URLS[p.color][p.type];
          img.className = 'chess-piece-img';
          sq.appendChild(img);

          const badges = document.createElement('div');
          badges.className = 'status-badges';
          if (p.shield > 0) badges.innerHTML += `<div class="badge-pill">${window.SVG_ICONS.shield}</div>`;
          if (p.frozen > 0) badges.innerHTML += `<div class="badge-pill">${window.SVG_ICONS.freeze}</div>`;
          if (p.poison > 0) badges.innerHTML += `<div class="badge-pill">${window.SVG_ICONS.poison}</div>`;
          if (p.mark > 0) badges.innerHTML += `<div class="badge-pill">${window.SVG_ICONS.mark}</div>`;
          sq.appendChild(badges);
        }

        boardEl.appendChild(sq);
      }
    }
  },

  renderAll() {
    this.renderBoard();
    document.getElementById('mana-w').textContent = this.mana.w + ' / 10';
    document.getElementById('mana-b').textContent = this.mana.b + ' / 10';

    const handContainer = document.getElementById('hand-grid');
    const activeHand = this.hands[this.turn];
    handContainer.innerHTML = '';
    activeHand.forEach(card => {
      const canAfford = this.mana[this.turn] >= card.cost;
      const div = document.createElement('div');
      div.className = `ability-card rarity-${card.rarity} ${!canAfford ? 'disabled' : ''} ${this.activeCard?.uid === card.uid ? 'active-card' : ''}`;
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="display:flex;align-items:center;gap:4px;font-weight:700;font-size:12px">
            ${window.SVG_ICONS[card.icon] || window.SVG_ICONS.bolt} ${card.name}
          </span>
          <span style="display:flex;align-items:center;gap:2px;font-weight:800;font-size:12px;color:#38bdf8">
            ${card.cost} ${window.SVG_ICONS.mana}
          </span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="rarity-tag tag-${card.rarity}">${card.rarity} (${card.dropChance}%)</span>
        </div>
        <div style="font-size:10.5px;color:#9ca3af;line-height:1.25">${card.desc}</div>
      `;
      div.onclick = () => this.triggerCard(card);
      handContainer.appendChild(div);
    });
  }
};

window.addEventListener('DOMContentLoaded', () => window.Game.init());
