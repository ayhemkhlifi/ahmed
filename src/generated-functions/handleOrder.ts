export function handleOrder(
  orderBy?: OrderBy | null,
  options: { dictionary?: { [key: string]: string[] } } = {}
): Order {
  const dictionary = options.dictionary || {};
  const order: Order = [];
  if (orderBy) {
    for (const [key, value] of Object.entries(orderBy)) {
      const keys = Object.keys(dictionary);
      if (keys.includes(key)) {
        const dictKey = dictionary[key];
        //@ts-ignore
        order.push([...dictKey, value]);
      } else {
        if (value) order.push([key, value]);
      }
    }
  }
  return order;
}