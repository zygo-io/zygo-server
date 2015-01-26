export function handler(context) {
  return Promise.resolve().then(() => {
    return {
      title: 'two'
    };
  });
}
