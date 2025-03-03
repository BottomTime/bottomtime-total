export function getDifficultyString(difficulty?: number): string {
  if (difficulty === undefined) return 'Not rated';
  else if (difficulty >= 4.5)
    return 'Extremely difficult, suitable only for highly-experienced or technical divers';
  else if (difficulty >= 3.5)
    return 'Challenging, suitable for more experienced or advanced divers';
  else if (difficulty >= 2.5)
    return 'Moderate difficulty, suitable for most divers with some experience (e.g. deeper dives, wreck dives, drift dives, etc.)';
  else if (difficulty >= 1.5)
    return 'Easy diving with some additional considerations (e.g. cold water, currents, etc.)';
  else if (difficulty >= 0.5) return 'Easy-peasy, suitable for all divers';
  else return 'Confined water, suitable for training new divers';
}
