import pattern from 'url-pattern';

//Returns an ordered list (by most to least general) of route objects matched by the path.
//The routes list returned contains flattened routes, so no huge trees being passed.
//If nothing matches, we return null.
export function match(path, routes) {
  let result = _match(path, '', routes);
  if (!result) return null;

  //Extract the options from the route matches.
  //Also reverse the matched list, as we want most general match to come first.
  let options = result[0].options;
  delete result[0].options;
  return {
    options: options,
    routes: result.reverse()
  };
}

//Recursion helper for match.
//Returns null, or an array of routes currently matched in reverse order.
function _match(path, curPattern, curRoute) {
  //Extract child routes and other params.
  let childRoutes = {};
  let otherParams = {
    _path: curPattern
  };
  Object.keys(curRoute).map((key) => {
    if (key[0] === '/') childRoutes[key] = curRoute[key];
    else otherParams[key] = curRoute[key];
  });

  //No child routes, we check match directly.
  if (Object.keys(childRoutes).length === 0) {
    let match = pattern.newPattern(curPattern).match(path);
    if (match !== null) {
      //Set match options, for instance /hello/(:id) the id.
      //We only set it on the deepest match, then pass it through to zygo in match().
      otherParams.options = match;
      return [otherParams];
    } else return null;
  }

  //Check the path partial matches current pattern, if so recurse on children.
  let match = null;
  if (pattern.newPattern(curPattern + '(.*)').match(path)) {
    Object.keys(childRoutes).map((key) => {
      let result = _match(path, curPattern + key, childRoutes[key]);
      if (result) {
        result.push(otherParams);
        match = result;
      }
    });
  }

  //Return what we have, possibly null.
  return match;
}
