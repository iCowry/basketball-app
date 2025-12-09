
import React, { useState, useEffect, useRef } from 'react';
import { TacticNode, TacticMode, Language } from '../types';
import { RefreshCcw, Play, Pause, SkipForward, SkipBack, Map as MapIcon, Eye, EyeOff } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface TacticsBoardProps {
  mode: TacticMode;
  language: Language;
  selectedTacticId?: string;
}

// Helpers
// Offensive Node (White/Orange theme default)
const o = (id: number, x: number, y: number, label: string, role: string) => ({ 
  id, x, y, label, role, color: 'white' // Standard offense
});

// Defensive Node (Red theme)
const d = (id: number, x: number, y: number, label: string, role: string) => ({ 
  id: id + 100, // Offset IDs to prevent collision
  x, y, label, role, color: '#ef4444' // red-500
});

// Animation Data Definitions
const ANIMATIONS: Record<string, { mode: TacticMode, frames: TacticNode[][], ballPath?: {x:number, y:number}[] }> = {
  // --- Pick & Roll (5v5) vs Drop Coverage ---
  'pnr': {
    mode: '5v5',
    ballPath: [
      {x: 50, y: 75}, // Start
      {x: 65, y: 55}, // Drive
      {x: 60, y: 25}  // Finish
    ],
    frames: [
      // Frame 0: Start - Offense & Defense
      [
        o(1, 50, 75, 'PG', 'Handler'), o(2, 10, 80, 'SG', 'Spacer'), o(3, 90, 80, 'SF', 'Spacer'), o(4, 90, 20, 'PF', 'Corner'), o(5, 60, 50, 'C', 'Screener'),
        d(1, 50, 65, 'x1', 'On Ball'), d(2, 15, 75, 'x2', 'Deny'), d(3, 85, 75, 'x3', 'Help'), d(4, 85, 30, 'x4', 'Low Man'), d(5, 60, 40, 'x5', 'Drop')
      ],
      // Frame 1: Screen set
      [
        o(1, 50, 75, 'PG', 'Waiting'), o(2, 10, 80, 'SG', 'Spacer'), o(3, 90, 80, 'SF', 'Spacer'), o(4, 90, 20, 'PF', 'Corner'), o(5, 55, 68, 'C', 'Screen'),
        d(1, 50, 65, 'x1', 'Fighting'), d(2, 15, 75, 'x2', 'Deny'), d(3, 85, 75, 'x3', 'Help'), d(4, 85, 30, 'x4', 'Low Man'), d(5, 55, 45, 'x5', 'Drop')
      ],
      // Frame 2: Drive & Roll
      [
        o(1, 65, 55, 'PG', 'Drive'), o(2, 10, 80, 'SG', 'Spacer'), o(3, 90, 85, 'SF', 'Drift'), o(4, 90, 20, 'PF', 'Corner'), o(5, 55, 40, 'C', 'Roll'),
        d(1, 55, 60, 'x1', 'Trailing'), d(2, 15, 75, 'x2', 'Stunt'), d(3, 85, 80, 'x3', 'Zone up'), d(4, 80, 30, 'x4', 'Tag'), d(5, 60, 40, 'x5', 'Contest')
      ],
      // Frame 3: Decision/Score
      [
        o(1, 60, 25, 'PG', 'Layup'), o(2, 10, 80, 'SG', 'Spacer'), o(3, 90, 85, 'SF', 'Spacer'), o(4, 90, 20, 'PF', 'Corner'), o(5, 50, 25, 'C', 'Rebound'),
        d(1, 65, 30, 'x1', 'Chase'), d(2, 20, 70, 'x2', 'Recover'), d(3, 85, 75, 'x3', 'Recover'), d(4, 85, 25, 'x4', 'Box Out'), d(5, 55, 30, 'x5', 'Contest')
      ]
    ]
  },

  // --- Isolation (5v5) ---
  'iso': {
    mode: '5v5',
    ballPath: [
      {x: 50, y: 80},
      {x: 40, y: 60},
      {x: 50, y: 20}
    ],
    frames: [
      [
        o(1, 50, 80, '1', 'Iso'), o(2, 90, 80, '2', 'Space'), o(3, 10, 80, '3', 'Space'), o(4, 90, 10, '4', 'Space'), o(5, 10, 10, '5', 'Space'),
        d(1, 50, 70, 'x1', 'Def'), d(2, 85, 75, 'x2', 'Gap'), d(3, 15, 75, 'x3', 'Gap'), d(4, 85, 20, 'x4', 'Help'), d(5, 15, 20, 'x5', 'Help')
      ],
      [
        o(1, 40, 60, '1', 'Drive'), o(2, 90, 80, '2', 'Hold'), o(3, 10, 80, '3', 'Hold'), o(4, 90, 10, '4', 'Hold'), o(5, 10, 10, '5', 'Hold'),
        d(1, 45, 65, 'x1', 'Slide'), d(2, 80, 75, 'x2', 'Watch'), d(3, 20, 75, 'x3', 'Watch'), d(4, 85, 20, 'x4', 'Watch'), d(5, 15, 20, 'x5', 'Watch')
      ],
      [
        o(1, 50, 20, '1', 'Score'), o(2, 90, 80, '2', 'Hold'), o(3, 10, 80, '3', 'Hold'), o(4, 90, 10, '4', 'Hold'), o(5, 10, 10, '5', 'Reb'),
        d(1, 50, 30, 'x1', 'Beat'), d(2, 80, 75, 'x2', 'Stunt'), d(3, 20, 75, 'x3', 'Stunt'), d(4, 80, 25, 'x4', 'Box'), d(5, 20, 25, 'x5', 'Box')
      ]
    ]
  },

  // --- Give & Go (5v5) ---
  'give_go': {
     mode: '5v5',
     ballPath: [
       {x: 60, y: 80}, // Start
       {x: 25, y: 65}, // Pass to wing
       {x: 30, y: 20}  // Pass back to cutter
     ],
     frames: [
       [
         o(1, 60, 80, '1', 'Ball'), o(2, 20, 70, '2', 'Wing'), o(3, 90, 70, '3', 'Space'), o(4, 80, 20, '4', 'Corner'), o(5, 20, 20, '5', 'Corner'),
         d(1, 60, 70, 'x1', 'Def'), d(2, 25, 65, 'x2', 'Deny'), d(3, 85, 65, 'x3', 'Def'), d(4, 75, 25, 'x4', 'Def'), d(5, 25, 25, 'x5', 'Def')
       ],
       [
         o(1, 55, 75, '1', 'Pass'), o(2, 25, 65, '2', 'Catch'), o(3, 90, 70, '3', 'Hold'), o(4, 80, 20, '4', 'Hold'), o(5, 20, 20, '5', 'Hold'),
         d(1, 55, 65, 'x1', 'Relax'), d(2, 25, 55, 'x2', 'Press'), d(3, 85, 65, 'x3', 'Watch'), d(4, 75, 25, 'x4', 'Watch'), d(5, 25, 25, 'x5', 'Watch')
       ],
       [
         o(1, 35, 40, '1', 'Cut'), o(2, 25, 60, '2', 'Pass'), o(3, 90, 70, '3', 'Hold'), o(4, 80, 20, '4', 'Hold'), o(5, 20, 20, '5', 'Hold'),
         d(1, 50, 60, 'x1', 'Late'), d(2, 30, 60, 'x2', 'Vision'), d(3, 85, 65, 'x3', 'Watch'), d(4, 75, 25, 'x4', 'Watch'), d(5, 25, 25, 'x5', 'Watch')
       ],
       [
         o(1, 30, 20, '1', 'Layup'), o(2, 25, 60, '2', 'Assist'), o(3, 90, 70, '3', 'Hold'), o(4, 80, 20, '4', 'Hold'), o(5, 20, 20, '5', 'Hold'),
         d(1, 40, 30, 'x1', 'Trail'), d(2, 30, 60, 'x2', 'Hold'), d(3, 85, 65, 'x3', 'Watch'), d(4, 75, 25, 'x4', 'Watch'), d(5, 25, 25, 'x5', 'Watch')
       ]
     ]
  },

  // --- DHO (Dribble Hand Off) ---
  'dho': {
    mode: '5v5',
    ballPath: [
      {x: 50, y: 80},
      {x: 35, y: 60}, // Dribble
      {x: 25, y: 60}, // Handoff point
      {x: 40, y: 60}  // 2 drives
    ],
    frames: [
      [
        o(1, 50, 80, '1', 'Ball'), o(2, 20, 70, '2', 'Wing'), o(3, 90, 70, '3', 'Space'), o(4, 90, 20, '4', 'Corner'), o(5, 50, 50, '5', 'High'),
        d(1, 50, 70, 'x1', 'On'), d(2, 20, 60, 'x2', 'Deny'), d(3, 85, 65, 'x3', 'Help'), d(4, 85, 25, 'x4', 'Help'), d(5, 50, 40, 'x5', 'Def')
      ],
      [
        o(1, 35, 60, '1', 'Dribble'), o(2, 25, 65, '2', 'Lift'), o(3, 90, 70, '3', 'Space'), o(4, 90, 20, '4', 'Corner'), o(5, 50, 50, '5', 'Space'),
        d(1, 40, 65, 'x1', 'Chase'), d(2, 25, 55, 'x2', 'Check'), d(3, 85, 65, 'x3', 'Help'), d(4, 85, 25, 'x4', 'Help'), d(5, 50, 40, 'x5', 'Def')
      ],
      [
        o(1, 25, 60, '1', 'Handoff'), o(2, 25, 60, '2', 'Take'), o(3, 90, 70, '3', 'Space'), o(4, 90, 20, '4', 'Corner'), o(5, 50, 50, '5', 'Space'),
        d(1, 30, 60, 'x1', 'Screened'), d(2, 20, 50, 'x2', 'Trail'), d(3, 85, 65, 'x3', 'Help'), d(4, 85, 25, 'x4', 'Help'), d(5, 50, 40, 'x5', 'Def')
      ],
      [
        o(1, 40, 40, '1', 'Roll'), o(2, 40, 60, '2', 'Drive'), o(3, 90, 70, '3', 'Space'), o(4, 90, 20, '4', 'Corner'), o(5, 50, 50, '5', 'Space'),
        d(1, 35, 50, 'x1', 'Behind'), d(2, 35, 60, 'x2', 'Chase'), d(3, 85, 65, 'x3', 'Help'), d(4, 85, 25, 'x4', 'Help'), d(5, 50, 40, 'x5', 'Help')
      ]
    ]
  },

  // --- Spain Pick & Roll (5v5) ---
  'spain_pnr': {
    mode: '5v5',
    ballPath: [
      {x: 50, y: 80},
      {x: 60, y: 70},
      {x: 70, y: 50},
      {x: 75, y: 30}
    ],
    frames: [
      [
        o(1, 50, 80, '1', 'Handler'), o(2, 50, 50, '2', 'Shooter'), o(3, 10, 80, '3', 'Corner'), o(4, 90, 80, '4', 'Corner'), o(5, 60, 60, '5', 'Big'),
        d(1, 50, 70, 'x1', 'Guard'), d(2, 50, 40, 'x2', 'Guard'), d(3, 15, 70, 'x3', 'Guard'), d(4, 85, 70, 'x4', 'Guard'), d(5, 60, 50, 'x5', 'Drop')
      ],
      [
        o(1, 60, 70, '1', 'Use Screen'), o(2, 55, 55, '2', 'Back Screen'), o(3, 10, 80, '3', 'Corner'), o(4, 90, 80, '4', 'Corner'), o(5, 55, 70, '5', 'Screen'),
        d(1, 50, 75, 'x1', 'Chase'), d(2, 50, 45, 'x2', 'Top'), d(3, 15, 70, 'x3', 'Stay'), d(4, 85, 70, 'x4', 'Stay'), d(5, 60, 55, 'x5', 'Blocked')
      ],
      [
        o(1, 70, 50, '1', 'Attack'), o(2, 50, 75, '2', 'Pop Top'), o(3, 10, 80, '3', 'Corner'), o(4, 90, 80, '4', 'Corner'), o(5, 55, 30, '5', 'Roll'),
        d(1, 65, 55, 'x1', 'Trail'), d(2, 55, 60, 'x2', 'Confused'), d(3, 15, 75, 'x3', 'Watch'), d(4, 85, 75, 'x4', 'Watch'), d(5, 60, 40, 'x5', 'Recover')
      ],
      [
        o(1, 75, 30, '1', 'Score/Pass'), o(2, 50, 75, '2', 'Open 3'), o(3, 10, 80, '3', 'Corner'), o(4, 90, 80, '4', 'Corner'), o(5, 50, 20, '5', 'Lob'),
        d(1, 70, 40, 'x1', 'Chase'), d(2, 60, 65, 'x2', 'Closeout'), d(3, 20, 75, 'x3', 'Help'), d(4, 80, 75, 'x4', 'Help'), d(5, 55, 30, 'x5', 'Box 5')
      ]
    ]
  },

  // --- UCLA Cut (5v5) ---
  'ucla_cut': {
    mode: '5v5',
    ballPath: [
      {x: 50, y: 85}, // 1
      {x: 80, y: 75}, // 2 catch
      {x: 50, y: 20}  // Pass to 1 (post/cut)
    ],
    frames: [
      [
        o(1, 50, 85, '1', 'Ball'), o(2, 80, 75, '2', 'Wing'), o(3, 10, 80, '3', 'Corner'), o(4, 10, 20, '4', 'Block'), o(5, 70, 60, '5', 'Elbow'),
        d(1, 50, 75, 'x1', 'Def'), d(2, 75, 70, 'x2', 'Def'), d(3, 15, 75, 'x3', 'Def'), d(4, 20, 30, 'x4', 'Def'), d(5, 65, 55, 'x5', 'Def')
      ],
      [
        o(1, 60, 80, '1', 'Pass'), o(2, 80, 75, '2', 'Ball'), o(3, 10, 80, '3', 'Corner'), o(4, 15, 25, '4', 'Block'), o(5, 60, 65, '5', 'Set Screen'),
        d(1, 55, 75, 'x1', 'Relax'), d(2, 75, 70, 'x2', 'Press'), d(3, 15, 75, 'x3', 'Def'), d(4, 20, 30, 'x4', 'Def'), d(5, 65, 55, 'x5', 'Def')
      ],
      [
        o(1, 60, 40, '1', 'Cut'), o(2, 80, 75, '2', 'Look'), o(3, 10, 80, '3', 'Corner'), o(4, 20, 30, '4', 'Post'), o(5, 60, 65, '5', 'Screen'),
        d(1, 65, 50, 'x1', 'Chasing'), d(2, 75, 70, 'x2', 'Press'), d(3, 20, 75, 'x3', 'Help'), d(4, 30, 35, 'x4', 'Help'), d(5, 55, 60, 'x5', 'Show')
      ],
      [
        o(1, 50, 20, '1', 'Layup'), o(2, 75, 70, '2', 'Pass'), o(3, 10, 80, '3', 'Spacer'), o(4, 25, 40, '4', 'Rebound'), o(5, 60, 60, '5', 'Pop'),
        d(1, 55, 30, 'x1', 'Late'), d(2, 70, 65, 'x2', 'Hands Up'), d(3, 20, 75, 'x3', 'Watch'), d(4, 40, 40, 'x4', 'Box'), d(5, 60, 50, 'x5', 'Recover')
      ]
    ]
  },

  // --- Horns (5v5) ---
  'horns': {
    mode: '5v5',
    frames: [
      [
        o(1, 50, 75, 'PG', 'Ball'), o(2, 5, 85, 'SG', 'Corner'), o(3, 95, 85, 'SF', 'Corner'), o(4, 35, 60, 'PF', 'Elbow'), o(5, 65, 60, 'C', 'Elbow'),
        d(1, 50, 65, 'x1', 'Ball'), d(2, 10, 80, 'x2', 'Wing'), d(3, 90, 80, 'x3', 'Wing'), d(4, 35, 50, 'x4', 'Post'), d(5, 65, 50, 'x5', 'Post')
      ],
      [
        o(1, 50, 70, 'PG', 'Read'), o(2, 5, 85, 'SG', 'Corner'), o(3, 95, 85, 'SF', 'Corner'), o(4, 45, 65, 'PF', 'Screen'), o(5, 65, 60, 'C', 'Spacer'),
        d(1, 50, 65, 'x1', 'Fight'), d(2, 10, 80, 'x2', 'Wing'), d(3, 90, 80, 'x3', 'Wing'), d(4, 40, 55, 'x4', 'Show'), d(5, 65, 50, 'x5', 'Help')
      ],
      [
        o(1, 30, 55, 'PG', 'Drive'), o(2, 10, 70, 'SG', 'Lift'), o(3, 95, 85, 'SF', 'Corner'), o(4, 45, 50, 'PF', 'Roll'), o(5, 70, 50, 'C', 'Space'),
        d(1, 40, 60, 'x1', 'Trail'), d(2, 15, 75, 'x2', 'Deny'), d(3, 90, 80, 'x3', 'Help'), d(4, 40, 45, 'x4', 'Recover'), d(5, 60, 50, 'x5', 'Help')
      ]
    ]
  },
  
  // --- Elevator Doors ---
  'elevator': {
    mode: '5v5',
    ballPath: [
      {x: 50, y: 85},
      {x: 55, y: 80},
      {x: 50, y: 75}
    ],
    frames: [
      [
        o(1, 50, 85, '1', 'Top'), o(2, 50, 15, '2', 'Base'), o(3, 90, 80, '3', 'Corner'), o(4, 45, 50, '4', 'Door L'), o(5, 55, 50, '5', 'Door R'),
        d(1, 50, 75, 'x1', 'Def'), d(2, 50, 25, 'x2', 'Chase'), d(3, 85, 75, 'x3', 'Def'), d(4, 40, 45, 'x4', 'Def'), d(5, 60, 45, 'x5', 'Def')
      ],
      [
        o(1, 50, 85, '1', 'Wait'), o(2, 50, 45, '2', 'Run Up'), o(3, 90, 80, '3', 'Corner'), o(4, 40, 50, '4', 'Open'), o(5, 60, 50, '5', 'Open'),
        d(1, 50, 75, 'x1', 'Def'), d(2, 50, 35, 'x2', 'Chase'), d(3, 85, 75, 'x3', 'Def'), d(4, 35, 45, 'x4', 'Def'), d(5, 65, 45, 'x5', 'Def')
      ],
      [
        o(1, 50, 85, '1', 'Wait'), o(2, 50, 65, '2', 'Through'), o(3, 90, 80, '3', 'Corner'), o(4, 48, 50, '4', 'Close'), o(5, 52, 50, '5', 'Close'),
        d(1, 50, 75, 'x1', 'Def'), d(2, 50, 40, 'x2', 'Blocked'), d(3, 85, 75, 'x3', 'Def'), d(4, 40, 45, 'x4', 'Screen'), d(5, 60, 45, 'x5', 'Screen')
      ],
      [
        o(1, 55, 80, '1', 'Pass'), o(2, 50, 75, '2', 'Shot'), o(3, 90, 80, '3', 'Corner'), o(4, 48, 50, '4', 'Wall'), o(5, 52, 50, '5', 'Wall'),
        d(1, 60, 75, 'x1', 'Late'), d(2, 50, 45, 'x2', 'Stuck'), d(3, 85, 75, 'x3', 'Def'), d(4, 40, 45, 'x4', 'Box'), d(5, 60, 45, 'x5', 'Box')
      ]
    ]
  },

  // --- 5-Out (5v5) ---
  '5out': {
    mode: '5v5',
    ballPath: [
      {x: 50, y: 80},
      {x: 75, y: 70}
    ],
    frames: [
      [
        o(1, 50, 80, '1', 'Top'), o(2, 20, 70, '2', 'Wing'), o(3, 80, 70, '3', 'Wing'), o(4, 5, 40, '4', 'Corner'), o(5, 95, 40, '5', 'Corner'),
        d(1, 50, 70, 'x1', 'Def'), d(2, 20, 60, 'x2', 'Def'), d(3, 80, 60, 'x3', 'Def'), d(4, 15, 40, 'x4', 'Def'), d(5, 85, 40, 'x5', 'Def')
      ],
      [
        o(1, 50, 50, '1', 'Cut'), o(2, 20, 70, '2', 'Wing'), o(3, 75, 70, '3', 'Ball'), o(4, 5, 40, '4', 'Corner'), o(5, 95, 40, '5', 'Corner'),
        d(1, 50, 60, 'x1', 'Chase'), d(2, 25, 65, 'x2', 'Deny'), d(3, 75, 60, 'x3', 'Pressure'), d(4, 15, 40, 'x4', 'Help'), d(5, 85, 40, 'x5', 'Help')
      ],
      [
        o(1, 95, 20, '1', 'Fill'), o(2, 45, 75, '2', 'Fill'), o(3, 75, 70, '3', 'Hold'), o(4, 5, 50, '4', 'Lift'), o(5, 95, 40, '5', 'Corner'),
        d(1, 90, 30, 'x1', 'Recov'), d(2, 45, 65, 'x2', 'Deny'), d(3, 70, 65, 'x3', 'Def'), d(4, 15, 50, 'x4', 'Def'), d(5, 85, 40, 'x5', 'Def')
      ],
    ]
  },

   // --- 2-3 Zone (Defense Focus) ---
   '2_3_zone': {
    mode: '5v5',
    ballPath: [
       {x: 50, y: 80},
       {x: 90, y: 70},
       {x: 50, y: 48}
    ],
    frames: [
      // Frame 0: Formation
      [
        d(1, 35, 65, 'G1', 'Top'), d(2, 65, 65, 'G2', 'Top'), d(3, 15, 30, 'F3', 'Base'), d(4, 50, 35, 'C4', 'Paint'), d(5, 85, 30, 'F5', 'Base'),
        o(1, 50, 80, '1', 'Ball'), o(2, 90, 70, '2', 'Wing'), o(3, 10, 70, '3', 'Wing'), o(4, 80, 20, '4', 'Corner'), o(5, 20, 20, '5', 'Corner')
      ],
      // Frame 1: Pass to Wing (Right)
      [
        d(1, 50, 60, 'G1', 'Shift'), d(2, 75, 60, 'G2', 'Closeout'), d(3, 20, 35, 'F3', 'Help'), d(4, 60, 35, 'C4', 'Post'), d(5, 90, 40, 'F5', 'Corner'),
        o(1, 60, 75, '1', 'Pass'), o(2, 90, 70, '2', 'Ball'), o(3, 15, 65, '3', 'Cut'), o(4, 80, 20, '4', 'Corner'), o(5, 20, 20, '5', 'Corner')
      ],
      // Frame 2: Pass to High Post (Zone Weakness)
      [
        d(1, 50, 50, 'G1', 'Pinch'), d(2, 70, 55, 'G2', 'Recover'), d(3, 30, 35, 'F3', 'Help'), d(4, 50, 40, 'C4', 'Step Up'), d(5, 80, 35, 'F5', 'Recover'),
        o(1, 55, 70, '1', 'Move'), o(2, 80, 65, '2', 'Pass'), o(3, 50, 48, '3', 'Ball'), o(4, 80, 20, '4', 'Corner'), o(5, 20, 20, '5', 'Corner')
      ]
    ]
  },

  // --- 3-2 Zone ---
  '3_2_zone': {
    mode: '5v5',
    frames: [
      [
        d(1, 50, 65, 'Top', 'Top'), d(2, 20, 60, 'Wing', 'L'), d(3, 80, 60, 'Wing', 'R'), d(4, 30, 30, 'Base', 'L'), d(5, 70, 30, 'Base', 'R'),
        o(1, 50, 80, '1', 'Ball'), o(2, 85, 70, '2', 'Wing'), o(3, 15, 70, '3', 'Wing'), o(4, 15, 15, '4', 'Corner'), o(5, 85, 15, '5', 'Corner')
      ],
      [
        d(1, 65, 60, 'Top', 'Slide'), d(2, 35, 50, 'Wing', 'Dig'), d(3, 90, 55, 'Wing', 'Press'), d(4, 30, 30, 'Base', 'Zone'), d(5, 80, 25, 'Base', 'Corner'),
        o(1, 70, 75, '1', 'Pass'), o(2, 90, 65, '2', 'Ball'), o(3, 15, 70, '3', 'Hold'), o(4, 15, 15, '4', 'Hold'), o(5, 85, 15, '5', 'Corner')
      ]
    ]
  },

  // --- 1-3-1 Zone (Defense Focus) ---
  '1_3_1_zone': {
    mode: '5v5',
    frames: [
      // Frame 0: Formation
      [
        d(1, 50, 70, 'Chaser', 'Top'), d(2, 20, 50, 'Wing', 'Left'), d(3, 80, 50, 'Wing', 'Right'), d(4, 50, 45, 'Mid', 'Center'), d(5, 50, 20, 'War', 'Base'),
        o(1, 50, 85, '1', 'Ball'), o(2, 85, 80, '2', 'Wing'), o(3, 15, 80, '3', 'Wing'), o(4, 15, 15, '4', 'Corner'), o(5, 85, 15, '5', 'Corner')
      ],
      // Frame 1: Pass to Right Wing - Trap option
      [
        d(1, 70, 75, 'Chaser', 'Trap'), d(2, 50, 55, 'Wing', 'Help'), d(3, 85, 60, 'Wing', 'Trap'), d(4, 70, 45, 'Mid', 'Deny'), d(5, 90, 25, 'War', 'Corner'),
        o(1, 60, 80, '1', 'Pass'), o(2, 85, 80, '2', 'Ball'), o(3, 20, 75, '3', 'Shift'), o(4, 20, 20, '4', 'Corner'), o(5, 85, 15, '5', 'Hold')
      ]
    ]
  },

  // --- Box and 1 (Defense Focus) ---
  'box_and_1': {
    mode: '5v5',
    frames: [
      // Frame 0: Formation - Box + 1 Chaser
      [
        d(1, 60, 70, 'Chaser', 'Deny'), d(2, 35, 50, 'Box', 'Top L'), d(3, 65, 50, 'Box', 'Top R'), d(4, 35, 30, 'Box', 'Low L'), d(5, 65, 30, 'Box', 'Low R'),
        o(1, 55, 75, 'Star', 'Ball'), o(2, 20, 80, '2', 'Wing'), o(3, 80, 80, '3', 'Wing'), o(4, 20, 20, '4', 'Corner'), o(5, 80, 20, '5', 'Corner')
      ],
      // Frame 1: Star passes and cuts, Chaser follows everywhere
      [
        d(1, 80, 60, 'Chaser', 'Face Guard'), d(2, 40, 55, 'Box', 'Shift'), d(3, 60, 55, 'Box', 'Shift'), d(4, 40, 30, 'Box', 'Zone'), d(5, 60, 30, 'Box', 'Zone'),
        o(1, 85, 65, 'Star', 'Cut'), o(2, 25, 75, '2', 'Ball'), o(3, 75, 75, '3', 'Wing'), o(4, 20, 20, '4', 'Corner'), o(5, 80, 20, '5', 'Corner')
      ]
    ]
  },

  // --- Man to Man Switch ---
  'man': {
    mode: '5v5',
    frames: [
      [
        o(1, 50, 75, '1', 'Ball'), o(2, 10, 75, '2', 'Space'), o(3, 90, 75, '3', 'Space'), o(4, 90, 20, '4', 'Space'), o(5, 60, 60, '5', 'Screen'),
        d(1, 50, 65, 'x1', 'Guard'), d(2, 10, 65, 'x2', 'Guard'), d(3, 90, 65, 'x3', 'Guard'), d(4, 90, 30, 'x4', 'Guard'), d(5, 60, 50, 'x5', 'Guard')
      ],
      [
        o(1, 65, 60, '1', 'Drive'), o(2, 10, 75, '2', 'Space'), o(3, 90, 75, '3', 'Space'), o(4, 90, 20, '4', 'Space'), o(5, 55, 65, '5', 'Roll'),
        d(1, 55, 60, 'x1', 'Stuck'), d(2, 10, 65, 'x2', 'Guard'), d(3, 90, 65, 'x3', 'Guard'), d(4, 90, 30, 'x4', 'Guard'), d(5, 60, 55, 'x5', 'Switch')
      ],
      [
        o(1, 70, 40, '1', 'Iso Big'), o(2, 10, 75, '2', 'Space'), o(3, 90, 75, '3', 'Space'), o(4, 90, 20, '4', 'Space'), o(5, 50, 50, '5', 'Seal'),
        d(1, 50, 55, 'x1', 'On Big'), d(2, 10, 65, 'x2', 'Guard'), d(3, 90, 65, 'x3', 'Guard'), d(4, 90, 30, 'x4', 'Guard'), d(5, 65, 50, 'x5', 'On 1')
      ]
    ]
  },

  // ==========================================
  // 3x3 TACTICS
  // ==========================================

  // --- Check Ball (3x3 Start) ---
  'check_ball_3x3': {
    mode: '3x3',
    ballPath: [
      {x: 50, y: 70}, // 1 starts top
      {x: 50, y: 65}, // Check with D
      {x: 50, y: 75}  // Live
    ],
    frames: [
      // Frame 0: Dead Ball Check
      [
        o(1, 50, 70, '1', 'Check'), o(2, 80, 50, '2', 'Wing'), o(3, 20, 50, '3', 'Wing'),
        d(1, 50, 60, 'x1', 'Check'), d(2, 80, 40, 'x2', 'Def'), d(3, 20, 40, 'x3', 'Def')
      ],
      // Frame 1: Live Ball
      [
        o(1, 50, 75, '1', 'Live'), o(2, 85, 55, '2', 'Space'), o(3, 15, 55, '3', 'Space'),
        d(1, 50, 65, 'x1', 'Press'), d(2, 85, 45, 'x2', 'Deny'), d(3, 15, 45, 'x3', 'Deny')
      ]
    ]
  },

  // --- High PnR (3x3) ---
  'pnr_3x3': {
    mode: '3x3',
    ballPath: [
      {x: 50, y: 75},
      {x: 65, y: 55},
      {x: 50, y: 30}
    ],
    frames: [
      [
        o(1, 50, 75, '1', 'Ball'), o(2, 85, 50, '2', 'Corner'), o(3, 30, 60, '3', 'Screen'),
        d(1, 50, 65, 'x1', 'On'), d(2, 80, 45, 'x2', 'Help'), d(3, 35, 55, 'x3', 'Show')
      ],
      [
        o(1, 65, 55, '1', 'Drive'), o(2, 90, 50, '2', 'Corner'), o(3, 40, 50, '3', 'Roll'),
        d(1, 55, 60, 'x1', 'Trail'), d(2, 85, 45, 'x2', 'Zone'), d(3, 45, 55, 'x3', 'Help')
      ],
      [
        o(1, 50, 30, '1', 'Layup'), o(2, 90, 50, '2', 'Corner'), o(3, 50, 40, '3', 'Reb'),
        d(1, 60, 40, 'x1', 'Chase'), d(2, 80, 40, 'x2', 'Box'), d(3, 50, 50, 'x3', 'Box')
      ]
    ]
  },

  // --- Iso (3x3) ---
  'iso_3x3': {
    mode: '3x3',
    ballPath: [{x: 50, y: 75}, {x: 50, y: 30}],
    frames: [
      [
        o(1, 50, 75, '1', 'Iso'), o(2, 90, 20, '2', 'Corner'), o(3, 10, 20, '3', 'Corner'),
        d(1, 50, 65, 'x1', 'Def'), d(2, 85, 25, 'x2', 'Help'), d(3, 15, 25, 'x3', 'Help')
      ],
      [
        o(1, 50, 50, '1', 'Attack'), o(2, 90, 20, '2', 'Hold'), o(3, 10, 20, '3', 'Hold'),
        d(1, 50, 55, 'x1', 'Back'), d(2, 80, 30, 'x2', 'Stunt'), d(3, 20, 30, 'x3', 'Stunt')
      ],
      [
        o(1, 50, 30, '1', 'Score'), o(2, 90, 20, '2', 'Reb'), o(3, 10, 20, '3', 'Reb'),
        d(1, 50, 40, 'x1', 'Beat'), d(2, 80, 30, 'x2', 'Box'), d(3, 20, 30, 'x3', 'Box')
      ]
    ]
  },

  // --- Split Cut (3x3) ---
  'split_cut_3x3': {
    mode: '3x3',
    ballPath: [
      {x: 50, y: 75},
      {x: 75, y: 50}, // Pass to post
      {x: 75, y: 30}  // Post move
    ],
    frames: [
      [
        o(1, 50, 75, '1', 'Top'), o(2, 25, 60, '2', 'Wing'), o(3, 75, 50, '3', 'Post'),
        d(1, 50, 65, 'x1', 'Def'), d(2, 25, 50, 'x2', 'Def'), d(3, 70, 50, 'x3', 'Front')
      ],
      [
        o(1, 60, 60, '1', 'Pass'), o(2, 35, 65, '2', 'Wait'), o(3, 75, 50, '3', 'Catch'),
        d(1, 55, 65, 'x1', 'Relax'), d(2, 30, 55, 'x2', 'Watch'), d(3, 80, 50, 'x3', 'Behind')
      ],
      [
        o(1, 35, 60, '1', 'Screen'), o(2, 50, 50, '2', 'Cut'), o(3, 75, 50, '3', 'Hold'),
        d(1, 40, 60, 'x1', 'Screened'), d(2, 45, 55, 'x2', 'Chase'), d(3, 80, 50, 'x3', 'Def')
      ]
    ]
  },
  
  // --- Give & Go (3x3) ---
  'give_go_3x3': {
    mode: '3x3',
    ballPath: [
      {x: 50, y: 75},
      {x: 80, y: 60}, // Pass to wing
      {x: 50, y: 30}  // Pass back to cutter
    ],
    frames: [
      [
        o(1, 50, 75, '1', 'Top'), o(2, 80, 60, '2', 'Wing'), o(3, 20, 60, '3', 'Wing'),
        d(1, 50, 65, 'x1', 'Def'), d(2, 75, 55, 'x2', 'Def'), d(3, 25, 55, 'x3', 'Def')
      ],
      [
        o(1, 65, 65, '1', 'Pass'), o(2, 80, 60, '2', 'Catch'), o(3, 20, 60, '3', 'Hold'),
        d(1, 55, 65, 'x1', 'Relax'), d(2, 70, 55, 'x2', 'Press'), d(3, 25, 55, 'x3', 'Def')
      ],
      [
        o(1, 50, 40, '1', 'Cut'), o(2, 80, 60, '2', 'Pass'), o(3, 20, 60, '3', 'Hold'),
        d(1, 55, 50, 'x1', 'Chasing'), d(2, 70, 55, 'x2', 'Press'), d(3, 30, 50, 'x3', 'Help')
      ],
      [
        o(1, 50, 30, '1', 'Layup'), o(2, 70, 50, '2', 'Assist'), o(3, 30, 50, '3', 'Reb'),
        d(1, 50, 40, 'x1', 'Late'), d(2, 70, 55, 'x2', 'Hold'), d(3, 30, 50, 'x3', 'Box')
      ]
    ]
  },

  // --- Screen Away (3x3) ---
  'screen_away_3x3': {
    mode: '3x3',
    ballPath: [
      {x: 50, y: 75},
      {x: 80, y: 60}, // Pass R
    ],
    frames: [
      [
        o(1, 50, 75, '1', 'Ball'), o(2, 80, 60, '2', 'Wing'), o(3, 20, 60, '3', 'Wing'),
        d(1, 50, 65, 'x1', 'Def'), d(2, 75, 55, 'x2', 'Def'), d(3, 25, 55, 'x3', 'Def')
      ],
      [
        o(1, 65, 65, '1', 'Pass'), o(2, 80, 60, '2', 'Catch'), o(3, 20, 60, '3', 'Wait'),
        d(1, 55, 65, 'x1', 'Relax'), d(2, 70, 55, 'x2', 'Press'), d(3, 25, 55, 'x3', 'Def')
      ],
      [
        o(1, 35, 60, '1', 'Screen'), o(2, 80, 60, '2', 'Hold'), o(3, 30, 50, '3', 'Curl'),
        d(1, 40, 60, 'x1', 'Screened'), d(2, 70, 55, 'x2', 'Press'), d(3, 25, 55, 'x3', 'Chase')
      ],
      [
        o(1, 30, 50, '1', 'Pop'), o(2, 80, 60, '2', 'Look'), o(3, 50, 35, '3', 'Open'),
        d(1, 35, 55, 'x1', 'Recover'), d(2, 70, 55, 'x2', 'Press'), d(3, 40, 45, 'x3', 'Trail')
      ]
    ]
  },

  // --- DHO (3x3) ---
  'dho_3x3': {
    mode: '3x3',
    ballPath: [
       {x: 25, y: 60},
       {x: 40, y: 60}, // Dribble to mid
       {x: 35, y: 60}, // Handoff
       {x: 50, y: 40}  // Drive
    ],
    frames: [
      [
        o(1, 25, 60, '1', 'Ball'), o(2, 75, 60, '2', 'Wing'), o(3, 50, 80, '3', 'Top'),
        d(1, 25, 50, 'x1', 'Def'), d(2, 75, 50, 'x2', 'Def'), d(3, 50, 70, 'x3', 'Def')
      ],
      [
        o(1, 40, 60, '1', 'Dribble'), o(2, 75, 60, '2', 'Space'), o(3, 45, 65, '3', 'Run'),
        d(1, 35, 55, 'x1', 'Chase'), d(2, 75, 50, 'x2', 'Deny'), d(3, 45, 65, 'x3', 'Follow')
      ],
      [
        o(1, 35, 60, '1', 'Handoff'), o(2, 75, 60, '2', 'Hold'), o(3, 35, 60, '3', 'Take'),
        d(1, 30, 60, 'x1', 'Screen'), d(2, 75, 50, 'x2', 'Deny'), d(3, 40, 55, 'x3', 'Trail')
      ],
      [
        o(1, 25, 50, '1', 'Roll'), o(2, 80, 50, '2', 'Corner'), o(3, 50, 40, '3', 'Drive'),
        d(1, 30, 50, 'x1', 'Behind'), d(2, 75, 50, 'x2', 'Help'), d(3, 45, 45, 'x3', 'Chase')
      ]
    ]
  },

  // --- Backdoor (3x3) ---
  'backdoor_3x3': {
    mode: '3x3',
    ballPath: [
      {x: 50, y: 80},
      {x: 80, y: 30} // Pass deep
    ],
    frames: [
      [
        o(1, 50, 80, '1', 'Ball'), o(2, 85, 60, '2', 'Wing'), o(3, 15, 60, '3', 'Wing'),
        d(1, 50, 70, 'x1', 'Def'), d(2, 80, 55, 'x2', 'Overplay'), d(3, 20, 55, 'x3', 'Deny')
      ],
      [
        o(1, 50, 80, '1', 'Fake'), o(2, 90, 55, '2', 'Step Up'), o(3, 15, 60, '3', 'Hold'),
        d(1, 50, 70, 'x1', 'Stance'), d(2, 85, 50, 'x2', 'Jumps'), d(3, 20, 55, 'x3', 'Deny')
      ],
      [
        o(1, 55, 75, '1', 'Pass'), o(2, 80, 30, '2', 'Backdoor'), o(3, 20, 50, '3', 'Lift'),
        d(1, 55, 70, 'x1', 'Hands'), d(2, 85, 40, 'x2', 'Beaten'), d(3, 25, 50, 'x3', 'Help')
      ],
      [
        o(1, 55, 75, '1', 'Watch'), o(2, 60, 25, '2', 'Layup'), o(3, 20, 50, '3', 'Hold'),
        d(1, 55, 70, 'x1', 'Hold'), d(2, 70, 30, 'x2', 'Chase'), d(3, 35, 45, 'x3', 'Late')
      ]
    ]
  },

  // --- Man Defense (3x3) ---
  'man_3x3': {
    mode: '3x3',
    ballPath: [
       {x: 50, y: 80},
       {x: 20, y: 60}
    ],
    frames: [
      [
        o(1, 50, 80, '1', 'Ball'), o(2, 80, 60, '2', 'Wing'), o(3, 20, 60, '3', 'Wing'),
        d(1, 50, 70, 'x1', 'On Ball'), d(2, 75, 55, 'x2', 'Deny'), d(3, 25, 55, 'x3', 'Deny')
      ],
      [
        o(1, 35, 70, '1', 'Pass'), o(2, 80, 60, '2', 'Hold'), o(3, 20, 60, '3', 'Catch'),
        d(1, 40, 65, 'x1', 'Jump'), d(2, 65, 50, 'x2', 'Help'), d(3, 25, 55, 'x3', 'Closeout')
      ],
      [
        o(1, 50, 75, '1', 'Cut'), o(2, 80, 60, '2', 'Hold'), o(3, 20, 60, '3', 'Ball'),
        d(1, 45, 70, 'x1', 'Deny'), d(2, 50, 45, 'x2', 'Help'), d(3, 25, 50, 'x3', 'On Ball')
      ]
    ]
  }
};

// Default positions
const initialNodes5v5: TacticNode[] = [
  o(1, 50, 80, 'PG', 'Handler'), o(2, 20, 70, 'SG', 'Wing'), o(3, 80, 70, 'SF', 'Wing'), o(4, 30, 40, 'PF', 'Post'), o(5, 70, 40, 'C', 'Post')
];

const initialNodes3v3: TacticNode[] = [
  o(1, 50, 70, '1', 'Handler'), o(2, 20, 50, '2', 'Wing'), o(3, 80, 50, '3', 'Wing')
];

const TacticsBoard: React.FC<TacticsBoardProps> = ({ mode, language, selectedTacticId }) => {
  const t = TRANSLATIONS[language];
  const [nodes, setNodes] = useState<TacticNode[]>(mode === '5v5' ? initialNodes5v5 : initialNodes3v3);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  
  // Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [activeAnimationFrames, setActiveAnimationFrames] = useState<TacticNode[][] | null>(null);
  const [showPaths, setShowPaths] = useState(true);
  const timerRef = useRef<number | null>(null);

  // Load animation data when selection changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
    // Ensure we only load animations valid for the current mode
    if (selectedTacticId && ANIMATIONS[selectedTacticId] && ANIMATIONS[selectedTacticId].mode === mode) {
      const animData = ANIMATIONS[selectedTacticId];
      setActiveAnimationFrames(animData.frames);
      setNodes(animData.frames[0]);
    } else {
      setActiveAnimationFrames(null);
      setNodes(mode === '5v5' ? initialNodes5v5 : initialNodes3v3);
    }
  }, [selectedTacticId, mode]);

  // Animation Loop
  useEffect(() => {
    if (isPlaying && activeAnimationFrames) {
      timerRef.current = window.setInterval(() => {
        setCurrentFrameIndex(prev => {
          const next = prev + 1;
          if (next >= activeAnimationFrames.length) {
            setIsPlaying(false);
            return prev;
          }
          setNodes(activeAnimationFrames[next]);
          return next;
        });
      }, 1500); // 1.5 seconds per step for clarity
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeAnimationFrames]);

  // Manual Frame Control
  const goToFrame = (index: number) => {
    if (!activeAnimationFrames) return;
    const safeIndex = Math.max(0, Math.min(index, activeAnimationFrames.length - 1));
    setCurrentFrameIndex(safeIndex);
    setNodes(activeAnimationFrames[safeIndex]);
    setIsPlaying(false);
  };

  const handleCourtClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) return; // Disable editing during animation
    if (selectedNode !== null) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, x, y } : n));
      setSelectedNode(null);
    }
  };

  const handleNodeClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (isPlaying) return;
    setSelectedNode(selectedNode === id ? null : id);
  };

  const resetBoard = () => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
    if (activeAnimationFrames) {
      setNodes(activeAnimationFrames[0]);
    } else {
      setNodes(mode === '5v5' ? initialNodes5v5 : initialNodes3v3);
    }
    setSelectedNode(null);
  };

  // --- Route Visualization Logic ---
  const renderPaths = () => {
    if (!showPaths || !activeAnimationFrames || !selectedTacticId) return null;

    const nextFrameIndex = currentFrameIndex + 1;
    const hasNextMove = nextFrameIndex < activeAnimationFrames.length;
    
    // Ball Path (Static Reference for entire play)
    const ballPath = ANIMATIONS[selectedTacticId]?.ballPath;
    const createPathD = (points: {x:number, y:number}[]) => {
      if (points.length < 2) return '';
      return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    };

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <marker id="arrow-white" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L6,3 z" fill="white" />
          </marker>
          <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
          </marker>
           <marker id="arrow-orange" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L6,3 z" fill="#f97316" />
          </marker>
        </defs>

        {/* 1. Ghost Paths: Show FULL history of movement for context (Faded) */}
        {activeAnimationFrames[0].map(startNode => {
           const playerId = startNode.id;
           // Collect all positions for this player ID across frames
           const pathPoints = activeAnimationFrames.map(frame => frame.find(n => n.id === playerId)).filter(Boolean) as TacticNode[];
           if (pathPoints.length < 2) return null;
           
           // Filter out static points to avoid zero-length lines
           const meaningfulPoints = pathPoints.filter((p, i) => i === 0 || (Math.abs(p.x - pathPoints[i-1].x) > 0.5 || Math.abs(p.y - pathPoints[i-1].y) > 0.5));
           if (meaningfulPoints.length < 2) return null;

           const d = `M ${meaningfulPoints[0].x} ${meaningfulPoints[0].y} ` + meaningfulPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
           const isDefense = playerId > 50;

           return (
             <path 
               key={`ghost-${playerId}`}
               d={d}
               stroke={isDefense ? '#ef4444' : 'white'}
               strokeWidth="0.3"
               strokeOpacity="0.3"
               fill="none"
               strokeDasharray="2,2"
             />
           );
        })}

        {/* 2. Active Vector: Highlights ONLY the current step (Solid Arrow) */}
        {hasNextMove && activeAnimationFrames[currentFrameIndex].map(node => {
           const nextNode = activeAnimationFrames[nextFrameIndex].find(n => n.id === node.id);
           if (!nextNode) return null;
           // Only draw if significant movement
           if (Math.abs(node.x - nextNode.x) < 1 && Math.abs(node.y - nextNode.y) < 1) return null;
           
           const isDefense = node.id > 50;
           return (
             <line
                key={`vector-${node.id}`}
                x1={node.x}
                y1={node.y}
                x2={nextNode.x}
                y2={nextNode.y}
                stroke={isDefense ? '#ef4444' : 'white'}
                strokeWidth="0.6"
                strokeOpacity="0.9"
                markerEnd={`url(#arrow-${isDefense ? 'red' : 'white'})`}
             />
           );
        })}

        {/* 3. Static Ball Path (Overview) */}
        {ballPath && (
           <path
              d={createPathD(ballPath)}
              fill="none"
              stroke="#f97316"
              strokeWidth="0.5"
              strokeDasharray="4,4" 
              opacity="0.8"
              markerEnd="url(#arrow-orange)"
              strokeLinejoin="round"
            />
        )}
      </svg>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full aspect-[4/3] bg-court-dark border-2 border-slate-600 rounded-lg overflow-hidden select-none shadow-inner">
        {/* Court Markings */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="w-full h-full border-b-2 border-slate-500"></div>
          {/* Key */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1/2 border-x-2 border-b-2 border-slate-500 bg-slate-800/20"></div>
          {/* Free Throw Circle */}
          <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-1/3 h-[25%] -mt-[12.5%] border-2 border-slate-500 rounded-full"></div>
           {/* 3pt Line (Approx) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[80%] border-x-2 border-b-2 border-slate-500 rounded-b-[100px]"></div>
          {/* Hoop */}
          <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-orange-500 rounded-full shadow-[0_0_10px_rgba(234,88,12,0.5)]"></div>
          <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-500"></div>
        </div>

        {/* SVG Visualization Layer (Routes) */}
        {renderPaths()}

        {/* Interactive Layer */}
        <div 
          className={`absolute inset-0 z-10 ${isPlaying ? 'cursor-default' : 'cursor-crosshair'}`}
          onClick={handleCourtClick}
        >
          {nodes.map(node => (
            <div
              key={node.id}
              onClick={(e) => handleNodeClick(e, node.id)}
              style={{ 
                left: `${node.x}%`, 
                top: `${node.y}%`,
                backgroundColor: node.color === 'white' ? 'white' : node.color,
                color: node.color === 'white' ? '#0f172a' : 'white',
              }}
              className={`absolute w-8 h-8 md:w-10 md:h-10 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-700 ease-in-out shadow-lg
                ${selectedNode === node.id 
                  ? 'scale-125 ring-2 ring-court-orange z-30' 
                  : 'z-20 hover:scale-110'}`}
            >
              {node.label}
              {/* Role Tooltip */}
              <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] px-1 rounded opacity-0 hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity
                ${node.color === 'white' ? 'bg-court-orange text-white' : 'bg-white text-slate-900'}`}>
                {node.role}
              </div>
            </div>
          ))}
        </div>

        {/* Legend / Status */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1">
          {activeAnimationFrames && (
            <div className="bg-slate-900/80 text-court-orange text-xs px-2 py-1 rounded font-mono border border-court-orange/30">
              {t.tactics.animation.step} {currentFrameIndex + 1} / {activeAnimationFrames.length}
            </div>
          )}
          <div className="flex gap-2 text-[10px] text-white bg-slate-900/50 p-1 rounded">
             <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-white opacity-50 border border-white border-dashed"></span> Full Path</span>
             <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-white"></span> Active</span>
             <span className="flex items-center gap-1"><span className="w-2 h-0.5 border-t border-dashed border-orange-500"></span> Ball</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex justify-between items-center shadow-md">
        <div className="flex gap-2">
          {activeAnimationFrames ? (
            <>
               <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 flex items-center justify-center bg-court-orange text-white rounded hover:bg-orange-600 transition-colors"
                title={isPlaying ? t.tactics.animation.pause : t.tactics.animation.play}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button 
                onClick={() => goToFrame(currentFrameIndex - 1)}
                disabled={currentFrameIndex === 0}
                className="w-10 h-10 flex items-center justify-center bg-slate-700 text-slate-200 rounded hover:bg-slate-600 disabled:opacity-50"
              >
                <SkipBack size={18} />
              </button>
               <button 
                onClick={() => goToFrame(currentFrameIndex + 1)}
                disabled={currentFrameIndex === activeAnimationFrames.length - 1}
                className="w-10 h-10 flex items-center justify-center bg-slate-700 text-slate-200 rounded hover:bg-slate-600 disabled:opacity-50"
              >
                <SkipForward size={18} />
              </button>
            </>
          ) : (
            <div className="text-sm text-slate-500 px-2 py-1 italic">No animation data</div>
          )}
        </div>

        {/* Progress Bar for Animation */}
        {activeAnimationFrames && (
          <div className="flex-1 mx-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-court-orange transition-all duration-300"
              style={{ width: `${((currentFrameIndex + 1) / activeAnimationFrames.length) * 100}%` }}
            ></div>
          </div>
        )}

        <div className="flex gap-2">
           <button 
            onClick={() => setShowPaths(!showPaths)}
            className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${showPaths ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            title="Toggle Routes"
          >
            {showPaths ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button 
            onClick={resetBoard}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors"
          >
            <RefreshCcw size={16} /> {t.common.reset}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TacticsBoard;
