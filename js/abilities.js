// 31 Illegal Chess Abilities + Weighted Rarity Pool + 10-Mana Mega Spell
// Drop Weights: Common = 40, Rare = 22, Epic = 10, Legendary = 3 (Mega Spell = 2)

window.ABILITIES = [
  // COMMON (Weight: 40)
  { id: 'sprint', name: 'Pawn Sprint', cost: 2, rarity: 'common', weight: 40, icon: 'bolt', mode: 'own_pawn', desc: 'Push a pawn forward up to 2 empty squares.' },
  { id: 'retreat', name: 'Tactical Step', cost: 2, rarity: 'common', weight: 40, icon: 'teleport', mode: 'own_piece', desc: 'Step a piece 1 square backward if empty.' },
  { id: 'shift', name: 'Flank Shift', cost: 2, rarity: 'common', weight: 40, icon: 'teleport', mode: 'own_piece', desc: 'Slide a piece 1 square left or right if empty.' },
  { id: 'wall', name: 'Stone Wall', cost: 2, rarity: 'common', weight: 40, icon: 'wall', mode: 'empty_sq', desc: 'Block an empty square with a stone wall for 3 turns.' },
  { id: 'purify', name: 'Purify', cost: 2, rarity: 'common', weight: 40, icon: 'shield', mode: 'own_piece', desc: 'Cleanse Freeze, Poison, and Assassin Mark + grant 1t Shield.' },
  { id: 'shield', name: 'Divine Shield', cost: 3, rarity: 'common', weight: 40, icon: 'shield', mode: 'own_piece', desc: 'Target piece cannot be captured or killed for 2 turns.' },
  { id: 'smoke', name: 'Smoke Bomb', cost: 2, rarity: 'common', weight: 40, icon: 'shield', mode: 'own_piece', desc: 'Cloak your piece (+ adjacent ally) in stealth shield for 1 turn.' },
  { id: 'trap', name: 'Bear Trap', cost: 2, rarity: 'common', weight: 40, icon: 'trap', mode: 'empty_sq', desc: 'Place a trap that freezes the first enemy stepping on it for 2 turns.' },
  { id: 'mana', name: 'Mana Surge', cost: 2, rarity: 'common', weight: 40, icon: 'mana', mode: 'instant', desc: 'Channel arcane energy: spend 2 Mana to gain +4 Mana (max 1x/turn).' },

  // RARE (Weight: 22)
  { id: 'swap', name: 'Soul Swap', cost: 3, rarity: 'rare', weight: 22, icon: 'teleport', mode: 'two_own', desc: 'Swap positions of any two of your own pieces.' },
  { id: 'ghost', name: 'Ghost Stride', cost: 3, rarity: 'rare', weight: 22, icon: 'teleport', mode: 'own_piece', desc: 'Grant a piece Knight-jump capabilities in addition to its moves.' },
  { id: 'sniper', name: 'Sniper Shot', cost: 4, rarity: 'rare', weight: 22, icon: 'sword', mode: 'enemy_non_royal_fwd', desc: 'Eliminate an enemy non-King/non-Queen piece up to 3 ranks ahead.' },
  { id: 'poison', name: 'Poison Blade', cost: 3, rarity: 'rare', weight: 22, icon: 'poison', mode: 'enemy_non_royal', desc: 'Infect an enemy non-King/Queen: dies in 3 rounds unless it captures.' },
  { id: 'freeze', name: 'Cryo Freeze', cost: 3, rarity: 'rare', weight: 22, icon: 'freeze', mode: 'enemy_non_king', desc: 'Freeze an enemy non-King piece in solid ice for 2 turns.' },
  { id: 'fog', name: 'Fog of War', cost: 3, rarity: 'rare', weight: 22, icon: 'shield', mode: 'instant', desc: 'Shroud all your non-King pieces in protective mist for 1 turn.' },
  { id: 'magnet', name: 'Magnetic Pull', cost: 3, rarity: 'rare', weight: 22, icon: 'bolt', mode: 'enemy_non_king', desc: 'Pull an enemy non-King piece 1 square forward toward your side.' },
  { id: 'infantry', name: 'Draft Infantry', cost: 3, rarity: 'rare', weight: 22, icon: 'sword', mode: 'own_pawn_rank', desc: 'Summon a loyal Pawn on an empty square on your pawn rank.' },
  { id: 'harvest', name: 'Soul Harvest', cost: 1, rarity: 'rare', weight: 22, icon: 'necro', mode: 'own_pawn', desc: 'Sacrifice one of your Pawns to gain +3 Mana and draw 1 card.' },

  // EPIC (Weight: 10)
  { id: 'teleport', name: 'Phase Teleport', cost: 4, rarity: 'epic', weight: 10, icon: 'teleport', mode: 'own_to_empty_half', desc: 'Teleport any friendly piece to an empty square on your half.' },
  { id: 'mine', name: 'Hidden Mine', cost: 3, rarity: 'epic', weight: 10, icon: 'mine', mode: 'empty_sq', desc: 'Plant a lethal mine on an empty square (Kings defuse it safely).' },
  { id: 'ram', name: 'Battering Ram', cost: 4, rarity: 'epic', weight: 10, icon: 'sword', mode: 'enemy_non_king', desc: 'Crush a non-King enemy piece directly in front of your Rook/Knight.' },
  { id: 'necro', name: 'Necromancy', cost: 5, rarity: 'epic', weight: 10, icon: 'necro', mode: 'empty_back_rank', desc: 'Revive your strongest fallen non-Queen piece onto your back rank.' },
  { id: 'recruit', name: 'Mind Control', cost: 5, rarity: 'epic', weight: 10, icon: 'necro', mode: 'enemy_pawn', desc: 'Convert an enemy Pawn to your side (frozen for 1 turn).' },
  { id: 'poly', name: 'Polymorph', cost: 4, rarity: 'epic', weight: 10, icon: 'bolt', mode: 'enemy_minor', desc: 'Transform an enemy Knight, Bishop, or Rook into a Pawn.' },
  { id: 'clone', name: 'Doppelganger', cost: 5, rarity: 'epic', weight: 10, icon: 'teleport', mode: 'own_minor', desc: 'Clone a friendly Knight or Bishop onto an adjacent empty square.' },
  { id: 'valkyrie', name: 'Valkyrie Ascent', cost: 4, rarity: 'epic', weight: 10, icon: 'sword', mode: 'own_pawn', desc: 'Promote a Pawn immediately into a Knight or Bishop.' },
  { id: 'mark', name: 'Assassin Mark', cost: 4, rarity: 'epic', weight: 10, icon: 'mark', mode: 'enemy_non_royal', desc: 'Doom a non-King/Queen enemy piece to perish in 3 rounds.' },

  // LEGENDARY (Weight: 3, Mega Spell = 2)
  { id: 'lightning', name: 'Chain Lightning', cost: 6, rarity: 'legendary', weight: 3, icon: 'bolt', mode: 'enemy_minor_advanced', desc: 'Smite an enemy Pawn, Knight, or Bishop that left its back rank.' },
  { id: 'timewarp', name: 'Chrono Time Warp', cost: 7, rarity: 'legendary', weight: 3, icon: 'teleport', mode: 'instant', desc: 'Bend time: your next standard board move does not end your turn!' },
  { id: 'meteor', name: 'Meteor Strike', cost: 6, rarity: 'legendary', weight: 3, icon: 'sword', mode: 'enemy_non_king', desc: 'Destroy a non-King enemy piece and scorch its square into a Wall.' },
  { id: 'cataclysm', name: 'Grand Cataclysm', cost: 10, rarity: 'legendary', weight: 2, icon: 'cataclysm', mode: 'instant', desc: 'MEGA SPELL: Destroy 2 random non-King enemies, freeze all other non-King enemies 1t, shield your King, and summon a Royal piece!' }
];

// Calculate exact drop probabilities
(function computeDropRates() {
  const totalWeight = window.ABILITIES.reduce((acc, a) => acc + a.weight, 0);
  window.ABILITIES.forEach(a => {
    a.dropChance = ((a.weight / totalWeight) * 100).toFixed(1);
  });
})();

window.drawWeightedAbility = function(currentHand = []) {
  const handIds = new Set(currentHand.map(c => c.id));
  let pool = window.ABILITIES.filter(a => !handIds.has(a.id));
  if (pool.length === 0) pool = window.ABILITIES;

  const totalWeight = pool.reduce((sum, a) => sum + a.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const ability of pool) {
    roll -= ability.weight;
    if (roll <= 0) {
      return { ...ability, uid: Math.random().toString(36).slice(2, 9) };
    }
  }
  return { ...pool[0], uid: Math.random().toString(36).slice(2, 9) };
};
