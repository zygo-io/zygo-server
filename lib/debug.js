import {RouteRedirect} from './routes';

export var mode = {
  debugMode: false
};

//A simple error handling function that propagates an error
// with an optional message if we are in debug mode.
export function propagate(msg) {
  return function(error) {
    if (error instanceof RouteRedirect) throw error;

    if (mode.debugMode) {
      console.log(msg + error);
    }

    throw error;
  };
}
