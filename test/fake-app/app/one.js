export function handler(context) {
  return Promise.resolve().then(() => {
    context.thing = 'forty two';
    return {
      title: 'one'
    };
  });
}

export function serialize(context) {
  context.name = 'bob';
}
