export function handler(state, route) {
  return Promise.resolve().then(() => {
    return {
      title: 'two'
    };
  });
}

export var component = 'app/two.jsx!';
