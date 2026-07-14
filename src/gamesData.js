/* ─── Learn to Play: card game guides ───
   Pure data — no JSX here. Rendered by LearnToPlayScreen.jsx.
   Educational content only. Every game explicitly notes it is for
   casual, friendly play — never for money/gambling. */

export const GAME_GUIDES = [
  {
    id: "rummy13",
    emoji: "🃏",
    name: "13-Card Rummy",
    tag: "Set-collecting · 2–6 players",
    players: "2 to 6 players (best with 4–6)",
    deck: "1 or 2 standard 52-card decks + jokers (2 decks used when more than 6 players, or by house preference)",
    objective:
      "Be the first to arrange all 13 of your cards into valid sets and sequences, then 'declare' (show your hand) before anyone else.",
    setup: [
      "Each player is dealt 13 cards.",
      "The remaining cards are placed face-down as the 'stock' (draw pile).",
      "One card is turned face-up next to the stock to start the 'discard pile'.",
      "A card is drawn at random and its rank becomes the 'wild joker' for the round — any card of that rank (in any suit) can substitute for any card you need.",
    ],
    terms: [
      { term: "Sequence (Run)", def: "3+ consecutive cards of the SAME suit, e.g. 4♠-5♠-6♠." },
      { term: "Pure Sequence", def: "A sequence with NO joker used in it, e.g. 7♥-8♥-9♥." },
      { term: "Impure Sequence", def: "A sequence that uses a joker to replace a missing card, e.g. 7♥-[Joker]-9♥ (joker stands in for 8♥)." },
      { term: "Set", def: "3 or 4 cards of the SAME rank, different suits, e.g. 9♠-9♥-9♦." },
      { term: "Wild Joker", def: "The rank drawn at the start of the round; any card of that rank can be used as any card you need in a set or sequence." },
      { term: "Declare / Show", def: "Laying down your final arranged hand to end the round, claiming you have a valid 13-card hand." },
    ],
    howTo: [
      "On your turn, draw one card — either from the closed stock, or the top card of the open discard pile.",
      "After drawing, you must discard one card face-up onto the discard pile, keeping your hand at 13 cards.",
      "Keep rearranging your hand into sets and sequences as you draw and discard.",
      "To win, your final 13 cards must form: AT LEAST 2 sequences, and of those, AT LEAST 1 must be a 'pure' sequence (no joker). The rest of your cards must form valid sets or additional sequences.",
      "Once your hand qualifies, declare on your turn (discard your last card face-down/sideways as the 'finish' card) and reveal your groupings.",
      "Other players reveal their hands too — score is calculated per player based on unmatched ('deadwood') cards left in their hand.",
    ],
    scoring: [
      "Winner (valid declare): 0 points.",
      "Face cards (K, Q, J) and 10s: 10 points each if left unmatched.",
      "Ace: 1 point if unmatched (some house rules count it as 10 — agree beforehand).",
      "Number cards 2–9: face value if unmatched.",
      "Wrong/invalid declare ('wrong show'): usually a fixed penalty (e.g. 80 points) — agree on this before playing.",
      "Many groups play to an elimination score (e.g. 200 or 250) — this is exactly what ScoreKing's scoreboard tracks for you automatically.",
    ],
    example: {
      title: "Example of a winning hand",
      body:
        "7♠-8♠-9♠ (pure sequence)  •  4♥-5♥-6♥ (second sequence)  •  K♦-K♣-K♠ (set)  •  2♣-2♦-[Joker] (set using the wild joker as the third 2). " +
        "This hand has 2 sequences (one pure) plus 2 valid sets — a complete, valid declare worth 0 points.",
      cards: [{rank:"7",suit:"♠"},{rank:"8",suit:"♠"},{rank:"9",suit:"♠"}],
      cardsCaption: "The pure sequence from that hand",
    },
  },

  {
    id: "poker-texas",
    emoji: "♠️",
    name: "Poker (Texas Hold'em)",
    tag: "Comparing/vying · 2–10 players",
    players: "2 to 10 players (best with 4–8)",
    deck: "1 standard 52-card deck, no jokers",
    objective:
      "Make the best 5-card hand using any combination of your 2 private cards and the 5 shared community cards, and win the pot by having the best hand at showdown — or by getting everyone else to fold.",
    setup: [
      "Each player is dealt 2 private cards face-down ('hole cards').",
      "A 'dealer button' marks the nominal dealer and rotates clockwise each hand.",
      "Betting typically opens with two forced bets: the 'small blind' and 'big blind', posted by the two players left of the dealer.",
    ],
    terms: [
      { term: "Hole cards", def: "Your 2 private cards, only you can see them." },
      { term: "Flop", def: "The first 3 community cards, dealt face-up together." },
      { term: "Turn", def: "The 4th community card." },
      { term: "River", def: "The 5th and final community card." },
      { term: "Fold", def: "Give up your hand and any claim to the pot." },
      { term: "Call", def: "Match the current bet to stay in." },
      { term: "Raise", def: "Increase the bet, forcing others to match it or fold." },
      { term: "Check", def: "Pass the action without betting, only allowed if no one has bet yet this round." },
      { term: "Showdown", def: "Remaining players reveal hands; best 5-card hand wins the pot." },
      { term: "Kicker", def: "An unused high card that breaks ties between two similar hands (e.g. two players with a pair of Kings — whoever has the higher extra card wins)." },
    ],
    howTo: [
      "Round 1 — Pre-flop: each player looks at their 2 hole cards and bets, calls, raises, or folds in turn, starting left of the big blind.",
      "The dealer deals the flop: 3 community cards face-up in the middle. Another round of betting follows, starting left of the dealer.",
      "The dealer deals the turn: a 4th community card. Another round of betting follows.",
      "The dealer deals the river: the 5th and final community card. One last round of betting follows.",
      "If two or more players remain, it's the showdown: everyone reveals their hole cards and the best possible 5-card hand (from their 2 + the 5 community cards) wins the pot.",
      "If everyone else folds before showdown, the last remaining player wins the pot without needing to reveal their cards.",
    ],
    handRankings: [
      { rank: 1, name: "Royal Flush", notation: "A K Q J 10 (all same suit)", cards: [{rank:"A",suit:"♠"},{rank:"K",suit:"♠"},{rank:"Q",suit:"♠"},{rank:"J",suit:"♠"},{rank:"10",suit:"♠"}], desc: "The top 5 cards of one suit, in sequence. The best possible hand." },
      { rank: 2, name: "Straight Flush", notation: "e.g. 9 8 7 6 5 (all same suit)", cards: [{rank:"9",suit:"♠"},{rank:"8",suit:"♠"},{rank:"7",suit:"♠"},{rank:"6",suit:"♠"},{rank:"5",suit:"♠"}], desc: "Five cards in sequence, all the same suit." },
      { rank: 3, name: "Four of a Kind", notation: "e.g. KKKK-x (often written 'quad Kings')", cards: [{rank:"K",suit:"♠"},{rank:"K",suit:"♥"},{rank:"K",suit:"♦"},{rank:"K",suit:"♣"},{rank:"5",suit:"♠"}], desc: "All 4 cards of one rank, plus any 5th card." },
      { rank: 4, name: "Full House", notation: "e.g. KKKAA — read as 'Kings full of Aces'", cards: [{rank:"K",suit:"♠"},{rank:"K",suit:"♥"},{rank:"K",suit:"♦"},{rank:"A",suit:"♠"},{rank:"A",suit:"♥"}], desc: "Three of one rank PLUS a pair of another rank. Named by the three-of-a-kind first: 'X full of Y' means three X's and a pair of Y's." },
      { rank: 5, name: "Flush", notation: "e.g. K 9 6 4 2 (all same suit)", cards: [{rank:"K",suit:"♠"},{rank:"9",suit:"♠"},{rank:"6",suit:"♠"},{rank:"4",suit:"♠"},{rank:"2",suit:"♠"}], desc: "Any 5 cards of the same suit, not in sequence." },
      { rank: 6, name: "Straight", notation: "e.g. 9 8 7 6 5 (mixed suits)", cards: [{rank:"9",suit:"♠"},{rank:"8",suit:"♥"},{rank:"7",suit:"♦"},{rank:"6",suit:"♣"},{rank:"5",suit:"♠"}], desc: "Five cards in sequence, any suits." },
      { rank: 7, name: "Three of a Kind", notation: "e.g. QQQ-x-y", cards: [{rank:"Q",suit:"♠"},{rank:"Q",suit:"♥"},{rank:"Q",suit:"♦"},{rank:"8",suit:"♣"},{rank:"4",suit:"♠"}], desc: "Three cards of one rank, plus two unrelated cards. Also called a 'set' or 'trips'." },
      { rank: 8, name: "Two Pair", notation: "e.g. AAKK-x", cards: [{rank:"A",suit:"♠"},{rank:"A",suit:"♥"},{rank:"K",suit:"♦"},{rank:"K",suit:"♣"},{rank:"5",suit:"♠"}], desc: "Two different pairs, plus one unrelated card." },
      { rank: 9, name: "One Pair", notation: "e.g. AA-x-y-z", cards: [{rank:"A",suit:"♠"},{rank:"A",suit:"♥"},{rank:"K",suit:"♦"},{rank:"8",suit:"♣"},{rank:"4",suit:"♠"}], desc: "Two cards of the same rank, plus three unrelated cards." },
      { rank: 10, name: "High Card", notation: "e.g. A-K-9-6-2, no pattern", cards: [{rank:"A",suit:"♠"},{rank:"K",suit:"♦"},{rank:"9",suit:"♥"},{rank:"6",suit:"♣"},{rank:"2",suit:"♠"}], desc: "No combination at all — ranked only by the highest card you hold." },
    ],
    notationNote:
      "Poker hands are often shorthanded by just listing the ranks, e.g. 'KKAAA' or 'AAKKK' both describe the SAME hand: three of one rank and a pair of another. Order in the shorthand doesn't matter — what matters is the pattern (3+2 = Full House). Read it as 'the rank that appears 3 times, full of the rank that appears 2 times'. So AAAKK = 'Aces full of Kings', and KKKAA = 'Kings full of Aces' — these are different hands, and Aces full beats Kings full since three Aces outranks three Kings.",
    example: {
      title: "Worked example",
      body:
        "Your hole cards: K♠ K♥. Community cards (by the river): K♦ 9♣ 9♠ 2♥ 4♦. " +
        "Your best 5-card hand uses K♠ K♥ K♦ (three Kings) + 9♣ 9♠ (a pair of Nines) = a Full House, 'Kings full of Nines'. " +
        "If an opponent has A♦ A♣ as hole cards, their best hand is A♦ A♣ 9♣ 9♠ K♦ = Two Pair (Aces and Nines) — your Full House beats their Two Pair, so you win the pot.",
      cards: [{rank:"K",suit:"♠"},{rank:"K",suit:"♥"},{rank:"K",suit:"♦"},{rank:"9",suit:"♣"},{rank:"9",suit:"♠"}],
      cardsCaption: "Your winning hand: Kings full of Nines",
    },
  },

  {
    id: "teenpatti",
    emoji: "🎴",
    name: "Teen Patti",
    tag: "Comparing/vying · 3–6 players",
    players: "3 to 6 players",
    deck: "1 standard 52-card deck, no jokers",
    objective:
      "Similar to 3-card poker — have the best-ranked 3-card hand at showdown, or get everyone else to fold.",
    setup: [
      "Each player is dealt exactly 3 cards, face-down.",
      "A pot is started with a fixed 'boot amount' (in real play this is money — for casual/point play, use chips or points, never real cash).",
      "Players may choose to play 'blind' (without looking at their cards) or 'seen' (after looking) — blind players bet less, seen players bet more.",
    ],
    terms: [
      { term: "Boot amount", def: "The starting stake everyone puts into the pot before cards are dealt." },
      { term: "Blind", def: "Betting without looking at your own cards — riskier for opponents to read, and costs less to stay in." },
      { term: "Seen (Chaal)", def: "Choosing to look at your cards; from then on you bet at a higher fixed rate than blind players." },
      { term: "Pack / Fold", def: "Giving up your hand and exiting the round." },
      { term: "Show", def: "When only 2 players remain, either can request a face-off to compare hands directly." },
      { term: "Trail / Set", def: "Three cards of the same rank — the best possible hand (e.g. 3 Aces is the highest trail)." },
    ],
    howTo: [
      "Each player antes the boot amount into the pot.",
      "Cards are dealt: 3 face-down cards to each player.",
      "Starting left of the dealer, each player in turn either bets (blind or seen, per above), or folds.",
      "Betting continues clockwise, with each active player matching or raising the current bet, until only one player remains (they win the pot automatically) or two players remain and request a 'show'.",
      "At a show, the two remaining hands are compared and the higher-ranked hand wins the whole pot.",
    ],
    handRankings: [
      { rank: 1, name: "Trail / Set (Trio)", notation: "e.g. AAA", cards: [{rank:"A",suit:"♠"},{rank:"A",suit:"♥"},{rank:"A",suit:"♦"}], desc: "Three cards of the same rank. Highest trio wins; AAA is the best." },
      { rank: 2, name: "Pure Sequence (Straight Flush)", notation: "e.g. 4♠5♠6♠", cards: [{rank:"4",suit:"♠"},{rank:"5",suit:"♠"},{rank:"6",suit:"♠"}], desc: "3 consecutive cards, same suit." },
      { rank: 3, name: "Sequence (Run)", notation: "e.g. 4♠5♥6♦", cards: [{rank:"4",suit:"♠"},{rank:"5",suit:"♥"},{rank:"6",suit:"♦"}], desc: "3 consecutive cards, mixed suits." },
      { rank: 4, name: "Colour (Flush)", notation: "e.g. K♠9♠2♠", cards: [{rank:"K",suit:"♠"},{rank:"9",suit:"♠"},{rank:"2",suit:"♠"}], desc: "3 cards of the same suit, not in sequence." },
      { rank: 5, name: "Pair", notation: "e.g. QQ-x", cards: [{rank:"Q",suit:"♠"},{rank:"Q",suit:"♥"},{rank:"9",suit:"♦"}], desc: "Two cards of the same rank plus one other card." },
      { rank: 6, name: "High Card", notation: "e.g. K-9-4, no pattern", cards: [{rank:"K",suit:"♠"},{rank:"9",suit:"♦"},{rank:"4",suit:"♣"}], desc: "No combination — highest single card decides." },
    ],
    example: {
      title: "Worked example",
      body:
        "Player A (seen): 9♠ 9♥ 9♦ — a Trail (three of a kind). Player B (seen): K♠ Q♠ J♠ — a Pure Sequence. " +
        "Even though a straight flush 'looks' impressive, a Trail always outranks it in Teen Patti — Player A wins the pot.",
      cards: [{rank:"9",suit:"♠"},{rank:"9",suit:"♥"},{rank:"9",suit:"♦"}],
      cardsCaption: "Player A's winning Trail",
    },
  },

  {
    id: "blackjack",
    emoji: "🂡",
    name: "Blackjack (21)",
    tag: "Adding/counting · 1+ players vs dealer",
    players: "1 or more players, each playing against 'the dealer' (a rotating role, not a house)",
    deck: "1 or more standard 52-card decks",
    objective:
      "Get your card total as close to 21 as possible without going over ('busting') — and beat the dealer's total to win.",
    setup: [
      "Assign one player as 'the dealer' for the round (rotate this role each round for fairness in casual play).",
      "Each player, including the dealer, gets 2 cards. Players' cards are usually face-up; the dealer has one face-up ('upcard') and one face-down ('hole card').",
      "Card values: 2–10 = face value, J/Q/K = 10, Ace = 1 or 11 (whichever helps your hand more).",
    ],
    terms: [
      { term: "Hit", def: "Take another card to try to get closer to 21." },
      { term: "Stand", def: "Keep your current total and end your turn." },
      { term: "Bust", def: "Going over 21 — you lose immediately, regardless of the dealer's hand." },
      { term: "Blackjack", def: "An Ace + a 10-value card as your first 2 cards = 21 exactly, the best possible hand, usually paid extra." },
      { term: "Double Down", def: "Doubling your bet in exchange for exactly one more card, then standing." },
      { term: "Split", def: "If your first 2 cards match in rank, splitting them into two separate hands, each played independently." },
      { term: "Push", def: "A tie between player and dealer — bets are returned, no one wins or loses." },
    ],
    howTo: [
      "Each player looks at their 2 cards and the dealer's visible upcard.",
      "In turn, each player decides to Hit (take more cards) or Stand (stop), trying to get as close to 21 as possible without busting.",
      "A player who busts (goes over 21) is out immediately for that round.",
      "Once all players have finished, the dealer reveals their hole card and must Hit until reaching at least 17, then stands.",
      "Compare totals: any player closer to 21 than the dealer (without busting) wins; anyone with a lower total than the dealer loses; equal totals push (tie).",
    ],
    scoring: [
      "A natural Blackjack (Ace + 10-value card on the first 2 cards) typically beats a non-blackjack 21 and often pays a bonus in real casinos — for casual/point play, agree on a bonus value beforehand, e.g. double points.",
      "This game is traditionally played for stakes in casinos — for home/friendly play, replace money with points, chips, or just bragging rights. Never play for real money.",
    ],
    example: {
      title: "Worked example",
      body:
        "Your hand: 9♣ + 7♦ = 16. You Hit and draw a 5♠ — that's 21, so you Stand. " +
        "The dealer's hand was K♥ (upcard) + 6♣ (hole card) = 16; dealer must Hit again since 16 is below 17, and draws a 9♦, making 25 — a bust. " +
        "Since the dealer busted, you win regardless of your own total (as long as you didn't bust).",
      cards: [{rank:"9",suit:"♣"},{rank:"7",suit:"♦"},{rank:"5",suit:"♠"}],
      cardsCaption: "Your final hand: 9 + 7 + 5 = 21",
    },
  },

  {
    id: "uno",
    emoji: "🔴",
    name: "UNO",
    tag: "Shedding · 2–10 players",
    players: "2 to 10 players",
    deck: "Standard UNO deck: 4 colors (red, yellow, green, blue) numbered 0–9, plus action cards (Skip, Reverse, Draw Two) and wild cards (Wild, Wild Draw Four)",
    objective:
      "Be the first player to get rid of all the cards in your hand.",
    setup: [
      "Each player is dealt 7 cards.",
      "The remaining deck is placed face-down as the draw pile; the top card is flipped to start the discard pile.",
    ],
    terms: [
      { term: "Match", def: "You may play a card that matches the top discard by color, number, or symbol." },
      { term: "Wild", def: "Can be played on any card, at any time; the player who plays it chooses the new color." },
      { term: "Wild Draw Four", def: "Like a Wild, but also forces the next player to draw 4 cards and lose their turn." },
      { term: "Draw Two", def: "Forces the next player to draw 2 cards and lose their turn." },
      { term: "Skip", def: "The next player's turn is skipped entirely." },
      { term: "Reverse", def: "Reverses the direction of play (clockwise ↔ counter-clockwise)." },
      { term: "UNO!", def: "You must call out 'UNO' when you play your second-to-last card, warning others you have just 1 card left. Forget to call it and get caught, and you may have to draw penalty cards (house rule, commonly 2)." },
      { term: "Winning on a power card", def: "You CAN win by playing an action/power card (Draw Two, Wild Draw Four, Skip, Reverse) as your very last card — the round ends immediately either way. However, the next player still has to carry out that card's effect (e.g. draw the cards) before scoring, and that card still counts at full value if you're playing for points." },
    ],
    howTo: [
      "On your turn, play a card from your hand that matches the top of the discard pile by color, number, or symbol — or play a wild card at any time.",
      "If you can't play a valid card, draw one card from the draw pile; if it's playable you may play it immediately, otherwise your turn ends.",
      "Action cards apply their effect immediately (skip the next player, reverse direction, or force the next player to draw cards).",
      "When you play your second-to-last card, call out 'UNO' — this is a required warning that you're about to be able to win.",
      "The first player to play their very last card wins the round — even if that last card is an action/power card rather than a plain number card (see 'Winning on a power card' below).",
    ],
    scoring: [
      "Casual play: simply play again for fun, best-of-X rounds.",
      "Point play: when a player empties their hand, all other players count the point value of the cards remaining in their hands (number cards = face value, action cards = 20 each, wilds = 50 each) and the winner is credited that total. Play continues over multiple rounds to a target score (e.g. 500).",
    ],
    example: {
      title: "Example turn",
      body:
        "Top of discard pile: Red 7. You hold a Blue 7 (matches by number) and a Red Skip (matches by color) — either is legal to play. " +
        "You play the Red Skip: the next player's turn is skipped entirely, and play continues with the player after them. " +
        "Later in the same game, your very last card happens to be a Draw Two — you play it and win immediately, but the next player must still draw those 2 cards before everyone counts up points.",
    },
  },

  {
    id: "unoflip",
    emoji: "🌓",
    name: "UNO Flip",
    tag: "Shedding, double-sided deck · 2–10 players",
    players: "2 to 10 players",
    deck:
      "112 special double-sided cards: every card has a calmer 'Light Side' (blue/green/yellow/red, matching classic UNO) printed on the back of a tougher 'Dark Side' (pink/teal/purple/orange) — only one side is in play at a time.",
    objective:
      "Just like classic UNO, be the first to get rid of every card in your hand — but the deck is double-sided, and special Flip cards can suddenly switch the ENTIRE game (draw pile, discard pile, and everyone's hand) from the mild Light Side to the much harsher Dark Side, or back again.",
    setup: [
      "Shuffle and deal 7 cards to each player; everyone holds their cards with the Light Side facing them.",
      "Flip the top card of the draw pile face-up to start the discard pile — the game always begins on the Light Side.",
      "Play proceeds clockwise starting with the player to the dealer's left, exactly like classic UNO.",
    ],
    terms: [
      { term: "Light Side", def: "The gentler side of the deck: numbers 1–9 plus Draw One, Skip, Reverse, Wild, Wild Draw Two, and Flip. This is always where a hand starts." },
      { term: "Dark Side", def: "The harsher side: numbers 1–9 plus Draw Five, Skip Everyone, Reverse, Wild, Wild Draw Color, and Flip — much bigger penalties." },
      { term: "Flip card", def: "The signature card of this version. Playing it instantly flips EVERYTHING over to the other side — the draw pile, the discard pile, and every player's hand — and play continues from there until another Flip card is played." },
      { term: "Skip Everyone (Dark Side only)", def: "Every other player at the table loses their turn, and play comes straight back around to you again." },
      { term: "Wild Draw Color (Dark Side only)", def: "You name a color; the next player must reveal cards from the draw pile one at a time until they get a card of that color, add ALL of those revealed cards to their hand, and lose their turn." },
    ],
    howTo: [
      "On your turn, play a card matching the top discard by color, number, or symbol — but only cards from whichever side (Light or Dark) is currently active.",
      "If you have nothing playable, draw one card from the draw pile; play it immediately if it's legal, otherwise your turn ends.",
      "Action cards resolve immediately, same as classic UNO — but remember Dark Side action cards hit much harder.",
      "If you play a Flip card, everything flips right then: turn over the discard pile, the draw pile, and every player's hand, all to the opposite side. Play continues from the newly-revealed top card.",
      "Call 'UNO' when you play your second-to-last card, on whichever side you're currently playing.",
      "First player to empty their hand wins the round. If your last card forces the next player to draw, they still must do so before scoring.",
    ],
    scoring: [
      "Scoring happens on whichever side (Light or Dark) the round ended on — cards are only worth points if they belong to that side.",
      "Number cards score their face value; action cards from the active side are worth more (commonly 20 points), and Wild-type cards score the most (commonly 40–50 points) — agree on exact values with your group, or use the totals printed on your deck's rules insert.",
      "Play continues over multiple hands; first player to reach 500 total points wins the game.",
    ],
    example: {
      title: "Worked example",
      body:
        "The discard pile shows a Light Side Blue 7. You play a Blue Flip card from your hand. " +
        "Instantly, the discard pile, the draw pile, and every player's hand flip over to their Dark Side — the Blue Flip card is now showing as its Dark Side color and value. " +
        "Play continues from there, except now the much tougher Draw Five, Skip Everyone, and Wild Draw Color cards are all in play instead of their milder Light Side counterparts, until someone plays another Flip card to switch back.",
    },
  },

  {
    id: "unonomercy",
    emoji: "☠️",
    name: "UNO Show 'Em No Mercy",
    tag: "Shedding, high-chaos · 2–6 players",
    players: "2 to 6 players",
    deck:
      "168 cards — a bigger, tougher relative of classic UNO with harsher action cards (Draw 2, Draw 4, Skip, Skip Everyone, Discard All) and four brutal Wild cards (Wild Draw 6, Wild Draw 10, Wild Reverse Draw 4, Wild Color Roulette).",
    objective:
      "Be the first to get rid of every card in your hand, OR simply outlast the table — this version adds a 'Mercy Rule' that knocks a player completely out of the game if their hand grows too large.",
    setup: [
      "Deal 7 cards to each of the 2–6 players.",
      "Place the remaining cards face-down as the draw pile.",
      "Flip the top card face-up to start the discard pile — if it's an action or Wild card, keep flipping the next card instead until you land on a plain number card.",
    ],
    terms: [
      { term: "Stacking", def: "When someone plays a Draw card (+2, +4, +6, or +10), you can respond with a Draw card of equal or higher value instead of drawing — the penalty adds up and passes to the next player, who faces the same choice." },
      { term: "Mercy Rule", def: "If any player's hand ever reaches 25 cards or more, they are knocked out of the game immediately and take no further part in that hand." },
      { term: "7-Rule", def: "Whenever ANY 7 is played, the player who played it must immediately swap their entire hand with one other player of their choice." },
      { term: "0-Rule", def: "Whenever ANY 0 is played, every player at the table passes their entire hand to the next player in turn order, all at once." },
      { term: "Discard All", def: "A special card that lets you immediately discard every card of one color from your hand in one go, instead of playing just one card." },
      { term: "Wild Color Roulette", def: "When this is played, the NEXT player (not the player who played it) names a color, then reveals cards from the draw pile one at a time until they hit that color, adds everything revealed to their hand, and loses their turn." },
    ],
    howTo: [
      "On your turn, play a card matching the top discard by color, number, or symbol; action and Wild cards trigger their effect immediately.",
      "If you can't play, keep drawing from the draw pile until you draw something you CAN play — unlike classic UNO's single draw — then you may play it right away.",
      "Whenever a 7 is played, that player instantly swaps hands with any other player of their choice (the 7-Rule).",
      "Whenever a 0 is played, everyone passes their whole hand to the next player in turn order at once (the 0-Rule).",
      "Draw-card penalties (+2/+4/+6/+10) can be 'stacked' with an equal-or-higher Draw card instead of drawing, passing a growing penalty down the line.",
      "Watch your hand size — if it ever reaches 25 or more cards, you're knocked out of the game immediately under the Mercy Rule.",
      "Call 'UNO' on your second-to-last card, same as classic UNO.",
      "Win by playing your very last card, OR by being the only player left after everyone else has been knocked out by the Mercy Rule.",
    ],
    scoring: [
      "When a hand ends, the winner scores points for every card left in opponents' hands: number cards at face value, standard action cards worth 20 points, and the big Wild action cards (Wild Reverse Draw 4, Wild Draw 6, Wild Draw 10, Wild Color Roulette) worth 50 points each.",
      "The winner also scores 250 bonus points for every player they personally knocked out via the Mercy Rule during that hand.",
      "Play continues over multiple hands; first player to reach 1000 total points wins the game.",
    ],
    example: {
      title: "Worked example",
      body:
        "Player A plays a Draw 4. Instead of drawing, Player B stacks a Draw 6 of their own on top, pushing the penalty up to 6 cards. " +
        "Player C has no Draw card to stack, so they must draw all 6 — pushing their hand from 21 cards up to 27. " +
        "Since 27 is over the Mercy Rule's 25-card limit, Player C is knocked out of the game immediately, and Player B earns 250 bonus points for the knockout once the hand ends.",
    },
  },

  {
    id: "spades",
    emoji: "♠",
    name: "Spades",
    tag: "Trick-taking, bidding · 4 players (2 teams of 2)",
    players: "4 players in 2 fixed partnerships (partners sit opposite each other)",
    deck: "1 standard 52-card deck, no jokers",
    objective:
      "Bid how many 'tricks' your partnership will win each hand, then try to win exactly that many (or more) — Spades is always the top (trump) suit.",
    setup: [
      "All 52 cards are dealt out evenly, 13 to each player.",
      "Partners sit across from each other; teams alternate seats around the table.",
    ],
    terms: [
      { term: "Trick", def: "One round where each of the 4 players plays a single card; the highest card of the led suit (or highest spade, if any spade was played) wins the trick." },
      { term: "Trump", def: "In Spades, the spade suit is ALWAYS trump — any spade beats any card of another suit." },
      { term: "Bid", def: "Before play, each player privately predicts how many tricks they'll win; a partnership's bids are added together as their team target." },
      { term: "Book", def: "Another word for a trick." },
      { term: "Nil", def: "A bid of zero — betting you'll win NO tricks at all, for a big bonus if successful (and a big penalty if you win even one trick)." },
      { term: "Bag / Sandbag", def: "Winning more tricks than you bid; extra tricks ('bags') usually carry a penalty once they accumulate (commonly -100 points at 10 bags)." },
    ],
    howTo: [
      "Each player looks at their 13 cards and bids a number of tricks (0–13) they expect to win; a bid of 0 is called 'Nil'.",
      "The player left of the dealer leads the first trick with any card except a spade (spades usually can't be led until they've been 'broken' by being played on an earlier trick).",
      "Each other player must follow suit if possible; if they can't follow suit, they may play any card, including a spade.",
      "Whoever played the highest card of the suit led wins the trick — unless a spade was played, in which case the highest spade wins.",
      "The trick winner leads the next trick. Play continues until all 13 tricks are played.",
      "Partnerships combine tricks won; compare to their combined bid to score the hand.",
    ],
    scoring: [
      "Making your bid exactly or more: 10 points per bid trick, plus 1 point per extra ('bag') trick over the bid.",
      "Failing to make your bid: -10 points per bid trick (bags are not scored that hand).",
      "Successful Nil bid (0 tricks won as promised): bonus, commonly +100 points.",
      "Failed Nil bid (won at least 1 trick despite bidding 0): penalty, commonly -100 points.",
      "Games are usually played to a target score, e.g. 500 — ScoreKing's scoreboard can track this running total for you round by round.",
    ],
    example: {
      title: "Worked example",
      body:
        "You and your partner bid 4 and 3 respectively — your team target is 7 tricks combined. " +
        "By the end of the hand your team actually won 9 tricks. You made your bid (7) with 2 extra bags: score = 70 (7×10) + 2 (bags) = 72 points, but those 2 bags count toward your bag-penalty total for later.",
    },
  },

  {
    id: "hearts",
    emoji: "♥",
    name: "Hearts",
    tag: "Trick-taking, avoidance · 4 players",
    players: "4 players (each for themselves — no fixed partnerships)",
    deck: "1 standard 52-card deck, no jokers",
    objective:
      "Unlike most trick games, you want to AVOID winning certain cards — every Heart is a penalty point, and the Queen of Spades is worth 13 penalty points by itself. Lowest score wins.",
    setup: [
      "All 52 cards are dealt evenly, 13 to each of the 4 players.",
      "Before play, each player passes 3 cards to another player (direction rotates each hand: left, right, across, then no pass, repeating) — you choose which 3 cards to give away, trying to unload dangerous cards.",
    ],
    terms: [
      { term: "Trick", def: "One round where all 4 players play a card; highest card of the suit led wins it." },
      { term: "Shooting the Moon", def: "A high-risk, high-reward move: if you manage to win ALL 13 Hearts AND the Queen of Spades in one hand, instead of taking 26 penalty points yourself, every OTHER player takes 26 points instead." },
      { term: "Breaking Hearts", def: "Hearts cannot be led until a Heart has been played (discarded) on an earlier trick because a player couldn't follow suit — this is 'breaking' hearts." },
      { term: "The Queen of Spades", def: "Worth 13 penalty points on her own — often nicknamed 'the Black Lady' or 'Calamity Jane'." },
    ],
    howTo: [
      "Before the first trick, each player passes 3 chosen cards to a neighbor (direction rotates each hand).",
      "The player holding the 2 of Clubs leads the very first trick.",
      "Each player must follow the suit led if they can; if they can't, they may play any card — including a Heart or the Queen of Spades.",
      "Whoever plays the highest card of the suit led wins the trick and collects all 4 cards played (they go into that player's 'won pile', not their hand).",
      "The trick winner leads the next trick. Play continues until all 13 tricks are played out.",
      "At the end of the hand, count penalty points from each player's won pile: each Heart = 1 point, the Queen of Spades = 13 points.",
    ],
    scoring: [
      "Each Heart card collected: 1 penalty point.",
      "The Queen of Spades collected: 13 penalty points.",
      "'Shooting the Moon' (winning all 13 Hearts + the Queen in one hand): that player scores 0, and every other player is instead charged 26 points.",
      "Play continues over several hands until someone reaches a target score (commonly 100) — the player with the LOWEST total at that point wins the whole game.",
    ],
    example: {
      title: "Worked example",
      body:
        "By the end of a hand, Player A's won-pile contains 4 Hearts and the Queen of Spades: score = 4 + 13 = 17 penalty points added to their running total. " +
        "Meanwhile Player B's won-pile has no Hearts and no Queen: 0 points added that hand — the goal is to stay as close to 0 as possible.",
      cards: [{rank:"Q",suit:"♠"},{rank:"2",suit:"♥"},{rank:"5",suit:"♥"},{rank:"9",suit:"♥"},{rank:"K",suit:"♥"}],
      cardsCaption: "Player A's costly won-pile: Q♠ (13 pts) + 4 Hearts (4 pts) = 17",
    },
  },

  {
    id: "bridge",
    emoji: "♣",
    name: "Contract Bridge",
    tag: "Trick-taking, bidding, partnership · 4 players (2 teams of 2)",
    players: "4 players in 2 fixed partnerships (partners sit opposite each other, traditionally called North/South vs East/West)",
    deck: "1 standard 52-card deck, no jokers",
    objective:
      "Through a bidding 'auction', one partnership commits to a contract (a suit to be trump, or 'No Trump', plus a number of tricks above six they'll win); they then try to fulfil that contract while the other side tries to stop them.",
    setup: [
      "All 52 cards are dealt out evenly, 13 to each of the 4 players.",
      "Partners sit opposite one another.",
    ],
    terms: [
      { term: "Auction / Bidding", def: "Before play, players take turns bidding a suit (or No Trump) and a number (1–7), each bid must outrank the last, until 3 players in a row pass — the last bid becomes the 'contract'." },
      { term: "Trump suit", def: "The suit named in the winning contract; any card of that suit beats any card of another suit for that hand. 'No Trump' means there is no trump suit at all." },
      { term: "Declarer", def: "The player from the winning partnership who first bid the contract's suit; they play both their own hand AND their partner's hand (the 'dummy')." },
      { term: "Dummy", def: "The declarer's partner; after the opening lead, dummy's cards are laid face-up on the table for declarer to play, and dummy takes no active decisions." },
      { term: "Contract", def: "The final bid — e.g. '4 Hearts' means declarer's side must win at least 10 tricks (6 + 4) with Hearts as trump." },
      { term: "Making / Going Down", def: "'Making' the contract means winning at least the number of tricks bid; falling short is 'going down', which scores penalty points for the opponents." },
    ],
    howTo: [
      "Auction: starting with the dealer, each player in turn either bids (naming a suit or No Trump, plus a trick count) or passes. Bidding ends when 3 players pass in a row after the last bid.",
      "The player from the winning side who first named the contract's suit becomes 'declarer'. Declarer's partner becomes 'dummy'.",
      "The player to declarer's left makes the opening lead (plays first). Immediately after, dummy's hand is laid face-up for everyone to see.",
      "Declarer then plays cards from BOTH their own hand and dummy's exposed hand for the rest of the deal, trying to win enough tricks for the contract.",
      "The other 2 players (the 'defenders') play normally from their own hidden hands, trying to prevent declarer from making the contract.",
      "After all 13 tricks are played, compare tricks won to the contract to score the hand.",
    ],
    scoring: [
      "Bridge scoring is famously detailed — the short version: making the contract scores points based on the trump suit and number of tricks bid; failing scores penalty points to the defenders instead.",
      "For casual home play, most groups simplify: declarer's side scores a flat amount per trick bid and made (agree beforehand, e.g. 10 points/trick), and the defenders score a penalty per trick declarer falls short (e.g. -10 points/trick under).",
      "Serious/tournament Bridge uses an official detailed scoring table (majors, minors, No Trump, doubled contracts, etc.) — worth learning separately once you're comfortable with the basics.",
    ],
    example: {
      title: "Worked example",
      body:
        "The auction ends with a contract of '3 No Trump' (meaning declarer's side must win at least 9 of the 13 tricks, with no trump suit). " +
        "Declarer's side ends up winning 10 tricks total — one more than needed. They've made their contract with an 'overtrick', typically worth a small bonus on top of the base contract score.",
    },
  },

  {
    id: "callbreak",
    emoji: "♦",
    name: "Callbreak",
    tag: "Trick-taking, bidding · 4 players (individual)",
    players: "4 players, each for themselves (no partnerships)",
    deck: "1 standard 52-card deck, no jokers",
    objective:
      "Similar to Spades but played individually rather than in partnerships. Bid how many tricks you'll win this hand, then try to hit that number exactly (or beat it) — Spades are always trump.",
    setup: [
      "All 52 cards are dealt evenly, 13 to each of the 4 players.",
      "A full game is normally played over 5 hands (each player deals once, plus one extra), with scores totalled at the end.",
    ],
    terms: [
      { term: "Call (Bid)", def: "Before play, each player privately commits to a number of tricks (1–13) they think they'll win this hand." },
      { term: "Trump", def: "Spades are always trump — any spade beats any non-spade card." },
      { term: "Overtrick", def: "Winning more tricks than you called; usually worth a small bonus fraction of a point each." },
      { term: "Undertrick", def: "Falling short of your call; usually a fixed penalty per trick you're short." },
    ],
    howTo: [
      "Each player looks at their hand and calls (bids) a number of tricks they expect to win, from 1 up to 13.",
      "The player to the dealer's left leads the first trick with any card.",
      "Each player must follow the suit led if able; if unable, they may play any card, including a spade (there's no 'breaking spades' rule like in regular Spades — trump can be played anytime a player can't follow suit).",
      "Highest card of the suit led wins the trick, unless a spade was played, in which case the highest spade wins.",
      "The trick winner leads next. Continue until all 13 tricks are played, then compare each player's tricks won to their call.",
    ],
    scoring: [
      "Meeting your call exactly or more: 1 point per called trick, plus a small bonus per extra trick (commonly 0.1 points per overtrick).",
      "Falling short of your call: a fixed penalty per trick you're short (commonly -1 point per trick under your call).",
      "Scores accumulate over all hands played (traditionally 5); highest total at the end wins.",
    ],
    example: {
      title: "Worked example",
      body:
        "You call 5 tricks. You end up winning 7 tricks: you made your call with 2 overtricks — score = 5 + (2 × 0.1) = 5.2 points for the hand. " +
        "Another player calls 6 but only wins 4: they fall 2 short — score = -2 points for that hand.",
    },
  },

  {
    id: "twentynine",
    emoji: "♣",
    name: "29 (Twenty-Nine)",
    tag: "Trick-taking, bidding, partnership · 4 players (2 teams of 2)",
    players: "4 players in 2 fixed partnerships (partners sit opposite each other)",
    deck:
      "A special 32-card deck: only ranks J, 9, A, 10, K, Q, 8, 7 of each suit are used (remove 2–6 from a standard deck).",
    objective:
      "Bid for the right to choose trump, then try to win enough of the 28 total 'points' available in the cards to fulfil your bid.",
    setup: [
      "8 cards are dealt to each of the 4 players (in two batches of 4, with a bidding round for trump rights happening between the two deals in the traditional version — many casual groups simplify to a single deal).",
      "Card point values: J = 3, 9 = 2, A = 1, 10 = 1, and K/Q/8/7 = 0 points each. Total points in the deck = 28 (hence the game's name, since with the 'last trick' bonus 1 point it's often played to a target around 29).",
    ],
    terms: [
      { term: "Trump", def: "The single suit chosen by the winning bidder for that hand; trump cards beat any card of another suit." },
      { term: "Bid", def: "Players call out a target number of points (typically starting around 16) they believe their partnership can win; bidding rises until only one bidder remains, who then names trump." },
      { term: "Points (card points)", def: "Not the same as 'tricks' — what matters in 29 is the total value of point-cards captured (J=3, 9=2, A=1, 10=1), not how many tricks you win." },
    ],
    howTo: [
      "Players bid in turn, each bid naming a higher point-target than the last, until 3 players pass in a row and the highest bidder wins the auction.",
      "The winning bidder privately chooses the trump suit and the rest of the cards are dealt out.",
      "The player to the dealer's left leads the first trick. Others must follow suit if able; if not, they may play trump or discard.",
      "Highest card of the suit led wins, unless trump was played, in which case the highest trump wins.",
      "The trick winner leads next; continue until all 8 tricks are played.",
      "Add up the point-cards (J/9/A/10) each partnership captured across their tricks — total is always 28, plus some house rules award a bonus point for winning the last trick, making it effectively 29.",
    ],
    scoring: [
      "If the bidding partnership captures at least as many points as they bid, they win the hand and score points toward the overall game.",
      "If they fall short, the OPPOSING partnership scores instead (often double, as a penalty) — house rules vary, so agree on exact scoring before playing.",
      "Games are typically played to a target score across several hands, e.g. first team to 6 or 12 game-points.",
    ],
    example: {
      title: "Worked example",
      body:
        "Your partnership bid 18 and chose Spades as trump. Across the 8 tricks, your team's captured cards include 2 Jacks (3+3=6), 1 Nine (2), 2 Aces (1+1=2), and 1 Ten (1) = 11 points — short of your bid of 18. " +
        "Since you fell short, the opposing team scores for the hand instead, per your house rules.",
    },
  },
];

export const LEARN_DISCLAIMER =
  "These guides are for learning and friendly play only. ScoreKing does not support or encourage gambling, betting, or playing any of these games for real money — please keep it about the fun, the friends, and the memories.";
