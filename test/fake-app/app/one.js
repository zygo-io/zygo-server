export function handler(state, route) {
  return Promise.resolve().then(() => {
    return {
      title: 'one'
    };
  });
}

export var component = 'app/one.jsx!';
