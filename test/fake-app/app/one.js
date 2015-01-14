export  default function(state, route) {
  return Promise.resolve().then(() => {
    return {
      component: 'app/one.jsx!',
      title: 'one'
    };
  });
}
