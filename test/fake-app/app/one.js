export function handler(state, route) {
  return Promise.resolve().then(() => {
    return {
      title: 'one'
    };
  });
}

export function serialize(context, state) {
  context.name = 'bob';
}
