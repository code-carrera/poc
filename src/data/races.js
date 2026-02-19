export const RACES = {
  'circuit-01': {
    id: 'circuit-01',
    name: 'Circuit 01',
    subtitle: 'Sum or Max',
    description:
      'Each array needs either its SUM or its MAX — determined by the first element. ' +
      'The threshold that decides which operation to apply is hidden. ' +
      'Discover it in real-time using the SLIDER while the race runs.',
    steps: 20,
    totalUnits: 100,
    reward: 120,
    locked: false,
    difficulty: 1,
  },
  'circuit-02': {
    id: 'circuit-02',
    name: 'Circuit 02',
    subtitle: 'Even & Odd',
    description:
      'Two hidden thresholds — one for even first elements, one for odd. ' +
      'Use SLIDER_1 for the even threshold and SLIDER_2 for the odd one. ' +
      'Same rule: arr[0] > threshold → MAX; otherwise → SUM. ' +
      'Discover both thresholds in real-time while the race runs.',
    steps: 20,
    totalUnits: 100,
    reward: 200,
    locked: false,
    difficulty: 2,
  },
}
