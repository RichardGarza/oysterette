/**
 * Flavor attribute label mappings (1-10 scale)
 */

export const getAttributeLabel = (
  attribute: 'size' | 'body' | 'sweetBrininess' | 'flavorfulness' | 'creaminess',
  value: number
): string => {
  const labels = {
    size: [
      { max: 2, label: 'Tiny' },
      { max: 4, label: 'Small' },
      { max: 6, label: 'Medium' },
      { max: 8, label: 'Large' },
      { max: 10, label: 'Huge' },
    ],
    body: [
      { max: 2, label: 'Very Thin' },
      { max: 4, label: 'Thin' },
      { max: 6, label: 'Medium' },
      { max: 8, label: 'Fat' },
      { max: 10, label: 'Extremely Fat' },
    ],
    sweetBrininess: [
      { max: 2, label: 'Very Sweet' },
      { max: 4, label: 'Sweet' },
      { max: 6, label: 'Balanced' },
      { max: 8, label: 'Briny' },
      { max: 10, label: 'Very Salty' },
    ],
    flavorfulness: [
      { max: 2, label: 'Very Mild' },
      { max: 4, label: 'Mild' },
      { max: 6, label: 'Moderate' },
      { max: 8, label: 'Bold' },
      { max: 10, label: 'Extremely Bold' },
    ],
    creaminess: [
      { max: 2, label: 'None' },
      { max: 4, label: 'Light' },
      { max: 6, label: 'Moderate' },
      { max: 8, label: 'Creamy' },
      { max: 10, label: 'Very Creamy' },
    ],
  };

  const attrLabels = labels[attribute];
  for (const range of attrLabels) {
    if (value <= range.max) {
      return range.label;
    }
  }
  return attrLabels[attrLabels.length - 1].label;
};

export const getRangeLabel = (
  attribute: 'size' | 'body' | 'sweetBrininess' | 'flavorfulness' | 'creaminess',
  min: number,
  max: number
): string => {
  const minLabel = getAttributeLabel(attribute, min);
  const maxLabel = getAttributeLabel(attribute, max);

  if (minLabel === maxLabel) {
    return minLabel;
  }

  return `${minLabel} to ${maxLabel}`;
};
