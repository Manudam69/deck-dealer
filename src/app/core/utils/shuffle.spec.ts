import { shuffle } from './shuffle';

describe('shuffle', () => {
  it('returns a new array with the same items', () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffle(original);

    expect(result).not.toBe(original);
    expect(result).toHaveLength(original.length);
    expect(result.sort()).toEqual([...original].sort());
  });

  it('does not mutate the input array', () => {
    const original = ['a', 'b', 'c'];
    shuffle(original);
    expect(original).toEqual(['a', 'b', 'c']);
  });

  it('handles an empty array', () => {
    expect(shuffle([])).toEqual([]);
  });
});
