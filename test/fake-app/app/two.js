export  default function(state, route) {
  return Promise.resolve().then(() => {
    return {
      component: 'app/two.jsx!',
      title: 'two'
    };
  });
}
