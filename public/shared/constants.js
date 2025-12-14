/**
 * Shared constants for client-side
 */

const ALIGNMENTS = ['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE', 'U'];

const ALIGNMENT_FULL_NAMES = {
    LG: 'Lawful Good',
    NG: 'Neutral Good',
    CG: 'Chaotic Good',
    LN: 'Lawful Neutral',
    TN: 'True Neutral',
    CN: 'Chaotic Neutral',
    LE: 'Lawful Evil',
    NE: 'Neutral Evil',
    CE: 'Chaotic Evil',
    U: "Judge's Choice"
};

const ALIGNMENT_EXAMPLES = {
    LG: "Superman, Captain America, Brienne of Tarth",
    NG: "Spider-Man, Wonder Woman, Luke Skywalker",
    CG: "Robin Hood, Han Solo, The Doctor",
    LN: "Judge Dredd, James Bond, A typical soldier",
    TN: "The Watcher, Tom Bombadil, Druids",
    CN: "Jack Sparrow, Deadpool, Loki",
    LE: "Darth Vader, Dolores Umbridge, A corrupt politician",
    NE: "Lord Voldemort, Sauron, A mercenary",
    CE: "The Joker, Cthulhu, Carnage",
    U: "The Judge picks!"
};

const TOKEN_TYPES = {
    mindReader: { name: 'Mind Reader', emoji: '🧠' },
    technicalMerit: { name: 'Technical Merit', emoji: '🎨' },
    perfectAlignment: { name: 'Perfect Alignment', emoji: '⚖️' },
    plotTwist: { name: 'Plot Twist', emoji: '🎭' }
};

const AVATARS = [
    'alienlady_avatar.png',
    'dadskeletonts_avatar.png',
    'chessqueen_avatar.png',
    'robot_avatar.svg',
    'cat_avatar.svg',
    'wizard_avatar.svg',
    'pirate_avatar.svg',
    'ninja_avatar.svg',
    'ghost_avatar.svg',
    'alien_avatar.svg',
    'devil_avatar.svg'
];
