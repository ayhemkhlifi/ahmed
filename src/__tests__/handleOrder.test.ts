import { handleOrder } from '../generated-functions/handleOrder';

type OrderBy = { [key: string]: string };
type Order = (string | number)[][];

describe('handleOrder', () => {
  it('should handle typical input correctly', () => {
    const orderBy: OrderBy = { field1: 'asc', field2: 'desc' };
    const options = { dictionary: { field1: ['value1', 'value2'] } };
    const expectedOrder: Order = [['value1', 'value2', 'asc'], ['field2', 'desc']];
    expect(handleOrder(orderBy, options)).toEqual(expectedOrder);
  });

  it('should handle edge cases properly', () => {
    const orderBy: OrderBy = {};
    const options = { dictionary: {} };
    const expectedOrder: Order = [];
    expect(handleOrder(orderBy, options)).toEqual(expectedOrder);
  });

  it('should handle null orderBy properly', () => {
    const orderBy: OrderBy | null = null;
    const options = { dictionary: { field1: ['value1'] } };
    const expectedOrder: Order = [];
    expect(handleOrder(orderBy, options)).toEqual(expectedOrder);
  });


  it('should handle complex scenario correctly', () => {
    const orderBy: OrderBy = { field1: 'asc', field3: 'desc', field2: 'asc' };
    const options = { dictionary: { field1: ['value1', 'value2'], field2: ['val1', 'val2'] } };
    const expectedOrder: Order = [['value1', 'value2', 'asc'], ['field3', 'desc'], ['val1', 'val2', 'asc']];
    expect(handleOrder(orderBy, options)).toEqual(expectedOrder);
  });
});